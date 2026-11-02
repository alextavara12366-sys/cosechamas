// CosechaMas · Funciones comunes de la plataforma (tema, cuentas, informes, formato)
// ---------------------------------------------------------------------------
// IMPORTANTE – MODO DEMOSTRACIÓN
// Las cuentas y los informes se guardan en el navegador (localStorage) del
// dispositivo donde se crean. Sirve para presentar y probar la plataforma en
// GitHub Pages, pero NO es un sistema de usuarios real: un cliente que se
// registra en su celular no podrá entrar desde otra computadora.
// Para producción, reemplaza las funciones del objeto "Cuentas" por un servicio
// de autenticación (por ejemplo Firebase Authentication + Firestore), manteniendo
// los mismos nombres de funciones para no tener que cambiar las demás páginas.
// ---------------------------------------------------------------------------
(() => {
  "use strict";

  const MODO_DEMO = true;
  const K_USUARIOS = "cosechamas-usuarios";
  const K_SESION = "cosechamas-sesion";
  const K_TEMA = "cosechamas-theme";
  const K_INFORMES = (id) => "cosechamas-informes-" + id;

  // ---------- Almacenamiento seguro ----------
  const leer = (store, k, def) => {
    try { const v = store.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  };
  const escribir = (store, k, v) => {
    try { store.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
  };
  const borrar = (store, k) => { try { store.removeItem(k); } catch (e) { /* nada */ } };

  // ---------- Contraseñas (PBKDF2 con sal) ----------
  const aHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const salAleatoria = () => {
    const a = new Uint8Array(16);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => (a[i] = Math.random() * 256));
    return aHex(a);
  };
  async function hashClave(clave, sal) {
    if (window.crypto && crypto.subtle) {
      const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(clave), "PBKDF2", false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: new TextEncoder().encode(sal), iterations: 100000, hash: "SHA-256" }, base, 256);
      return "pbkdf2$" + aHex(bits);
    }
    // Respaldo para navegadores sin WebCrypto (no seguro, solo demostración)
    let h = 0; const s = sal + clave;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return "simple$" + (h >>> 0).toString(16);
  }

  // ---------- Contacto: correo o celular ----------
  function normalizarContacto(valor) {
    const v = String(valor || "").trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return { tipo: "correo", valor: v.toLowerCase() };
    const digitos = v.replace(/[\s\-()]/g, "").replace(/^\+?51/, "");
    if (/^9\d{8}$/.test(digitos)) return { tipo: "celular", valor: "+51" + digitos };
    return null;
  }

  const edad = (fecha) => {
    const n = new Date(fecha + "T00:00:00"); if (isNaN(n)) return NaN;
    const h = new Date(); let e = h.getFullYear() - n.getFullYear();
    const m = h.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && h.getDate() < n.getDate())) e--;
    return e;
  };

  const publico = (u) => u && ({ id: u.id, nombre: u.nombre, contacto: u.contacto, tipoContacto: u.tipoContacto, fechaNacimiento: u.fechaNacimiento, creado: u.creado, plan: u.plan });

  // ---------- Cuentas ----------
  const Cuentas = {
    modoDemo: MODO_DEMO,
    normalizarContacto, edad,

    async registrar({ nombre, contacto, fechaNacimiento, clave }) {
      const c = normalizarContacto(contacto);
      if (!c) throw new Error("Ingresa un correo válido o un celular peruano de 9 dígitos.");
      const usuarios = leer(localStorage, K_USUARIOS, []);
      if (usuarios.some((u) => u.contacto === c.valor)) throw new Error("Ya existe una cuenta con ese " + c.tipo + ". Inicia sesión.");
      const sal = salAleatoria();
      const u = {
        id: "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        nombre: nombre.trim(), contacto: c.valor, tipoContacto: c.tipo, fechaNacimiento,
        sal, hash: await hashClave(clave, sal), creado: new Date().toISOString(), plan: "Productor"
      };
      usuarios.push(u);
      if (!escribir(localStorage, K_USUARIOS, usuarios)) throw new Error("Tu navegador no permite guardar datos. Desactiva el modo privado e inténtalo de nuevo.");
      this._abrirSesion(u, true);
      return publico(u);
    },

    async iniciarSesion(contacto, clave, recordar) {
      const c = normalizarContacto(contacto);
      const usuarios = leer(localStorage, K_USUARIOS, []);
      const u = c && usuarios.find((x) => x.contacto === c.valor);
      if (!u || (await hashClave(clave, u.sal)) !== u.hash) throw new Error("El correo/celular o la contraseña no son correctos.");
      this._abrirSesion(u, recordar);
      return publico(u);
    },

    _abrirSesion(u, recordar) {
      const s = { id: u.id, inicio: Date.now() };
      borrar(localStorage, K_SESION); borrar(sessionStorage, K_SESION);
      escribir(recordar ? localStorage : sessionStorage, K_SESION, s);
    },

    usuarioActual() {
      const s = leer(sessionStorage, K_SESION, null) || leer(localStorage, K_SESION, null);
      if (!s) return null;
      return publico(leer(localStorage, K_USUARIOS, []).find((u) => u.id === s.id)) || null;
    },

    cerrarSesion() {
      borrar(localStorage, K_SESION); borrar(sessionStorage, K_SESION);
      location.href = "index.html";
    },

    // Redirige al inicio de sesión si no hay cuenta activa.
    requerir() {
      const u = this.usuarioActual();
      if (!u) {
        const destino = location.pathname.split("/").pop() + location.search;
        location.replace("login.html?next=" + encodeURIComponent(destino));
        return null;
      }
      return u;
    }
  };

  // ---------- Informes del usuario ----------
  const Informes = {
    listar(uid) { return leer(localStorage, K_INFORMES(uid), []).sort((a, b) => b.fecha.localeCompare(a.fecha)); },
    obtener(uid, id) { return this.listar(uid).find((x) => x.id === id) || null; },
    guardar(uid, datos) {
      const lista = leer(localStorage, K_INFORMES(uid), []);
      const inf = { id: "inf" + Date.now().toString(36), fecha: new Date().toISOString(), ...datos };
      lista.push(inf);
      if (!escribir(localStorage, K_INFORMES(uid), lista)) throw new Error("No se pudo guardar el informe en este navegador.");
      return inf;
    },
    eliminar(uid, id) {
      escribir(localStorage, K_INFORMES(uid), leer(localStorage, K_INFORMES(uid), []).filter((x) => x.id !== id));
    }
  };

  // ---------- Formato ----------
  const Formato = {
    soles: (n, d = 2) => "S/ " + Number(n).toLocaleString("es-PE", { minimumFractionDigits: d, maximumFractionDigits: d }),
    num: (n, d = 2) => Number(n).toLocaleString("es-PE", { minimumFractionDigits: d, maximumFractionDigits: d }),
    entero: (n) => Math.round(Number(n)).toLocaleString("es-PE"),
    pct: (n, d = 2) => Number(n).toLocaleString("es-PE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %",
    fecha: (iso) => new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" }),
    esc: (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
  };

  // ---------- Tema claro / oscuro ----------
  function initTema() {
    const root = document.documentElement;
    const btn = document.getElementById("themeToggle");
    const icono = document.getElementById("themeIcon");
    const etiqueta = btn?.querySelector(".theme-label");
    const aplicar = (oscuro) => {
      root.classList.toggle("dark-mode", oscuro);
      btn?.setAttribute("aria-pressed", String(oscuro));
      btn?.setAttribute("aria-label", oscuro ? "Activar modo claro" : "Activar modo oscuro");
      if (icono) icono.textContent = oscuro ? "☀️" : "🌙";
      if (etiqueta) etiqueta.textContent = oscuro ? "Modo claro" : "Modo oscuro";
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", oscuro ? "#17231b" : "#f7f9f4");
    };
    aplicar(root.classList.contains("dark-mode"));
    btn?.addEventListener("click", () => {
      const oscuro = !root.classList.contains("dark-mode");
      aplicar(oscuro);
      try { localStorage.setItem(K_TEMA, oscuro ? "dark" : "light"); } catch (e) { /* nada */ }
    });
  }

  // ---------- Menú de usuario (cabecera de la plataforma) ----------
  function initMenuUsuario() {
    const u = Cuentas.usuarioActual();
    document.querySelectorAll("[data-user-name]").forEach((el) => (el.textContent = u ? u.nombre.split(" ")[0] : ""));
    document.querySelectorAll("[data-logout]").forEach((b) => b.addEventListener("click", () => Cuentas.cerrarSesion()));
    const toggle = document.getElementById("userMenuToggle");
    const menu = document.getElementById("userMenu");
    if (toggle && menu) {
      const cerrar = () => { menu.hidden = true; toggle.setAttribute("aria-expanded", "false"); };
      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const abrir = menu.hidden;
        menu.hidden = !abrir; toggle.setAttribute("aria-expanded", String(abrir));
      });
      document.addEventListener("click", (e) => { if (!menu.contains(e.target)) cerrar(); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrar(); });
    }
    document.querySelectorAll("[data-demo-note]").forEach((el) => (el.hidden = !MODO_DEMO));
    const y = document.getElementById("currentYear");
    if (y) y.textContent = new Date().getFullYear();
  }

  window.Cuentas = Cuentas;
  window.Informes = Informes;
  window.Formato = Formato;

  document.addEventListener("DOMContentLoaded", () => { initTema(); initMenuUsuario(); });
})();
