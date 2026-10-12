
const translations = {
    es: {
        language: "English",
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

function changeLanguage() {
    currentLanguage = currentLanguage === "es" ? "en" : "es";

    document.documentElement.lang = currentLanguage;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.dataset.i18n;
        element.textContent = translations[currentLanguage][key];
    });
}

document
    .getElementById("language-toggle")
    .addEventListener("click", changeLanguage);
