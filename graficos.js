// CosechaMas · Gráficos SVG livianos para el informe (sin librerías externas)
// Cada gráfico incluye <title> en las marcas (tooltip al pasar el mouse) y
// el informe muestra también la tabla con los mismos datos.
(function () {
  "use strict";
  const TINTA = "#1d2e22", TINTA2 = "#5d6d60", REJILLA = "#e3eadf", EJE = "#9fb59a";
  const VERDE = "#2f7d4a", NEG = "#b54a3a";
  const FUENTE = 'font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function ticks(min, max, n = 5) {
    if (min === max) { max = min + 1; }
    const paso0 = (max - min) / n, mag = Math.pow(10, Math.floor(Math.log10(paso0)));
    const paso = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => p >= paso0);
    const a = Math.floor(min / paso) * paso, b = Math.ceil(max / paso) * paso;
    const t = []; for (let v = a; v <= b + paso / 2; v += paso) t.push(Math.round(v * 1e6) / 1e6);
    return t;
  }
  const corto = (v) => {
    const a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toLocaleString("es-PE", { maximumFractionDigits: 1 }) + " M";
    if (a >= 1e3) return (v / 1e3).toLocaleString("es-PE", { maximumFractionDigits: 1 }) + " mil";
    return v.toLocaleString("es-PE", { maximumFractionDigits: 2 });
  };

  // Barras horizontales (composición de costos)
  function barrasH(datos, { fmt = corto, ancho = 640 } = {}) {
    const fila = 30, izq = 230, der = 90, top = 6;
    const alto = top + datos.length * fila + 6;
    const max = Math.max(...datos.map((d) => d.valor), 1);
    const w = ancho - izq - der;
    let s = `<svg viewBox="0 0 ${ancho} ${alto}" role="img" ${FUENTE} font-size="12">`;
    datos.forEach((d, i) => {
      const y = top + i * fila, bw = Math.max(2, (d.valor / max) * w);
      s += `<text x="${izq - 10}" y="${y + 19}" text-anchor="end" fill="${TINTA}">${esc(d.etiqueta)}</text>`;
      s += `<g><title>${esc(d.etiqueta)}: ${esc(fmt(d.valor))}</title>
        <rect x="${izq}" y="${y + 6}" width="${bw}" height="18" rx="4" fill="${d.color || VERDE}"/></g>`;
      s += `<text x="${izq + bw + 8}" y="${y + 19}" fill="${TINTA2}" font-weight="700">${esc(fmt(d.valor))}</text>`;
    });
    return s + `<line x1="${izq}" x2="${izq}" y1="${top}" y2="${alto - 6}" stroke="${EJE}"/></svg>`;
  }

  // Columnas con valores positivos y negativos (flujo neto, costo vs utilidad)
  function columnas(datos, { fmt = corto, ancho = 640, alto = 280, tituloY = "" } = {}) {
    const izq = 64, der = 14, top = 26, abajo = 34;
    const vals = datos.map((d) => d.valor);
    const t = ticks(Math.min(0, ...vals), Math.max(0, ...vals));
    const lo = t[0], hi = t[t.length - 1];
    const h = alto - top - abajo, w = ancho - izq - der;
    const y = (v) => top + (hi - v) / (hi - lo) * h;
    const banda = w / datos.length, bw = Math.min(64, banda * 0.56);
    let s = `<svg viewBox="0 0 ${ancho} ${alto}" role="img" ${FUENTE} font-size="12">`;
    t.forEach((v) => {
      s += `<line x1="${izq}" x2="${ancho - der}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? EJE : REJILLA}" stroke-width="${v === 0 ? 1.5 : 1}"/>`;
      s += `<text x="${izq - 8}" y="${y(v) + 4}" text-anchor="end" fill="${TINTA2}">${esc(corto(v))}</text>`;
    });
    if (tituloY) s += `<text x="${izq - 56}" y="${top - 12}" fill="${TINTA2}">${esc(tituloY)}</text>`;
    datos.forEach((d, i) => {
      const cx = izq + banda * i + banda / 2, y0 = y(0), y1 = y(d.valor);
      const top1 = Math.min(y0, y1), hh = Math.max(1.5, Math.abs(y1 - y0));
      const color = d.color || (d.valor < 0 ? NEG : VERDE);
      s += `<g><title>${esc(d.etiqueta)}: ${esc(fmt(d.valor))}</title><rect x="${cx - bw / 2}" y="${top1}" width="${bw}" height="${hh}" rx="4" fill="${color}"/></g>`;
      const ly = d.valor < 0 ? y1 + 15 : y1 - 6;
      s += `<text x="${cx}" y="${ly}" text-anchor="middle" fill="${TINTA}" font-weight="700" font-size="11">${esc(fmt(d.valor))}</text>`;
      s += `<text x="${cx}" y="${alto - 12}" text-anchor="middle" fill="${TINTA2}">${esc(d.etiqueta)}</text>`;
    });
    return s + `</svg>`;
  }

  // Líneas (punto de equilibrio, sensibilidad). series: [{nombre, color, puntos:[{x,y}], guion}]
  function lineas(series, { ancho = 640, alto = 300, fmtX = corto, fmtY = corto, tituloX = "", tituloY = "", marcaX = null, etiquetasFin = true } = {}) {
    const izq = 66, der = etiquetasFin ? 96 : 16, top = 26, abajo = 46;
    const xs = series.flatMap((s) => s.puntos.map((p) => p.x)), ys = series.flatMap((s) => s.puntos.map((p) => p.y));
    const tx = ticks(Math.min(...xs), Math.max(...xs), 6), ty = ticks(Math.min(0, ...ys), Math.max(...ys));
    const w = ancho - izq - der, h = alto - top - abajo;
    const X = (v) => izq + (v - tx[0]) / (tx[tx.length - 1] - tx[0]) * w;
    const Y = (v) => top + (ty[ty.length - 1] - v) / (ty[ty.length - 1] - ty[0]) * h;
    let s = `<svg viewBox="0 0 ${ancho} ${alto}" role="img" ${FUENTE} font-size="12">`;
    ty.forEach((v) => {
      s += `<line x1="${izq}" x2="${izq + w}" y1="${Y(v)}" y2="${Y(v)}" stroke="${v === 0 ? EJE : REJILLA}" stroke-width="${v === 0 ? 1.5 : 1}"/>`;
      s += `<text x="${izq - 8}" y="${Y(v) + 4}" text-anchor="end" fill="${TINTA2}">${esc(fmtY(v))}</text>`;
    });
    tx.forEach((v) => (s += `<text x="${X(v)}" y="${top + h + 18}" text-anchor="middle" fill="${TINTA2}">${esc(fmtX(v))}</text>`));
    if (tituloX) s += `<text x="${izq + w / 2}" y="${alto - 6}" text-anchor="middle" fill="${TINTA2}">${esc(tituloX)}</text>`;
    if (tituloY) s += `<text x="${izq - 58}" y="${top - 12}" fill="${TINTA2}">${esc(tituloY)}</text>`;
    if (marcaX) {
      s += `<line x1="${X(marcaX.x)}" x2="${X(marcaX.x)}" y1="${top}" y2="${top + h}" stroke="${TINTA2}" stroke-dasharray="4 4"/>`;
      s += `<text x="${X(marcaX.x) + 6}" y="${top + 12}" fill="${TINTA}" font-weight="700">${esc(marcaX.texto)}</text>`;
    }
    series.forEach((se) => {
      const d = se.puntos.map((p, i) => (i ? "L" : "M") + X(p.x).toFixed(1) + " " + Y(p.y).toFixed(1)).join(" ");
      s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" ${se.guion ? 'stroke-dasharray="7 5"' : ""}/>`;
      se.puntos.forEach((p) => {
        s += `<g><title>${esc(se.nombre)} · ${esc(fmtX(p.x))}: ${esc(fmtY(p.y))}</title>
          <circle cx="${X(p.x)}" cy="${Y(p.y)}" r="9" fill="transparent"/>
          <circle cx="${X(p.x)}" cy="${Y(p.y)}" r="4" fill="${se.color}" stroke="#fff" stroke-width="2"/></g>`;
      });
      if (etiquetasFin) {
        const u = se.puntos[se.puntos.length - 1];
        s += `<text x="${X(u.x) + 10}" y="${Y(u.y) + 4}" fill="${TINTA}" font-size="11" font-weight="700">${esc(se.corto || se.nombre)}</text>`;
      }
    });
    return s + `</svg>`;
  }

  const leyenda = (series) => `<ul class="chart-legend">${series.map((s) =>
    `<li><i style="background:${s.color}"></i>${esc(s.nombre)}</li>`).join("")}</ul>`;

  window.Graficos = { barrasH, columnas, lineas, leyenda, corto, VERDE, NEG };
})();
