// CosechaMas · Panel del usuario: servicios, cuestionario y lista de informes
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const usuario = Cuentas.requerir();
  if (!usuario) return;

  const C = window.COSECHAMAS_CULTIVOS;
  const { soles, num, entero, fecha, esc } = Formato;
  const $ = (id) => document.getElementById(id);

  // ---------- Datos del usuario ----------
  const iniciales = usuario.nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  $("userInitials").textContent = iniciales || "🌱";
  $("userContact").textContent = usuario.contacto;
  $("planBadge").textContent = "Plan " + (usuario.plan || "Productor");

  // ---------- Paso 1: opciones ----------
  const sel = { cultivo: null, variedad: null, sistema: null };

  const opcion = (grupo, valor, titulo, detalle, disponible, marcado) => `
    <label class="choice">
      <input type="radio" name="${grupo}" value="${esc(valor)}" ${disponible ? "" : "disabled"} ${marcado ? "checked" : ""}>
      <span class="choice-body"><strong>${esc(titulo)}</strong><small>${disponible ? esc(detalle) : "Próximamente"}</small></span>
    </label>`;

  function pintarCultivos() {
    $("optCultivo").innerHTML = Object.entries(C).map(([k, c]) =>
      opcion("cultivo", k, c.nombre, c.cientifico || "", c.disponible, k === sel.cultivo)).join("");
  }
  function pintarVariedades() {
    const vars = sel.cultivo ? C[sel.cultivo].variedades : {};
    const lista = Object.entries(vars);
    $("hintVariedad").textContent = sel.cultivo ? "" : "(elige primero un cultivo)";
    $("optVariedad").innerHTML = lista.map(([k, v]) => opcion("variedad", k, v.nombre, "Variedad", v.disponible, k === sel.variedad)).join("");
  }
  function pintarSistemas() {
    const v = sel.cultivo && sel.variedad ? C[sel.cultivo].variedades[sel.variedad] : null;
    $("hintSistema").textContent = v ? "" : "(elige primero una variedad)";
    $("optSistema").innerHTML = v ? Object.entries(v.sistemas).map(([k, s]) =>
      opcion("sistema", k, s.nombre, "Sistema de producción", s.disponible, k === sel.sistema)).join("") : "";
  }
  const primeraDisponible = (obj) => Object.keys(obj || {}).find((k) => obj[k].disponible) || null;

  $("paso1").addEventListener("change", (e) => {
    const { name, value } = e.target;
    if (name === "cultivo") {
      sel.cultivo = value;
      sel.variedad = primeraDisponible(C[value].variedades);
      sel.sistema = sel.variedad ? primeraDisponible(C[value].variedades[sel.variedad].sistemas) : null;
      pintarVariedades(); pintarSistemas();
    } else if (name === "variedad") {
      sel.variedad = value;
      sel.sistema = primeraDisponible(C[sel.cultivo].variedades[value].sistemas);
      pintarSistemas();
    } else if (name === "sistema") sel.sistema = value;
    $("err1").hidden = true;
  });

  // ---------- Navegación entre pasos ----------
  const pasos = [...document.querySelectorAll(".wizard-step")];
  const stepper = [...$("stepper").children];
  function irA(n, desplazar = true) {
    pasos.forEach((p) => (p.hidden = Number(p.dataset.step) !== n));
    stepper.forEach((li) => {
      const s = Number(li.dataset.step);
      li.classList.toggle("done", s < n);
      if (s === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    if (desplazar) document.querySelector(".wizard").scrollIntoView({ behavior: "smooth", block: "start" });
    const h = pasos.find((p) => !p.hidden)?.querySelector("h2");
    if (h && desplazar) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }
  document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => {
    const n = Number(b.dataset.go);
    if (n === 3) prepararParametros();
    irA(n);
  }));

  // ---------- Paso 1 → 2: ficha técnica ----------
  let sistemaActual = null, claveSeleccion = "";
  $("paso1").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!sel.cultivo || !sel.variedad || !sel.sistema) {
      $("err1").textContent = "Selecciona el cultivo, la variedad y el sistema de producción.";
      $("err1").hidden = false; return;
    }
    const { cultivo, variedad, sistema } = CosechaCalculo.obtenerSistema(sel.cultivo, sel.variedad, sel.sistema);
    sistemaActual = sistema;
    $("tituloFicha").textContent = `Ficha técnica: ${cultivo.nombre} ${variedad.nombre}`;
    $("tablaFicha").tBodies[0].innerHTML = sistema.ficha.map(([k, v]) =>
      `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("");
    irA(2);
  });

  // ---------- Paso 3: parámetros ----------
  const campos = ["region", "area", "rendimiento", "merma", "precio", "jornal", "tea", "meses"];
  const f3 = $("paso3");
  $("pRegion").insertAdjacentHTML("beforeend", window.COSECHAMAS_REGIONES.map((r) => `<option>${esc(r)}</option>`).join(""));

  function prepararParametros() {
    const clave = [sel.cultivo, sel.variedad, sel.sistema].join("/");
    if (clave !== claveSeleccion) {           // valores sugeridos del cultivo elegido
      const v = sistemaActual.valores;
      f3.area.value = f3.area.value || 1;
      f3.rendimiento.value = v.rendimiento; f3.merma.value = v.merma; f3.precio.value = v.precio;
      f3.jornal.value = f3.jornal.value || v.jornal; f3.tea.value = f3.tea.value || v.tea; f3.meses.value = v.meses;
      claveSeleccion = clave;
    }
    actualizarCalculo();
  }

  function leerParametros() {
    const p = { region: f3.region.value };
    campos.slice(1).forEach((k) => (p[k] = parseFloat(String(f3[k].value).replace(",", "."))));
    return p;
  }
  function validar(p) {
    const reglas = [
      ["region", !!p.region, "Selecciona la región."],
      ["area", p.area > 0 && p.area <= 1000, "El área debe ser mayor que 0 (máximo 1,000 ha)."],
      ["rendimiento", p.rendimiento > 0, "Ingresa el rendimiento deseado en kg/ha."],
      ["merma", p.merma >= 0 && p.merma < 90, "La merma debe estar entre 0% y 90%."],
      ["precio", p.precio > 0, "Ingresa el precio esperado por kg."],
      ["jornal", p.jornal > 0, "Ingresa el precio del jornal."],
      ["tea", p.tea >= 0 && p.tea <= 200, "La TEA debe estar entre 0% y 200%."],
      ["meses", Number.isInteger(p.meses) && p.meses >= 1 && p.meses <= 24, "La duración debe ser un número entero de meses (1 a 24)."]
    ];
    f3.querySelectorAll("[aria-invalid]").forEach((c) => c.removeAttribute("aria-invalid"));
    const fallo = reglas.find((r) => !r[1]);
    if (fallo) f3[fallo[0]].setAttribute("aria-invalid", "true");
    return fallo;
  }

  function actualizarCalculo() {
    const p = leerParametros();
    const tasaOk = p.tea >= 0 && p.meses >= 1;
    $("pTasa").value = tasaOk ? num(CosechaCalculo.tasaCampana(p.tea, Math.round(p.meses))) : "";
    if (p.rendimiento > 0 && p.merma >= 0 && p.merma < 90) {
      const ef = p.rendimiento * (1 - p.merma / 100);
      $("oRendEf").textContent = entero(ef) + " kg/ha";
      $("oProd").textContent = p.area > 0 ? entero(ef * p.area) + " kg" : "—";
    }
    try {
      if (p.area > 0 && p.jornal > 0 && tasaOk && p.precio > 0 && p.rendimiento > 0) {
        const r = CosechaCalculo.calcular(sel, { ...p, meses: Math.round(p.meses) });
        $("oCosto").textContent = soles(r.costoTotal);
      }
    } catch (e) { $("oCosto").textContent = "—"; }
  }
  f3.addEventListener("input", actualizarCalculo);

  f3.addEventListener("submit", (e) => {
    e.preventDefault();
    const p = leerParametros();
    const fallo = validar(p);
    if (fallo) { $("err3").textContent = fallo[2]; $("err3").hidden = false; f3[fallo[0]].focus(); return; }
    $("err3").hidden = true;
    irA(4, false);
    try {
      const inf = Informes.guardar(usuario.id, { seleccion: { ...sel }, parametros: p });
      location.href = "informe.html?id=" + encodeURIComponent(inf.id);
    } catch (err) {
      irA(3); $("err3").textContent = err.message; $("err3").hidden = false;
    }
  });

  // ---------- Mis informes ----------
  function pintarInformes() {
    const lista = Informes.listar(usuario.id);
    $("sinInformes").hidden = lista.length > 0;
    $("listaInformes").innerHTML = lista.map((inf) => {
      let titulo = "Informe", resumen = "";
      try {
        const r = CosechaCalculo.calcular(inf.seleccion, inf.parametros);
        titulo = `${r.seleccion.cultivo} ${r.seleccion.variedad} · ${r.seleccion.sistema}`;
        resumen = `Costo total ${soles(r.costoTotal)} · Utilidad ${soles(r.indicadores.utilidad)}`;
      } catch (e) { resumen = "No se pudo calcular este informe."; }
      const p = inf.parametros;
      return `<li class="report-item card">
        <span class="ico" aria-hidden="true">📄</span>
        <div class="info"><strong>${esc(titulo)}</strong>
          <small>${esc(p.region)} · ${num(p.area, p.area % 1 ? 2 : 0)} ha · ${fecha(inf.fecha)}</small><br>
          <small>${esc(resumen)}</small></div>
        <div class="acciones">
          <a class="button button-small button-primary" href="informe.html?id=${encodeURIComponent(inf.id)}">Ver informe</a>
          <button class="btn-link-danger" type="button" data-del="${esc(inf.id)}">Eliminar</button>
        </div></li>`;
    }).join("");
  }
  $("listaInformes").addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]");
    if (!b) return;
    if (b.dataset.confirm) { Informes.eliminar(usuario.id, b.dataset.del); pintarInformes(); }
    else { b.dataset.confirm = "1"; b.textContent = "¿Eliminar? Confirmar"; setTimeout(() => { if (b.isConnected) { delete b.dataset.confirm; b.textContent = "Eliminar"; } }, 4000); }
  });

  // ---------- Inicio ----------
  sel.cultivo = primeraDisponible(C);
  sel.variedad = primeraDisponible(C[sel.cultivo].variedades);
  sel.sistema = primeraDisponible(C[sel.cultivo].variedades[sel.variedad].sistemas);
  pintarCultivos(); pintarVariedades(); pintarSistemas();
  irA(1, false);
  pintarInformes();
});
