
const translations = {
    es: {
        language: "English",
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
        themeDark: "Modo oscuro",
        themeLight: "Modo claro",
    },

    en: {
        language: "Español",
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
        footer: "© 2026 Luna Café. All rights reserved."themeDark: "Dark mode",
        themeLight: "Light mode",
    }
};

let currentLanguage = "es";

function changeLanguage() {
    currentLanguage = currentLanguage === "es" ? "en" : "es";

    const currentTranslations = translations[currentLanguage];

    document.documentElement.lang = currentLanguage;
    document.title = currentTranslations.pageTitle;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.dataset.i18n;

        if (currentTranslations[key] !== undefined) {
            element.textContent = currentTranslations[key];
            updateThemeButton();
        }
    });

    document.getElementById("language-toggle").textContent =
        currentTranslations.language;
}

document
    .getElementById("language-toggle")
    .addEventListener("click", changeLanguage);

const themeButton = document.getElementById("theme-toggle");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    updateThemeButton();
}

function updateThemeButton() {
    if (!themeButton) return;

    const labels = translations[currentLanguage];
    const isDark = document.documentElement.dataset.theme === "dark";

    themeButton.textContent = isDark
        ? labels.themeLight
        : labels.themeDark;
}

function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme;
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    localStorage.setItem("luna-cafe-theme", newTheme);
    applyTheme(newTheme);
}

function initializeTheme() {
    const savedTheme = localStorage.getItem("luna-cafe-theme");

    const initialTheme = savedTheme ||
        (systemTheme.matches ? "dark" : "light");

    applyTheme(initialTheme);
}

themeButton.addEventListener("click", toggleTheme);

systemTheme.addEventListener("change", (event) => {
    const savedTheme = localStorage.getItem("luna-cafe-theme");

    if (!savedTheme) {
        applyTheme(event.matches ? "dark" : "light");
    }
});

initializeTheme();
