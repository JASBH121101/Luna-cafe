import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../", import.meta.url)));
const OUTPUT = resolve(ROOT, "artifacts/jb-expert-qa");
const PORT = Number(process.env.PORT || 4173);
const FAILURES = [];
const WARNINGS = [];
const RESULTS = [];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function addFailure(code, message, details = {}) {
  FAILURES.push({ code, message, ...details });
}

function addWarning(code, message, details = {}) {
  WARNINGS.push({ code, message, ...details });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    let target = resolve(ROOT, relative);
    if (target !== ROOT && !target.startsWith(ROOT + sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    try {
      const info = await stat(target);
      if (info.isDirectory()) target = resolve(target, "index.html");
    } catch {}
    const body = await readFile(target);
    res.writeHead(200, {
      "content-type": MIME[extname(target).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

async function waitForImages(page) {
  return page.evaluate(async () => {
    const images = Array.from(document.images);
    images.forEach((image) => { image.loading = "eager"; });
    await Promise.all(images.map((image) => new Promise((resolve) => {
      if (image.complete) return resolve();
      const timeout = window.setTimeout(resolve, 7000);
      image.addEventListener("load", () => { clearTimeout(timeout); resolve(); }, { once: true });
      image.addEventListener("error", () => { clearTimeout(timeout); resolve(); }, { once: true });
    })));
    return images
      .filter((image) => image.currentSrc && (!image.complete || image.naturalWidth === 0))
      .map((image) => ({ src: image.currentSrc || image.src, alt: image.alt || "" }));
  });
}

async function auditViewport(browser, origin, viewport) {
  const mobile = viewport.width <= 760;
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    colorScheme: "light",
  });
  const page = await context.newPage();
  const pageErrors = [];
  const localRequestFailures = [];

  page.on("pageerror", (error) => pageErrors.push({ message: error.message, stack: error.stack || "" }));
  page.on("requestfailed", (request) => {
    if (request.url().startsWith(origin)) {
      localRequestFailures.push({ url: request.url(), error: request.failure()?.errorText || "request failed" });
    }
  });

  try {
    await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.locator("#menu .product-card").first().waitFor({ state: "attached", timeout: 10000 });
    await page.waitForTimeout(180);

    const layout = await page.evaluate(() => {
      const rect = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const box = element.getBoundingClientRect();
        return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
      };
      const body = document.body;
      const root = document.documentElement;
      return {
        viewportWidth: window.innerWidth,
        documentWidth: Math.max(root.scrollWidth, body.scrollWidth),
        overflowPx: Math.max(root.scrollWidth, body.scrollWidth) - window.innerWidth,
        theme: root.dataset.theme || "unset",
        headerPosition: getComputedStyle(document.querySelector(".site-header")).position,
        header: rect(".site-header"),
        hero: rect("#inicio"),
        menu: rect("#menu"),
        productGrid: rect(".product-grid"),
        visibleCards: Array.from(document.querySelectorAll(".product-card")).filter((card) => !card.hidden).length,
        totalCards: document.querySelectorAll(".product-card").length,
        watermarkBefore: getComputedStyle(body, "::before").content,
        watermarkAfter: getComputedStyle(body, "::after").content,
        pseudoWatermarkText: [getComputedStyle(body, "::before").content, getComputedStyle(body, "::after").content]
          .some((value) => /café\\s+lune/i.test(value)),
      };
    });

    if (layout.overflowPx > 2) {
      addFailure("HORIZONTAL_OVERFLOW", `Horizontal overflow of ${layout.overflowPx}px at ${viewport.name}.`, { viewport: viewport.name, layout });
    }
    if (layout.headerPosition !== "sticky") {
      addFailure("HEADER_NOT_STICKY", `Header is not sticky at ${viewport.name}.`, { viewport: viewport.name, position: layout.headerPosition });
    }
    if (!layout.header || layout.header.width < viewport.width * 0.9) {
      addFailure("HEADER_WIDTH", `Header does not occupy the expected width at ${viewport.name}.`, { viewport: viewport.name, header: layout.header });
    }
    if (!layout.visibleCards || !layout.totalCards) {
      addFailure("PRODUCTS_NOT_VISIBLE", `No menu products were visible at ${viewport.name}.`, { viewport: viewport.name });
    }
    if (layout.pseudoWatermarkText) {
      addFailure("REMOVED_WATERMARK_RETURNED", `The deprecated Café Lune side watermark is still rendered at ${viewport.name}.`, { viewport: viewport.name });
    }

    const brokenImages = await waitForImages(page);
    if (brokenImages.length) {
      addFailure("BROKEN_IMAGES", `Broken images detected at ${viewport.name}.`, { viewport: viewport.name, images: brokenImages });
    }

    const startTheme = layout.theme;
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, theme);
      const contrastChecks = await page.evaluate(() => {
        const parse = (value) => {
          const match = value.match(/[\\d.]+/g);
          if (!match || match.length < 3) return null;
          return match.slice(0, 3).map(Number);
        };
        const luminance = (rgb) => {
          const channels = rgb.map((channel) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
        };
        const ratio = (foreground, background) => {
          const fg = parse(foreground), bg = parse(background);
          if (!fg || !bg) return null;
          const a = luminance(fg), b = luminance(bg);
          return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
        };
        const targets = [
          ["Desktop: Todo el menú", '#menu .menu-filters [data-menu-filter="all"]'],
          ["Móvil: Todo el menú", '#menu #mobile-filter-options [data-menu-filter="all"]'],
          ["Encontrá tu favorito", ".about-button"],
          ["Empezar a elegir", ".steps-button"],
          ["Descubrir el menú", ".hero-button"],
          ["Acción de confirmar pedido", ".product-confirmation-actions .button-primary"],
        ];
        return targets.map(([label, selector]) => {
          const element = document.querySelector(selector);
          if (!element) return { label, selector, missing: true };
          const style = getComputedStyle(element);
          return {
            label, selector, foreground: style.color, background: style.backgroundColor,
            ratio: ratio(style.color, style.backgroundColor),
          };
        });
      });
      for (const item of contrastChecks) {
        if (item.missing || item.ratio === null || item.ratio < 4.5) {
          addFailure("BUTTON_COLOR_CONTRAST", `Button contrast failed in ${theme} theme: ${item.label}.`, {
            viewport: viewport.name, theme, check: item,
          });
        }
      }
    }
    await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, startTheme);
    await page.locator("#theme-toggle").click();
    const switchedTheme = await page.locator("html").getAttribute("data-theme");
    if (switchedTheme === startTheme || !["dark", "light"].includes(switchedTheme)) {
      addFailure("THEME_TOGGLE_FAILED", `Theme toggle did not switch at ${viewport.name}.`, { viewport: viewport.name, startTheme, switchedTheme });
    }
    await page.locator("#theme-toggle").click();
    const restoredTheme = await page.locator("html").getAttribute("data-theme");
    if (restoredTheme !== startTheme) {
      addFailure("THEME_TOGGLE_RESTORE_FAILED", `Theme toggle did not restore the original theme at ${viewport.name}.`, { viewport: viewport.name, startTheme, restoredTheme });
    }

    if (mobile) {
      await page.locator("#menu-toggle").click();
      const navExpanded = await page.locator("#menu-toggle").getAttribute("aria-expanded");
      if (navExpanded !== "true") {
        addFailure("MOBILE_NAV_FAILED", "Mobile navigation did not open.", { viewport: viewport.name });
      }
      await page.locator('#site-navigation a[href="#menu"]').click();
      const navClosed = await page.locator("#menu-toggle").getAttribute("aria-expanded");
      if (navClosed !== "false") {
        addFailure("MOBILE_NAV_CLOSE_FAILED", "Mobile navigation did not close after selecting a section.", { viewport: viewport.name });
      }

      await page.locator("#mobile-filter-toggle").click();
      const filterExpanded = await page.locator("#mobile-filter-toggle").getAttribute("aria-expanded");
      if (filterExpanded !== "true") {
        addFailure("MOBILE_FILTER_FAILED", "Mobile filter menu did not open.", { viewport: viewport.name });
      }
      await page.locator('#mobile-filter-options [data-menu-filter="dessert"]').click();
      const activeFilter = await page.locator('#mobile-filter-options [data-menu-filter="dessert"]').getAttribute("aria-pressed");
      if (activeFilter !== "true") {
        addFailure("MOBILE_FILTER_SELECTION_FAILED", "Mobile dessert filter did not become active.", { viewport: viewport.name });
      }
    } else {
      await page.locator('.menu-filters [data-menu-filter="frappe"]').click();
      const activeFilter = await page.locator('.menu-filters [data-menu-filter="frappe"]').getAttribute("aria-pressed");
      const filteredCards = await page.locator("#menu .product-card:not([hidden])").count();
      if (activeFilter !== "true" || filteredCards < 1) {
        addFailure("DESKTOP_FILTER_FAILED", "Desktop category filter did not update the menu.", { viewport: viewport.name, activeFilter, filteredCards });
      }

      await page.locator("#cart-toggle").click();
      const cartOpen = await page.locator("body").evaluate((el) => el.classList.contains("cart-open"));
      if (!cartOpen) addFailure("CART_OPEN_FAILED", "Cart drawer did not open.", { viewport: viewport.name });
      await page.locator("#close-cart").click();
      const cartClosed = await page.locator("body").evaluate((el) => !el.classList.contains("cart-open"));
      if (!cartClosed) addFailure("CART_CLOSE_FAILED", "Cart drawer did not close.", { viewport: viewport.name });
    }

    if (pageErrors.length) {
      addFailure("BROWSER_RUNTIME_ERRORS", `Browser JavaScript errors at ${viewport.name}.`, { viewport: viewport.name, errors: pageErrors });
    }
    if (localRequestFailures.length) {
      addFailure("LOCAL_ASSET_REQUEST_FAILURES", `Local assets failed to load at ${viewport.name}.`, { viewport: viewport.name, requests: localRequestFailures });
    }

    if (viewport.name === "desktop-1600" || viewport.name === "mobile-390") {
      for (const theme of ["light", "dark"]) {
        await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, theme);
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        const serious = axe.violations.filter((violation) => ["critical", "serious"].includes(violation.impact));
        if (serious.length) {
          addFailure("ACCESSIBILITY_CRITICAL", `Axe reported ${serious.length} serious/critical accessibility issue groups at ${viewport.name} (${theme}).`, {
            viewport: viewport.name, theme,
            violations: serious.map((item) => ({ id: item.id, impact: item.impact, description: item.description, nodes: item.nodes.slice(0, 4).map(node => ({ target: node.target, summary: node.failureSummary })) })),
          });
        }
        const moderate = axe.violations.filter((violation) => ["moderate", "minor"].includes(violation.impact));
        if (moderate.length) {
          addWarning("ACCESSIBILITY_REVIEW", `Axe reported ${moderate.length} moderate/minor issue groups at ${viewport.name} (${theme}).`, {
            viewport: viewport.name, theme,
            violations: moderate.map((item) => ({ id: item.id, impact: item.impact, description: item.description, nodes: item.nodes.slice(0, 3).map(node => ({ target: node.target, summary: node.failureSummary })) })),
          });
        }
      }
      await page.evaluate(() => { document.documentElement.dataset.theme = "light"; });
    }

    await mkdir(OUTPUT, { recursive: true });
    await page.screenshot({ path: resolve(OUTPUT, `${viewport.name}.png`), fullPage: true, animations: "disabled" });
    RESULTS.push({ viewport: viewport.name, layout, pageErrors, localRequestFailures, brokenImages });
  } finally {
    await context.close();
  }
}

