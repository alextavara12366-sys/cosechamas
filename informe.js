// CosechaMas · Generación del informe técnico ejecutivo de costos de producción
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const usuario = Cuentas.requerir();
  if (!usuario) return;

  const $ = (id) => document.getElementById(id);
  const { soles: S, num: N, entero: E, pct: P, fecha, esc } = Formato;
  const G = window.Graficos;
  const doc = $("informe");

  // Cabecera de usuario
  $("userInitials").textContent = usuario.nombre.split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  $("userContact").textContent = usuario.contacto;
  $("btnImprimir").addEventListener("click", () => window.print());

  const id = new URLSearchParams(location.search).get("id");
  const inf = id && Informes.obtener(usuario.id, id);
  if (!inf) {
    doc.innerHTML = `<h1>Informe no encontrado</h1><p>Este informe no existe o pertenece a otra cuenta.</p>
      <p><a class="button button-primary" href="panel.html#nuevo-informe">Generar un informe nuevo</a></p>`;
    return;
  }

  let r;
  try { r = CosechaCalculo.calcular(inf.seleccion, inf.parametros); }
  catch (e) { doc.innerHTML = `<h1>No se pudo generar el informe</h1><p>${esc(e.message)}</p>`; return; }

  const p = r.parametros, A = p.area, I = r.indicadores, sel = r.seleccion, sis = r.sistema;
  const cultivoTxt = `${sel.cultivo} ${sel.variedad}`;
  const ha = (v) => r.porHa(v);
  const cant = (v) => N(v, Number.isInteger(Math.round(v * 100) / 100) ? 0 : 2);
  const areaTxt = `${cant(A)} ha`;
  const pctDe = (v, base) => (base ? (v / base) * 100 : 0);
  const negCls = (v) => (v < 0 ? ' class="num neg"' : ' class="num"');

  document.title = `Informe ${cultivoTxt} · ${p.region} | CosechaMas`;
  // Encabezado y numeración de páginas al imprimir / guardar en PDF
  const estiloPagina = document.createElement("style");
  estiloPagina.textContent = `@page { @top-center { content: "Costo de Producción – ${cultivoTxt.replace(/"/g, "")}"; font-size: 9pt; color: #5d6d60; }
    @bottom-center { content: "CosechaMas · Página " counter(page) " de " counter(pages); font-size: 9pt; color: #5d6d60; } }`;
  document.head.appendChild(estiloPagina);

  // ======================= 0. PORTADA =======================
  const portada = `
    <header class="doc-cover">
      <div class="doc-brand">
        <span class="brand"><span class="brand-mark" aria-hidden="true">🌱</span><span><strong>CosechaMas</strong><small>Asesoría Agrícola 2.0</small></span></span>
        <span>Informe N.° ${esc(inf.id.toUpperCase())}</span>
      </div>
      <p class="doc-kicker">Resumen ejecutivo</p>
      <h1>Costo de Producción de <em>${esc(cultivoTxt)}</em> (${esc(sel.cientifico)})</h1>
      <p class="doc-sub">Sistema de producción ${esc(sel.sistema.toLowerCase())} · Elaborado para <strong>${esc(usuario.nombre)}</strong></p>
      <dl class="doc-meta">
        <div><dt>Región</dt><dd>${esc(p.region)}</dd></div>
        <div><dt>Área</dt><dd>${areaTxt}</dd></div>
        <div><dt>Campaña</dt><dd>${p.meses} ${p.meses === 1 ? "mes" : "meses"}</dd></div>
        <div><dt>Fecha</dt><dd>${fecha(inf.fecha)}</dd></div>
      </dl>
    </header>
    <p>El presente resumen ejecutivo condensa los principales indicadores técnicos y financieros del costeo de producción de
      ${esc(sel.cultivo.toLowerCase())} variedad ${esc(sel.variedad)} para un área de ${areaTxt} en la región ${esc(p.region)},
      elaborado a partir de la estructura estándar de costeo agrícola de CosechaMas y de los parámetros declarados por el productor.
      Los valores son referenciales para una campaña de ${p.meses} ${p.meses === 1 ? "mes" : "meses"} y deben ajustarse a las condiciones particulares de cada unidad productiva.</p>`;

  // ======================= 1. FICHA TÉCNICA =======================
  const ficha = `
    <section><h2>1. Ficha técnica del cultivo</h2>
      <div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Concepto</th><th scope="col">Valor</th></tr></thead><tbody>
      ${sis.ficha.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}
      </tbody></table></div>
    </section>`;

  // ======================= 2. PARÁMETROS =======================
  const filasPar = [
    ["Región", esc(p.region), "Ubicación del proyecto"],
    ["Área a sembrar", areaTxt, "Hectáreas a sembrar"],
    ["Rendimiento deseado", E(p.rendimiento) + " kg/ha", "Rendimiento bruto esperado"],
    ["Merma esperada", P(p.merma, 1), "Pérdida post-cosecha / calidad"],
    ["Rendimiento efectivo", E(r.rendEfectivo) + " kg/ha", "Kg comercializables por hectárea"],
    ["Producción efectiva", E(r.produccion) + " kg", "Kg comercializables en el área total"],
    ["Precio en chacra esperado", S(p.precio) + " / kg", "Precio de venta por kg"],
    ["Costo promedio del jornal", S(p.jornal) + " / día", "Valor de un jornal de trabajo"],
    ["Tasa de interés efectiva anual (TEA)", P(p.tea), "Costo del financiamiento"],
    ["Duración de la campaña", `${p.meses} meses`, "Periodo de financiamiento"],
    ["Tasa de interés de la campaña (prorrateada)", P(r.tasaCampana), `(1 + ${N(p.tea)}%)^(${p.meses}/12) − 1`]
  ];
  const parametros = `
    <section><h2>2. Parámetros del proyecto</h2>
      <div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Concepto</th><th scope="col" class="num">Valor</th><th scope="col">Detalle</th></tr></thead><tbody>
      ${filasPar.map(([a, b, c]) => `<tr><th scope="row">${a}</th><td class="num">${b}</td><td>${c}</td></tr>`).join("")}
      </tbody></table></div>
    </section>`;

  // ======================= 3. INDICADORES =======================
  const cls = (v) => (v >= 0 ? "pos" : "neg");
  const filasInd = [
    ["Costo directo de producción", r.directos, true],
    ["Costo indirecto de producción", r.totalIndirectos, true],
    ["Costo total de producción", r.costoTotal, true],
    ["Rendimiento base proyectado", null, false, `${E(p.rendimiento * A)} kg`, `${E(p.rendimiento)} kg/ha`],
    [`Rendimiento efectivo (con ${N(p.merma, 1)}% de merma)`, null, false, `${E(r.produccion)} kg`, `${E(r.rendEfectivo)} kg/ha`],
    ["Precio de chacra estimado", null, false, `${S(p.precio)} / kg`, `${S(p.precio)} / kg`],
    ["Costo unitario de producción", null, false, `${S(I.costoUnitario)} / kg`, `${S(I.costoUnitario)} / kg`],
    ["Valor bruto de la producción (VBP)", I.vbp, true],
    ["Utilidad neta", I.utilidad, true]
  ];
  const indicadores = `
    <section><h2>3. Resumen de indicadores financieros</h2>
      <div class="kpis">
        <div class="kpi"><span>Costo total</span><strong>${S(r.costoTotal, 0)}</strong><small>${S(ha(r.costoTotal), 0)} / ha</small></div>
        <div class="kpi"><span>Valor bruto (VBP)</span><strong>${S(I.vbp, 0)}</strong><small>${S(ha(I.vbp), 0)} / ha</small></div>
        <div class="kpi ${cls(I.utilidad)}"><span>Utilidad neta</span><strong>${S(I.utilidad, 0)}</strong><small>${S(ha(I.utilidad), 0)} / ha</small></div>
        <div class="kpi ${I.beneficioCosto >= 1 ? "pos" : "neg"}"><span>Relación B/C</span><strong>${N(I.beneficioCosto)}</strong><small>Rentabilidad ${P(I.rentabilidad)}</small></div>
      </div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Indicador</th><th scope="col" class="num">Total del proyecto (${areaTxt})</th><th scope="col" class="num">Por hectárea</th></tr></thead><tbody>
      ${filasInd.map(([n, v, dinero, t, h]) => dinero
        ? `<tr><th scope="row">${n}</th><td${negCls(v)}>${S(v)}</td><td${negCls(v)}>${S(ha(v))} / ha</td></tr>`
        : `<tr><th scope="row">${n}</th><td class="num">${t}</td><td class="num">${h}</td></tr>`).join("")}
      </tbody></table></div>
    </section>`;

  // ======================= 4. ANÁLISIS ECONÓMICO =======================
  const rendMin = r.costoTotal / (p.precio * (1 - p.merma / 100) * A);
  let lectura;
  if (I.utilidad > 0 && I.beneficioCosto >= 1.2) {
    lectura = `Con el rendimiento y precio de chacra proyectados, el cultivo genera una utilidad neta de ${S(ha(I.utilidad))} por hectárea
      (${S(I.utilidad)} en el área total), con un margen de rentabilidad de ${P(I.rentabilidad)} y una relación Beneficio/Costo de ${N(I.beneficioCosto)}
      (es decir, por cada sol invertido se recuperan ${S(I.beneficioCosto)}). Ambos indicadores reflejan un negocio agrícola económicamente viable bajo los supuestos de este costeo.`;
  } else if (I.utilidad > 0) {
    lectura = `El proyecto genera una utilidad neta de ${S(ha(I.utilidad))} por hectárea, con una relación Beneficio/Costo de ${N(I.beneficioCosto)} y
      una rentabilidad de ${P(I.rentabilidad)}. El margen es estrecho: una caída moderada del precio o del rendimiento podría eliminar la ganancia,
      por lo que se recomienda revisar el análisis de sensibilidad y asegurar canales de venta antes de invertir.`;
  } else {
    lectura = `Con los parámetros ingresados, el proyecto <strong>no cubre su costo total</strong>: la pérdida estimada es de ${S(Math.abs(ha(I.utilidad)))} por hectárea
      (relación B/C de ${N(I.beneficioCosto)}). Para alcanzar el equilibrio se necesitaría un precio mínimo de ${S(I.peEconomico)} por kg
      o un rendimiento de al menos ${E(rendMin)} kg/ha con el precio actual. Se recomienda revisar los costos, el precio de venta o el rendimiento esperado antes de invertir.`;
  }
  const serieIng = { nombre: "Ingreso total", corto: "Ingreso", color: G.VERDE, puntos: r.equilibrio.map((x) => ({ x: x.volumen, y: x.ingreso })) };
  const serieCos = { nombre: "Costo total de producción", corto: "Costo total", color: "#c98a12", guion: true, puntos: r.equilibrio.map((x) => ({ x: x.volumen, y: x.costo })) };
  const analisis = `
    <section class="page-break"><h2>4. Análisis económico clave</h2>
      <p>El punto de equilibrio señala el volumen mínimo de cosecha y el precio mínimo de venta necesarios para cubrir el costo total de producción, sin pérdidas ni ganancias:</p>
      <div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Indicador</th><th scope="col" class="num">Valor</th><th scope="col">Interpretación</th></tr></thead><tbody>
        <tr><th scope="row">Punto de equilibrio físico</th><td class="num">${N(I.peFisico)} kg</td><td>Kilos a vender para recuperar la inversión (${N(ha(I.peFisico))} kg/ha)</td></tr>
        <tr><th scope="row">Punto de equilibrio económico</th><td class="num">${S(I.peEconomico)} / kg</td><td>Precio mínimo de venta para no perder dinero</td></tr>
        <tr><th scope="row">Margen de utilidad (índice de rentabilidad)</th><td${negCls(I.rentabilidad)}>${P(I.rentabilidad)}</td><td>Utilidad neta / costo total</td></tr>
        <tr><th scope="row">Relación Beneficio / Costo (B/C)</th><td${negCls(I.beneficioCosto - 1)}>${N(I.beneficioCosto)}</td><td>VBP / costo total (mayor a 1 = rentable)</td></tr>
      </tbody></table></div>
      <p style="margin-top:16px">${lectura}</p>
      <div class="two-col">
        <figure class="chart">
          ${G.lineas([serieIng, serieCos], { fmtX: (v) => G.corto(v), fmtY: (v) => G.corto(v), tituloX: "Volumen vendido (kg)", tituloY: "Soles (S/)", marcaX: { x: I.peFisico, texto: "P.E. " + G.corto(I.peFisico) + " kg" } })}
          ${G.leyenda([serieIng, serieCos])}
          <figcaption>Punto de equilibrio: el ingreso iguala al costo total en ${N(I.peFisico, 0)} kg.</figcaption>
        </figure>
        <figure class="chart">
          ${G.columnas([{ etiqueta: "Costo total", valor: r.costoTotal, color: "#c98a12" }, { etiqueta: "Utilidad neta", valor: I.utilidad }], { fmt: (v) => S(v, 0), tituloY: "Soles (S/)" })}
          <figcaption>Costo total de producción frente a la utilidad neta del proyecto.</figcaption>
        </figure>
      </div>
    </section>`;

  // ======================= 5. ESTRUCTURA DE COSTOS =======================
  let filasCosto = `<tr class="g1"><td colspan="4">COSTOS DIRECTOS</td><td class="num">${S(r.directos)}</td></tr>`;
  r.grupos.forEach((g) => {
    filasCosto += `<tr class="g2"><td colspan="4">${esc(g.grupo)}</td><td class="num">${S(g.total)}</td></tr>`;
    g.subgrupos.forEach((sg) => {
      if (sg.nombre) filasCosto += `<tr class="g3"><td colspan="4">${esc(sg.nombre)}</td><td class="num">${S(sg.total)}</td></tr>`;
      sg.items.forEach((it) => {
        filasCosto += `<tr class="it"><td>${esc(it.actividad)}</td><td>${esc(it.unidad)}</td><td class="num">${cant(it.cantidad)}</td><td class="num">${N(it.unitario, it.unitario < 1 ? 3 : 2)}</td><td class="num">${N(it.total)}</td></tr>`;
      });
    });
  });
  filasCosto += `<tr class="g1"><td colspan="4">COSTOS INDIRECTOS</td><td class="num">${S(r.totalIndirectos)}</td></tr>`;
  r.indirectos.forEach((x) => {
    filasCosto += `<tr class="it"><td>${esc(x.nombre)}</td><td>%</td><td class="num">${N(x.tasa)}</td><td class="num">${N(x.base)}</td><td class="num">${N(x.total)}</td></tr>`;
  });
  filasCosto += `<tr class="total"><td colspan="4">COSTO TOTAL DE PRODUCCIÓN (S/)</td><td class="num">${S(r.costoTotal)}</td></tr>`;
  const estructura = `
    <section class="page-break"><h2>5. Estructura de costo de producción detallada</h2>
      <p>Costos para ${areaTxt} de ${esc(cultivoTxt.toLowerCase())} en terreno definitivo. Mano de obra valorizada a ${S(p.jornal)} por jornal.</p>
      <div class="table-wrap"><table class="data-table cost-table"><thead><tr><th scope="col">Actividad</th><th scope="col">Unidad</th><th scope="col" class="num">Cantidad</th><th scope="col" class="num">Costo unitario (S/)</th><th scope="col" class="num">Costo total (S/)</th></tr></thead>
      <tbody>${filasCosto}</tbody></table></div>
    </section>`;

  // ======================= 6. RESUMEN DE COSTOS =======================
  const res = r.resumen;
  const filaRes = (x) => `<tr><td>${x.item}</td><td>${esc(x.nombre)}</td><td class="num">${N(x.total)}</td><td class="num">${N(ha(x.total))}</td><td class="num">${N(x.pct)} %</td></tr>`;
  const barras = [...res.directos, ...res.indirectos].map((x) => ({ etiqueta: x.nombre.replace(/\s*\(.*\)$/, ""), valor: x.total }));
  const resumen = `
    <section class="page-break"><h2>6. Resumen de costos de producción</h2>
      <div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Ítem</th><th scope="col">Descripción</th><th scope="col" class="num">Total (S/)</th><th scope="col" class="num">Por ha (S/)</th><th scope="col" class="num">% del costo total</th></tr></thead><tbody>
        <tr class="hl"><td>I.</td><td colspan="4">COSTOS DIRECTOS</td></tr>
        ${res.directos.map(filaRes).join("")}
        <tr class="hl"><td></td><td>Subtotal costos directos</td><td class="num">${N(res.subtotalDirectos)}</td><td class="num">${N(ha(res.subtotalDirectos))}</td><td class="num">${N(pctDe(res.subtotalDirectos, res.total))} %</td></tr>
        <tr class="hl"><td>II.</td><td colspan="4">COSTOS INDIRECTOS</td></tr>
        ${res.indirectos.map(filaRes).join("")}
        <tr class="hl"><td></td><td>Subtotal costos indirectos</td><td class="num">${N(res.subtotalIndirectos)}</td><td class="num">${N(ha(res.subtotalIndirectos))}</td><td class="num">${N(pctDe(res.subtotalIndirectos, res.total))} %</td></tr>
        <tr class="hl"><td>III.</td><td>COSTO TOTAL DE PRODUCCIÓN</td><td class="num">${N(res.total)}</td><td class="num">${N(ha(res.total))}</td><td class="num">100.00 %</td></tr>
      </tbody></table></div>
      <figure class="chart">${G.barrasH(barras, { fmt: (v) => S(v, 0) })}
        <figcaption>Composición del costo total por rubro.</figcaption></figure>
    </section>`;

  // ======================= 7. FLUJO DE CAJA =======================
  const F = r.flujo;
  const totF = (k) => F.reduce((s, x) => s + x[k], 0);
  const minAcum = F.reduce((m, x) => (x.acumulado < m.acumulado ? x : m), F[0]);
  const celdas = (k) => F.map((x) => `<td${negCls(x[k])}>${N(x[k])}</td>`).join("");
  const pesosTxt = F.map((x) => Math.round(x.pesoEgreso * 1000) / 10 + "%").join(" / ");
  const flujo = `
    <section class="page-break"><h2>7. Flujo de caja proyectado (meses 1 al ${p.meses})</h2>
      <div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Concepto</th>${F.map((x) => `<th scope="col" class="num">Mes ${x.mes}</th>`).join("")}<th scope="col" class="num">Total</th></tr></thead><tbody>
        <tr><th scope="row">Egresos (inversión)</th>${celdas("egreso")}<td class="num">${N(totF("egreso"))}</td></tr>
        <tr><th scope="row">Ingresos (ventas)</th>${celdas("ingreso")}<td class="num">${N(totF("ingreso"))}</td></tr>
        <tr class="hl"><th scope="row">Flujo neto</th>${celdas("neto")}<td${negCls(totF("neto"))}>${N(totF("neto"))}</td></tr>
        <tr><th scope="row">Flujo acumulado</th>${celdas("acumulado")}<td></td></tr>
      </tbody></table></div>
      <figure class="chart">${G.columnas(F.map((x) => ({ etiqueta: "Mes " + x.mes, valor: x.neto })), { fmt: (v) => G.corto(v), tituloY: "Soles (S/)" })}
        <figcaption>Flujo neto de caja por mes (barras rojas = salida neta de dinero).</figcaption></figure>
      <p>Durante la campaña el productor necesita financiar hasta <strong>${S(Math.abs(Math.min(0, minAcum.acumulado)))}</strong>
        (saldo acumulado más bajo, en el mes ${minAcum.mes}). Los ingresos por la venta de la cosecha se registran en el mes ${p.meses},
        cuando el flujo acumulado ${F[F.length - 1].acumulado >= 0 ? "se vuelve positivo y se recupera la inversión" : "sigue siendo negativo: la venta no alcanza a cubrir la inversión"}.</p>
    </section>`;

  // ======================= 8. SENSIBILIDAD =======================
  const sen = r.sensibilidad;
  const escenarios = `
    <div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Escenario</th><th scope="col">Variable modificada</th><th scope="col" class="num">Utilidad neta (S/)</th><th scope="col" class="num">Por ha (S/)</th><th scope="col" class="num">Variación vs. base</th></tr></thead><tbody>
    ${r.escenarios.map((x) => `<tr${x.variacion === null ? ' class="hl"' : ""}><td>${x.nombre}</td><td>${esc(x.variable)}</td><td${negCls(x.utilidad)}>${N(x.utilidad)}</td><td${negCls(x.utilidad)}>${N(ha(x.utilidad))}</td><td class="num">${x.variacion === null ? "—" : (x.variacion > 0 ? "+" : "") + N(x.variacion, 1) + " %"}</td></tr>`).join("")}
    </tbody></table></div>`;
  const matriz = `
    <div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Precio (S/ / kg) ↓ · Producción (kg) →</th>${sen.producciones.map((q, j) => `<th scope="col" class="num">${E(q)}<br><small>${Math.round(sen.factoresProd[j] * 100)}%</small></th>`).join("")}</tr></thead><tbody>
    ${sen.matriz.map((fila, i) => `<tr><th scope="row">${S(sen.precios[i])} <small>(${Math.round(sen.factoresPrecio[i] * 100)}%)</small></th>${fila.map((u, j) => `<td class="num${u < 0 ? " neg" : ""}${sen.factoresPrecio[i] === 1 && sen.factoresProd[j] === 1 ? " hl" : ""}">${N(u)}</td>`).join("")}</tr>`).join("")}
    </tbody></table></div>`;
  const tonos = ["#9cc9a5", "#5fa26f", "#2f7d4a", "#164d2b"];
  const seriesSen = sen.factoresProd.map((f, j) => ({
    nombre: `Producción ${Math.round(f * 100)}% (${E(sen.producciones[j])} kg)`, corto: Math.round(f * 100) + "%", color: tonos[j],
    puntos: sen.precios.map((pr, i) => ({ x: pr, y: sen.matriz[i][j] }))
  }));
  const peor = r.escenarios[3];
  const sensibilidad = `
    <section class="page-break"><h2>8. Análisis de sensibilidad (matriz de escenarios)</h2>
      <p>Se evaluó el efecto de variaciones de ±10% en el precio de chacra y en el rendimiento sobre la utilidad neta, de forma individual y combinada:</p>
      ${escenarios}
      <p style="margin-top:14px">${peor.utilidad >= 0
        ? `Incluso en el escenario conservador combinado (precio y rendimiento 10% por debajo de lo proyectado), la actividad mantiene una utilidad positiva de ${S(peor.utilidad)} (${S(ha(peor.utilidad))} por hectárea), lo que indica un margen de seguridad razonable frente a fluctuaciones de mercado o de campo.`
        : `En el escenario conservador combinado (precio y rendimiento 10% por debajo de lo proyectado) el proyecto registraría una pérdida de ${S(Math.abs(peor.utilidad))}, por lo que es sensible a las fluctuaciones de mercado o de campo; conviene asegurar precio de venta o mejorar el rendimiento antes de invertir.`}</p>
      <h3>Matriz completa: utilidad neta según precio y producción (±20%)</h3>
      ${matriz}
      <figure class="chart">${G.lineas(seriesSen, { fmtX: (v) => "S/ " + N(v), fmtY: (v) => G.corto(v), tituloX: "Precio (S/ por kg)", tituloY: "Utilidad neta (S/)" })}
        ${G.leyenda(seriesSen)}
        <figcaption>Utilidad neta según precio y nivel de producción. El costo total se mantiene constante, como en la plantilla de referencia.</figcaption></figure>
    </section>`;

  // ======================= 9. RECOMENDACIONES =======================
  const pd = r.partidas;
  const recs = [
    `<strong>Fertilización (${N(pctDe(pd.fertilizantes, r.directos), 1)}% del costo directo):</strong> ajustar la dosis N-P-K (${esc(sis.npk)}) según un análisis de suelo antes de cada campaña; una sobre-fertilización eleva el costo sin incrementar proporcionalmente el rendimiento.`,
    `<strong>Control fitosanitario (${N(pctDe(pd.fitosanitarios, r.directos), 1)}% del costo directo):</strong> monitorear las plagas y enfermedades clave de la ${esc(sel.cultivo.toLowerCase())} en el Perú (${esc(sis.plagas)}) para aplicar solo cuando el umbral económico lo justifique, evitando aplicaciones calendarizadas innecesarias.`,
    `<strong>Mano de obra de cosecha (${N(pctDe(pd.cosecha, r.directos), 1)}% del costo directo):</strong> es una de las partidas más altas; programar la cosecha en el momento oportuno y organizar las cuadrillas mejora el rendimiento de los jornales y reduce mermas.`,
    `<strong>Costo financiero:</strong> el interés bancario prorrateado (${S(pd.interes)}) representa el ${N(pctDe(pd.interes, r.totalIndirectos), 1)}% de los costos indirectos; negociar líneas de crédito agrícola con tasas preferenciales (Agrobanco, cajas rurales) puede mejorar el margen neto.`
  ];
  if (p.merma > 8) recs.push(`<strong>Merma:</strong> la merma declarada (${N(p.merma, 1)}%) es alta; mejorar el curado, la selección y el almacenamiento puede aumentar directamente los kilos comercializables y la utilidad.`);
  if (I.utilidad <= 0) recs.push(`<strong>Viabilidad:</strong> para no perder dinero se requiere vender a ${S(I.peEconomico)} por kg como mínimo o alcanzar ${E(rendMin)} kg/ha con el precio actual. Antes de sembrar, revisa contratos de venta o alternativas de mercado.`);
  if (minAcum.acumulado < 0) recs.push(`<strong>Financiamiento:</strong> asegurar capital de trabajo de al menos ${S(Math.abs(minAcum.acumulado))} antes de iniciar la campaña para no interrumpir labores críticas por falta de liquidez.`);

  const recomendaciones = `
    <section class="page-break"><h2>9. Recomendaciones agronómicas y financieras</h2>
      <h3>9.1 Puntos críticos de control de costos</h3>
      <ul class="recs">${recs.map((x) => `<li>${x}</li>`).join("")}</ul>
      <h3>9.2 Recomendaciones de manejo del cultivo</h3>
      <ul class="recs">${(sis.recomendacionesCultivo || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <h3>9.3 Cómo usar y actualizar este informe</h3>
      <ul class="recs">
        <li>Para evaluar otro escenario (otro precio, rendimiento, jornal o tasa), genera un nuevo informe desde <strong>Mi panel → Nuevo informe</strong>; cada informe queda guardado por separado para compararlos.</li>
        <li>Los parámetros del cuestionario actualizan automáticamente todo el informe: costo de producción, resumen, flujo de caja, punto de equilibrio y sensibilidad.</li>
        <li>Para descargarlo, usa el botón <strong>Descargar PDF / Imprimir</strong> y elige "Guardar como PDF".</li>
        <li>Si tus precios de insumos o maquinaria difieren de los referenciales, consulta con un asesor de CosechaMas para personalizar la estructura de costos.</li>
      </ul>
    </section>`;

  // ======================= 10. SUPUESTOS =======================
  const supuestos = [
    `Los coeficientes técnicos (jornales, horas-máquina e insumos por hectárea) corresponden a la estructura de referencia de CosechaMas para ${esc(cultivoTxt.toLowerCase())} en sistema ${esc(sel.sistema.toLowerCase())}, y se escalaron proporcionalmente al área declarada (${areaTxt}).`,
    `Los precios unitarios de maquinaria, insumos, agua, alquiler de terreno, envases y fletes son referenciales y no varían según la región elegida (${esc(p.region)}); se recomienda validarlos con cotizaciones locales antes de tomar decisiones de inversión.`,
    `La mano de obra se valorizó con el jornal declarado por el productor (${S(p.jornal)} por día).`,
    `Costos indirectos: imprevistos ${sis.indirectos.imprevistos}%, gastos administrativos ${sis.indirectos.administrativos}% y asistencia técnica ${sis.indirectos.asistencia}% del costo directo, más el interés bancario de la campaña.`,
    `La tasa de interés de la campaña se prorrateó a partir de la TEA: (1 + ${N(p.tea)}%)^(${p.meses}/12) − 1 = ${P(r.tasaCampana)}, aplicada sobre el costo directo.`,
    `El flete de insumos se calculó sobre ${N(r.kgInsumos)} kg/L de fertilizantes, fitosanitarios y aditivos; el flete de producción, sobre los ${E(r.produccion)} kg comercializables.`,
    `La merma (${N(p.merma, 1)}%) se descontó del rendimiento deseado para obtener el rendimiento efectivo vendible.`,
    `Cronograma de egresos del flujo de caja: ${pesosTxt} del costo total por mes; los ingresos por ventas se registran íntegramente en el último mes de la campaña. No incluye IGV, impuesto a la renta, depreciación ni inflación.`,
    `El análisis de sensibilidad mantiene constante el costo total de producción y varía solo el precio y la producción, igual que la plantilla de referencia.`,
    `Ficha técnica: ${esc(sis.fuente)}`
  ];
  const notas = `
    <section><h2>10. Notas y supuestos de formulación</h2>
      <p>Para la elaboración de este costeo se declaran de manera transparente los siguientes supuestos:</p>
      <ul class="recs">${supuestos.map((x) => `<li>${x}</li>`).join("")}</ul>
      <p class="note-box">Documento de carácter referencial, elaborado por el área técnica de CosechaMas. Se recomienda validar los supuestos con información de campo actualizada antes de tomar decisiones de inversión.</p>
    </section>
    <footer class="doc-footer">Informe ${esc(inf.id.toUpperCase())} · Generado el ${fecha(inf.fecha)} para ${esc(usuario.nombre)} · CosechaMas – Asesoría Agrícola 2.0</footer>`;

  doc.innerHTML = portada + ficha + parametros + indicadores + analisis + estructura + resumen + flujo + sensibilidad + recomendaciones + notas;
  doc.querySelectorAll("svg[role=img]").forEach((svg) => {
    const cap = svg.closest("figure")?.querySelector("figcaption")?.textContent;
    if (cap) svg.setAttribute("aria-label", cap);
  });
});
