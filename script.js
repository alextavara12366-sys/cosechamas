script.js
/* =====================================================
   MENÚ MÓVIL
===================================================== */

const menuToggle =
    document.getElementById("menuToggle");

const navMenu =
    document.getElementById("navMenu");


menuToggle.addEventListener("click", () => {

    navMenu.classList.toggle("active");

});


/* =====================================================
   CERRAR MENÚ AL SELECCIONAR UNA OPCIÓN
===================================================== */

const navLinks =
    document.querySelectorAll(".nav-menu a");


navLinks.forEach(link => {

    link.addEventListener("click", () => {

        navMenu.classList.remove("active");

    });

});


/* =====================================================
   MODO OSCURO
===================================================== */

const themeButton =
    document.getElementById("themeButton");


themeButton.addEventListener("click", () => {

    document.body.classList.toggle("dark-mode");


    if (
        document.body.classList.contains("dark-mode")
    ) {

        themeButton.textContent = "☀️";

        localStorage.setItem(
            "cosechamas-theme",
            "dark"
        );

    }

    else {

        themeButton.textContent = "🌙";

        localStorage.setItem(
            "cosechamas-theme",
            "light"
        );

    }

});


/* =====================================================
   CARGAR TEMA GUARDADO
===================================================== */

const savedTheme =
    localStorage.getItem("cosechamas-theme");


if (savedTheme === "dark") {

    document.body.classList.add("dark-mode");

    themeButton.textContent = "☀️";

}


/* =====================================================
   MODAL DE SERVICIOS
===================================================== */

const serviceButtons =
    document.querySelectorAll(".service-detail");

const serviceModal =
    document.getElementById("serviceModal");

const modalClose =
    document.getElementById("modalClose");

const modalTitle =
    document.getElementById("modalTitle");

const modalDescription =
    document.getElementById("modalDescription");

const modalIcon =
    document.getElementById("modalIcon");


const serviceInformation = {

    tecnica: {

        title:
            "Asesoría Técnica Especializada",

        icon:
            "🌱",

        description:
            "Te acompañamos durante tu campaña agrícola con análisis de suelo, planes de fertilización, monitoreo de plagas y enfermedades y recomendaciones para utilizar el agua de manera eficiente."

    },


    comercial: {

        title:
            "Estrategia y Gestión Comercial",

        icon:
            "📊",

        description:
            "Te ayudamos a conocer los precios del mercado, identificar mejores canales de comercialización y prepararte para negociar directamente con distribuidores y agroindustrias."

    },


    tecnologia: {

        title:
            "Herramientas Tecnológicas 2.0",

        icon:
            "🛰️",

        description:
            "Integramos herramientas digitales como monitoreo satelital, sensores y calendarios agrícolas para que puedas tomar decisiones basadas en información de tu propio campo."

    }

};


serviceButtons.forEach(button => {

    button.addEventListener("click", () => {

        const service =
            button.dataset.service;


        const information =
            serviceInformation[service];


        modalTitle.textContent =
            information.title;


        modalIcon.textContent =
            information.icon;


        modalDescription.textContent =
            information.description;


        serviceModal.classList.add("active");

    });

});


modalClose.addEventListener("click", () => {

    serviceModal.classList.remove("active");

});


serviceModal.addEventListener("click", event => {

    if (
        event.target === serviceModal
    ) {

        serviceModal.classList.remove("active");

    }

});


/* =====================================================
   FORMULARIO
===================================================== */

const contactForm =
    document.getElementById("contactForm");


contactForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const name =
            document.getElementById("name").value;

        const phone =
            document.getElementById("phone").value;

        const crop =
            document.getElementById("crop").value;

        const message =
            document.getElementById("message").value;


        if (
            name === "" ||
            phone === "" ||
            crop === "" ||
            message === ""
        ) {

            alert(
                "Por favor completa todos los campos."
            );

            return;

        }


        const whatsappMessage =

            `Hola CosechaMas,%0A%0A` +

            `Mi nombre es ${name}.%0A` +

            `Mi WhatsApp es ${phone}.%0A` +

            `Mi cultivo es: ${crop}.%0A%0A` +

            `Quisiera solicitar asesoría.%0A%0A` +

            `Mensaje:%0A${message}`;


        const whatsappNumber =
            "51999999999";


        const whatsappURL =

            `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;


        window.open(
            whatsappURL,
            "_blank"
        );


        contactForm.reset();

    }
);


/* =====================================================
   ANIMACIÓN AL APARECER
===================================================== */

const animatedElements =
    document.querySelectorAll(
        ".benefit-card, .service-card, .step, .testimonial-card"
    );


const observer =
    new IntersectionObserver(

        entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add(
                        "show"
                    );

                }

            });

        },

        {
            threshold: 0.12
        }

    );


animatedElements.forEach(element => {

    observer.observe(element);

});