async function main() {
  const css = await readFile(resolve(ROOT, "style.css"), "utf8");
  if (/content\\s*:\\s*["']Café Lune["']/i.test(css)) {
    addFailure("WATERMARK_CSS_REMAINS", "Deprecated Café Lune pseudo-element watermark rule remains in style.css.");
  }

  const index = await readFile(resolve(ROOT, "index.html"), "utf8");
  if (!index.includes("style.css?v=20261112-expert-qa-desktop1")) {
    addFailure("STALE_STYLESHEET_CACHE", "index.html does not reference the current Luna Café stylesheet revision.");
  }

  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(PORT, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true });

  try {
    const viewports = [
      { name: "desktop-1600", width: 1600, height: 1000 },
      { name: "desktop-1365", width: 1365, height: 900 },
      { name: "mobile-390", width: 390, height: 844 },
      { name: "mobile-360", width: 360, height: 800 },
    ];
    for (const viewport of viewports) await auditViewport(browser, origin, viewport);
  } finally {
    await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }

  const report = {
    engine: "JB Expert QA",
    project: "Luna Café",
    mode: "deterministic-read-only",
    paidServicesEnabled: false,
    aiVisualReview: "disabled",
    createdAt: new Date().toISOString(),
    summary: {
      viewports: RESULTS.length,
      failures: FAILURES.length,
      warnings: WARNINGS.length,
      passed: FAILURES.length === 0,
    },
    results: RESULTS,
    failures: FAILURES,
    warnings: WARNINGS,
  };

  await mkdir(OUTPUT, { recursive: true });
  await writeFile(resolve(OUTPUT, "report.json"), JSON.stringify(report, null, 2), "utf8");
  const lines = [
    "# JB Expert QA — Luna Café",
    "",
    `- Mode: ${report.mode}`,
    `- Viewports: ${report.summary.viewports}`,
    `- Failures: ${report.summary.failures}`,
    `- Warnings: ${report.summary.warnings}`,
    `- Result: ${report.summary.passed ? "PASS" : "FAIL"}`,
    "",
    "## Results",
    ...RESULTS.map((item) => `- ${item.viewport}: width ${item.layout.viewportWidth}px, document ${item.layout.documentWidth}px, overflow ${item.layout.overflowPx}px, ${item.layout.visibleCards}/${item.layout.totalCards} cards visible`),
    "",
    "## Failures",
    ...(FAILURES.length ? FAILURES.map((item) => `- [${item.code}] ${item.message}`) : ["- None"]),
    "",
    "## Warnings",
    ...(WARNINGS.length ? WARNINGS.map((item) => `- [${item.code}] ${item.message}`) : ["- None"]),
    "",
    "This report is deterministic and read-only. AI review is disabled; all visual changes require human review.",
  ];
  await writeFile(resolve(OUTPUT, "report.md"), lines.join("\n"), "utf8");

  console.log(lines.join("\n"));
  if (FAILURES.length) {
    console.log("\\nDetailed failures:\\n" + JSON.stringify(FAILURES, null, 2));
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error("JB Expert QA failed unexpectedly:", error);
  try { await server.close(); } catch {}
  process.exitCode = 1;
});
