
const translations = {
    es: {
        language: "English",
        themeDark: "Modo oscuro",
        themeLight: "Modo claro",
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
        language: "Español",
        themeDark: "Dark mode",
        themeLight: "Light mode",
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
    const languageButton = document.getElementById("language-toggle");
    const themeButton = document.getElementById("theme-toggle");

    if (!languageButton || !themeButton) {
        console.error("Luna Café: no se encontraron los botones de idioma y tema.");
        return;
    }

    const root = document.documentElement;
    const systemTheme = window.matchMedia
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;

    let currentLanguage = "es";

    function getSavedTheme() {
        try {
            return localStorage.getItem("luna-cafe-theme");
        } catch (error) {
            return null;
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem("luna-cafe-theme", theme);
        } catch (error) {
            console.warn("No se pudo guardar la preferencia del tema.");
        }
    }

    function updateLanguageButton() {
        languageButton.textContent = translations[currentLanguage].language;
    }

    function updateThemeButton() {
        const isDark = root.dataset.theme === "dark";
        const texts = translations[currentLanguage];

        themeButton.textContent = isDark
            ? texts.themeLight
            : texts.themeDark;

        themeButton.setAttribute("aria-pressed", String(isDark));
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
    }

    function setTheme(theme, remember = false) {
        root.dataset.theme = theme;

        if (remember) {
            saveTheme(theme);
        }

        updateThemeButton();
    }

    function toggleLanguage() {
        setLanguage(currentLanguage === "es" ? "en" : "es");
    }

    function toggleTheme() {
        const newTheme = root.dataset.theme === "dark"
            ? "light"
            : "dark";

        setTheme(newTheme, true);
    }

    languageButton.addEventListener("click", toggleLanguage);
    themeButton.addEventListener("click", toggleTheme);

    const savedTheme = getSavedTheme();

    const initialTheme =
        savedTheme === "dark" || savedTheme === "light"
            ? savedTheme
            : (systemTheme && systemTheme.matches ? "dark" : "light");

    setTheme(initialTheme);
    setLanguage("es");

    if (systemTheme && systemTheme.addEventListener) {
        systemTheme.addEventListener("change", (event) => {
            const preference = getSavedTheme();

            if (preference !== "dark" && preference !== "light") {
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
