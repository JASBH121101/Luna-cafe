
const translations = {
    es: {
        languageShort: "EN",
        languageFull: "English",
        languageLabel: "Cambiar idioma",
        themeDark: "Modo oscuro",
        themeLight: "Modo claro",
        openMenu: "Abrir menú",
        closeMenu: "Cerrar menú",

        pageTitle: "Luna Café | Un momento para vos",

        home: "Inicio",
        menu: "Menú",
        about: "Nosotros",
        contact: "Contacto",

        eyebrow: "CAFÉ DE ESPECIALIDAD",
        headline: "Un momento para vos.",
        intro: "Café artesanal, sabores auténticos y un espacio para disfrutar cada pequeño momento.",
        discover: "Descubrir el menú",

        menuTitle: "Nuestro menú",
        menuSubtitle: "Buenos momentos, servidos en una taza.",

        espressoDesc: "Intenso, aromático y lleno de carácter.",
        latteDesc: "Espresso suave con leche cremosa.",
        cappuccinoDesc: "Equilibrio perfecto entre café y espuma.",

        aboutTitle: "Más que café",
        aboutText: "Luna Café es un lugar para bajar el ritmo, compartir conversaciones y disfrutar algo especial.",

        contactTitle: "Visitanos",
        contactText: "Pronto compartiremos nuestra ubicación y horarios.",

        footer: "© 2026 Luna Café. Todos los derechos reservados."
    },

    en: {
        languageShort: "ES",
        languageFull: "Español",
        languageLabel: "Change language",
        themeDark: "Dark mode",
        themeLight: "Light mode",
        openMenu: "Open menu",
        closeMenu: "Close menu",

        pageTitle: "Luna Café | A moment just for you",

        home: "Home",
        menu: "Menu",
        about: "About us",
        contact: "Contact",

        eyebrow: "SPECIALTY COFFEE",
        headline: "A moment just for you.",
        intro: "Artisan coffee, authentic flavors, and a space to enjoy every little moment.",
        discover: "Explore the menu",

        menuTitle: "Our menu",
        menuSubtitle: "Good moments, served in a cup.",

        espressoDesc: "Bold, aromatic, and full of character.",
        latteDesc: "Smooth espresso with creamy milk.",
        cappuccinoDesc: "The perfect balance of coffee and foam.",

        aboutTitle: "More than coffee",
        aboutText: "Luna Café is a place to slow down, share conversations, and enjoy something special.",

        contactTitle: "Visit us",
        contactText: "Our location and opening hours will be available soon.",

        footer: "© 2026 Luna Café. All rights reserved."
    }
};

function initLunaCafe() {
    const root = document.documentElement;

    const nav = document.getElementById("site-navigation");
    const menuButton = document.getElementById("menu-toggle");
    const menuButtonLabel = document.getElementById("menu-toggle-label");

    const languageButton = document.getElementById("language-toggle");
    const languageLabelShort = document.getElementById("language-label-short");
    const languageLabelFull = document.getElementById("language-label-full");

    const themeButton = document.getElementById("theme-toggle");
    const themeLabel = document.getElementById("theme-label");

    const systemTheme = window.matchMedia
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;

    if (
        !nav ||
        !menuButton ||
        !menuButtonLabel ||
        !languageButton ||
        !languageLabelShort ||
        !languageLabelFull ||
        !themeButton ||
        !themeLabel
    ) {
        console.error(
            "Luna Café: falta un elemento de navegación. Revisá index.html."
        );
        return;
    }

    let currentLanguage = "es";

    function updateMenuButton() {
        const texts = translations[currentLanguage];
        const isOpen = nav.classList.contains("is-open");
        const label = isOpen ? texts.closeMenu : texts.openMenu;

        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute("aria-label", label);
        menuButtonLabel.textContent = label;
    }

    function updateLanguageButton() {
        const texts = translations[currentLanguage];

        languageLabelShort.textContent = texts.languageShort;
        languageLabelFull.textContent = texts.languageFull;

        languageButton.setAttribute("aria-label", texts.languageLabel);
        languageButton.setAttribute("title", texts.languageLabel);
    }

    function updateThemeButton() {
        const texts = translations[currentLanguage];
        const isDark = root.dataset.theme === "dark";
        const label = isDark ? texts.themeLight : texts.themeDark;

        themeLabel.textContent = label;
        themeButton.setAttribute("aria-pressed", String(isDark));
        themeButton.setAttribute("aria-label", label);
        themeButton.setAttribute("title", label);
    }

    function setLanguage(language) {
        currentLanguage = language;
        const texts = translations[currentLanguage];

        root.lang = currentLanguage;
        document.title = texts.pageTitle;

        document.querySelectorAll("[data-i18n]").forEach((element) => {
            const key = element.dataset.i18n;

            if (Object.prototype.hasOwnProperty.call(texts, key)) {
                element.textContent = texts[key];
            }
        });

        updateLanguageButton();
        updateThemeButton();
        updateMenuButton();
    }

    function getSavedTheme() {
        try {
            return localStorage.getItem("luna-cafe-theme");
        } catch (error) {
            return null;
        }
    }

    function setTheme(theme, remember = false) {
        root.dataset.theme = theme;

        if (remember) {
            try {
                localStorage.setItem("luna-cafe-theme", theme);
            } catch (error) {
                console.warn(
                    "No se pudo guardar el tema en este navegador."
                );
            }
        }

        updateThemeButton();
    }

    function toggleMenu() {
        nav.classList.toggle("is-open");
        updateMenuButton();
    }

    function closeMenu() {
        nav.classList.remove("is-open");
        updateMenuButton();
    }

    menuButton.addEventListener("click", toggleMenu);

    nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && nav.classList.contains("is-open")) {
            closeMenu();
            menuButton.focus();
        }
    });

    document.addEventListener("click", (event) => {
        if (
            nav.classList.contains("is-open") &&
            !nav.contains(event.target) &&
            !menuButton.contains(event.target)
        ) {
            closeMenu();
        }
    });

    languageButton.addEventListener("click", () => {
        const nextLanguage = currentLanguage === "es" ? "en" : "es";
        setLanguage(nextLanguage);
    });

    themeButton.addEventListener("click", () => {
        const nextTheme = root.dataset.theme === "dark"
            ? "light"
            : "dark";

        setTheme(nextTheme, true);
    });

    const savedTheme = getSavedTheme();

    const initialTheme =
        savedTheme === "light" || savedTheme === "dark"
            ? savedTheme
            : (systemTheme && systemTheme.matches ? "dark" : "light");

    setTheme(initialTheme);
    setLanguage("es");
    closeMenu();

    if (systemTheme && systemTheme.addEventListener) {
        systemTheme.addEventListener("change", (event) => {
            const preference = getSavedTheme();

            if (preference !== "light" && preference !== "dark") {
                setTheme(event.matches ? "dark" : "light");
            }
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLunaCafe);
} else {
    initLunaCafe();
}
