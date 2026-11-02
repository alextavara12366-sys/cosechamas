// CosechaMas · Lógica de las páginas de registro e inicio de sesión
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const alerta = document.getElementById("formAlert");
  const mostrarError = (msg, campo) => {
    alerta.textContent = msg; alerta.hidden = false;
    if (campo) { campo.setAttribute("aria-invalid", "true"); campo.focus(); }
  };
  const limpiar = (form) => {
    alerta.hidden = true;
    form.querySelectorAll("[aria-invalid]").forEach((c) => c.removeAttribute("aria-invalid"));
  };
  const destino = () => {
    const next = new URLSearchParams(location.search).get("next") || "";
    // Solo se permiten páginas internas (evita redirecciones a otros sitios).
    return /^[a-z0-9\-]+\.html(\?[\w=&%\-.]*)?$/i.test(next) ? next : "panel.html";
  };

  // Si ya hay sesión, ir directo al panel.
  if (window.Cuentas.usuarioActual()) { location.replace(destino()); return; }

  // Al corregir un campo, se oculta el mensaje de error.
  document.querySelectorAll("form").forEach((f) => f.addEventListener("input", (e) => {
    e.target.removeAttribute("aria-invalid"); alerta.hidden = true;
  }));

  // Mostrar / ocultar contraseña
  document.querySelectorAll("[data-toggle-pass]").forEach((b) => {
    b.addEventListener("click", () => {
      const input = document.getElementById(b.dataset.togglePass);
      const ver = input.type === "password";
      input.type = ver ? "text" : "password";
      b.textContent = ver ? "Ocultar" : "Mostrar";
      b.setAttribute("aria-label", ver ? "Ocultar contraseña" : "Mostrar contraseña");
    });
  });

  // ---------- Registro ----------
  const reg = document.getElementById("registroForm");
  if (reg) {
    const fecha = document.getElementById("rFecha");
    const hoy = new Date(); hoy.setFullYear(hoy.getFullYear() - 18);
    fecha.max = hoy.toISOString().slice(0, 10);

    const clave = document.getElementById("rClave");
    const barra = document.getElementById("strength");
    clave.addEventListener("input", () => {
      const v = clave.value; let n = 0;
      if (v.length >= 8) n++;
      if (/[a-záéíóúñ]/i.test(v) && /\d/.test(v)) n++;
      if (/[A-ZÁÉÍÓÚÑ]/.test(v) && /[a-záéíóúñ]/.test(v)) n++;
      if (/[^\wáéíóúñ]/i.test(v) || v.length >= 12) n++;
      barra.dataset.level = String(n);
      barra.firstElementChild.style.width = (n * 25) + "%";
    });

    reg.addEventListener("submit", async (e) => {
      e.preventDefault(); limpiar(reg);
      const f = reg.elements;
      const nombre = f.nombre.value.trim();
      if (nombre.length < 3) return mostrarError("Escribe tu nombre completo.", f.nombre);
      if (!Cuentas.normalizarContacto(f.contacto.value)) return mostrarError("Ingresa un correo válido o un celular de 9 dígitos que empiece con 9.", f.contacto);
      if (!f.fecha.value) return mostrarError("Indica tu fecha de nacimiento.", f.fecha);
      const edad = Cuentas.edad(f.fecha.value);
      if (!(edad >= 18 && edad <= 110)) return mostrarError("Debes ser mayor de 18 años para crear una cuenta.", f.fecha);
      if (f.clave.value.length < 8 || !/[a-záéíóúñ]/i.test(f.clave.value) || !/\d/.test(f.clave.value))
        return mostrarError("La contraseña debe tener al menos 8 caracteres, con letras y números.", f.clave);
      if (f.clave.value !== f.clave2.value) return mostrarError("Las contraseñas no coinciden.", f.clave2);
      if (!document.getElementById("rAcepto").checked) return mostrarError("Debes aceptar los términos y la política de privacidad.", document.getElementById("rAcepto"));

      const btn = reg.querySelector("button[type=submit]");
      btn.disabled = true; btn.textContent = "Creando cuenta…";
      try {
        await Cuentas.registrar({ nombre, contacto: f.contacto.value, fechaNacimiento: f.fecha.value, clave: f.clave.value });
        location.replace(destino());
      } catch (err) {
        mostrarError(err.message, f.contacto);
        btn.disabled = false; btn.textContent = "Crear cuenta";
      }
    });
  }

  // ---------- Inicio de sesión ----------
  const log = document.getElementById("loginForm");
  if (log) {
    let fallos = 0, bloqueadoHasta = 0;
    document.getElementById("olvide").addEventListener("click", (e) => {
      e.preventDefault(); document.getElementById("olvideMsg").hidden = false;
    });
    log.addEventListener("submit", async (e) => {
      e.preventDefault(); limpiar(log);
      const f = log.elements;
      if (Date.now() < bloqueadoHasta) return mostrarError("Demasiados intentos. Espera un minuto e inténtalo de nuevo.");
      if (!f.contacto.value.trim()) return mostrarError("Ingresa tu correo o celular.", f.contacto);
      if (!f.clave.value) return mostrarError("Ingresa tu contraseña.", f.clave);
      const btn = log.querySelector("button[type=submit]");
      btn.disabled = true; btn.textContent = "Ingresando…";
      try {
        await Cuentas.iniciarSesion(f.contacto.value, f.clave.value, document.getElementById("lRecordar").checked);
        location.replace(destino());
      } catch (err) {
        fallos++;
        if (fallos >= 5) { bloqueadoHasta = Date.now() + 60000; fallos = 0; }
        mostrarError(err.message, f.clave);
        btn.disabled = false; btn.textContent = "Ingresar";
      }
    });
  }
});
