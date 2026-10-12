
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

let currentLanguage = "es";

const languageButton = document.getElementById("language-toggle");
const themeButton = document.getElementById("theme-toggle");
const root = document.documentElement;
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function changeLanguage() {
    currentLanguage = currentLanguage === "es" ? "en" : "es";

    const texts = translations[currentLanguage];

    root.lang = currentLanguage;
    document.title = texts.pageTitle;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.dataset.i18n;

        if (texts[key] !== undefined) {
            element.textContent = texts[key];
        }
    });

    updateLanguageButton();
    updateThemeButton();
}

function updateLanguageButton() {
    languageButton.textContent = translations[currentLanguage].language;
}

function getCurrentTheme() {
    return root.dataset.theme || "light";
}

function applyTheme(theme) {
    root.dataset.theme = theme;
    updateThemeButton();
}

function updateThemeButton() {
    const texts = translations[currentLanguage];
    const isDark = getCurrentTheme() === "dark";

    themeButton.textContent = isDark
        ? texts.themeLight
        : texts.themeDark;

    themeButton.setAttribute(
        "aria-label",
        themeButton.textContent
    );
}

function toggleTheme() {
    const newTheme = getCurrentTheme() === "dark"
        ? "light"
        : "dark";

    try {
        localStorage.setItem("luna-cafe-theme", newTheme);
    } catch (error) {
        console.warn("No se pudo guardar la preferencia del tema.");
    }

    applyTheme(newTheme);
}

function initializeTheme() {
    let savedTheme = null;

    try {
        savedTheme = localStorage.getItem("luna-cafe-theme");
    } catch (error) {
        console.warn("No se pudo leer la preferencia del tema.");
    }

    const initialTheme = savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : (systemTheme.matches ? "dark" : "light");

    applyTheme(initialTheme);
}

languageButton.addEventListener("click", changeLanguage);
themeButton.addEventListener("click", toggleTheme);

systemTheme.addEventListener("change", (event) => {
    let savedTheme = null;

    try {
        savedTheme = localStorage.getItem("luna-cafe-theme");
    } catch (error) {
        // Si el almacenamiento no está disponible, no se cambia automáticamente.
        return;
    }

    if (savedTheme !== "light" && savedTheme !== "dark") {
        applyTheme(event.matches ? "dark" : "light");
    }
});

initializeTheme();
updateLanguageButton();
