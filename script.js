// CosechaMas: menú móvil, modo claro/oscuro, enlaces de WhatsApp y formulario de diagnóstico.
(() => {
  "use strict";

  // ===================== CONFIGURACIÓN =====================
  // CAMBIAR: número real de WhatsApp de CosechaMas.
  // Formato internacional, solo números (ej. 51987654321).
  const WHATSAPP_NUMBER = "51999999999";
  const DEFAULT_MESSAGE = "Hola, quiero información sobre CosechaMas y asesoría agrícola.";
  const THEME_KEY = "cosechamas-theme";
  // ==========================================================

  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const themeLabel = themeToggle?.querySelector(".theme-label");
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  const waUrl = (message) =>
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  // Registra clics en Google Analytics / Tag Manager si están instalados.
  function track(eventName, params = {}) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...params });
    }
  }

  // ---------- WhatsApp: cada botón conserva su propio mensaje ----------
  function initWhatsAppLinks() {
    document.querySelectorAll(".whatsapp-link").forEach((link) => {
      const message = link.dataset.msg || DEFAULT_MESSAGE;
      link.href = waUrl(message);
      link.addEventListener("click", () => {
        track("whatsapp_click", { ubicacion: link.dataset.track || "sin-etiqueta" });
      });
    });

    // Muestra el número con formato legible donde se indique.
    const pretty = WHATSAPP_NUMBER.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, "+$1 $2 $3 $4");
    document.querySelectorAll(".whatsapp-display").forEach((el) => {
      el.textContent = pretty;
    });
  }

  // ---------- Tema claro / oscuro ----------
  function applyTheme(theme) {
    const isDark = theme === "dark";
    root.classList.toggle("dark-mode", isDark);

    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.setAttribute("aria-label", isDark ? "Activar modo claro" : "Activar modo oscuro");
    }
    if (themeIcon) themeIcon.textContent = isDark ? "☀️" : "🌙";
    if (themeLabel) themeLabel.textContent = isDark ? "Modo claro" : "Modo oscuro";

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", isDark ? "#17231b" : "#f7f9f4");
  }

  function initTheme() {
    // El <head> ya aplicó la clase antes de pintar; aquí solo sincronizamos el botón.
    applyTheme(root.classList.contains("dark-mode") ? "dark" : "light");

    themeToggle?.addEventListener("click", () => {
      const next = root.classList.contains("dark-mode") ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* almacenamiento bloqueado */ }
    });
  }

  // ---------- Menú móvil ----------
  function initMobileMenu() {
    if (!menuToggle || !mainNav) return;

    const setOpen = (open) => {
      mainNav.classList.toggle("is-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      menuToggle.textContent = open ? "✕" : "☰";
    };

    menuToggle.addEventListener("click", () => {
      setOpen(!mainNav.classList.contains("is-open"));
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    // Cerrar con la tecla Esc y devolver el foco al botón.
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && mainNav.classList.contains("is-open")) {
        setOpen(false);
        menuToggle.focus();
      }
    });

    // Si se agranda la pantalla, el menú vuelve a su estado normal.
    window.matchMedia("(min-width: 721px)").addEventListener("change", (e) => {
      if (e.matches) setOpen(false);
    });
  }

  // ---------- Formulario de diagnóstico → WhatsApp ----------
  function initDiagnosticForm() {
    const form = document.getElementById("diagnosticForm");
    const errorBox = document.getElementById("formError");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const required = [...form.querySelectorAll("[required]")];
      required.forEach((field) => field.removeAttribute("aria-invalid"));
      const invalid = required.filter((field) =>
        field.type === "checkbox" ? !field.checked : !field.value.trim()
      );

      if (invalid.length) {
        invalid.forEach((field) => field.setAttribute("aria-invalid", "true"));
        const onlyConsent = invalid.length === 1 && invalid[0].type === "checkbox";
        errorBox.textContent = onlyConsent
          ? "Para continuar, acepta el uso de tus datos según la política de privacidad."
          : "Completa los campos obligatorios marcados con *.";
        errorBox.hidden = false;
        invalid[0].focus();
        return;
      }
      errorBox.hidden = true;

      const data = new FormData(form);
      const get = (key) => String(data.get(key) || "").trim();
      const lines = [
        "Hola, quiero solicitar un diagnóstico agrícola gratuito.",
        "",
        `👤 Nombre: ${get("nombre")}`,
        `📍 Región: ${get("region")}`,
        `🌱 Cultivo: ${get("cultivo")}`,
      ];
      if (get("area")) lines.push(`📐 Área aproximada: ${get("area")} ha`);
      lines.push(`🛠️ Necesito ayuda con: ${get("necesidad")}`);
      if (get("detalle")) lines.push(`📝 Detalle: ${get("detalle")}`);

      track("diagnostico_enviado", { region: get("region"), cultivo: get("cultivo") });
      window.open(waUrl(lines.join("\n")), "_blank", "noopener");
    });
  }

  function initYear() {
    const el = document.getElementById("currentYear");
    if (el) el.textContent = new Date().getFullYear();
  }

  initWhatsAppLinks();
  initTheme();
  initMobileMenu();
  initDiagnosticForm();
  initYear();
})();
