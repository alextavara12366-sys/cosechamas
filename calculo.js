// CosechaMas · Motor de cálculo del costo de producción
// Replica las fórmulas de la plantilla Excel: Costo de Producción, Resumen,
// Flujo de Caja y Dashboard (punto de equilibrio y sensibilidad).
(function () {
  "use strict";

  const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

  // Distribución mensual de egresos. Para 6 meses usa la plantilla (30/15/15/15/10/15).
  function pesosEgresos(meses) {
    if (meses === 6) return [0.30, 0.15, 0.15, 0.15, 0.10, 0.15];
    if (meses <= 1) return [1];
    if (meses === 2) return [0.70, 0.30];
    const medio = 0.55 / (meses - 2);
    return [0.30, ...Array(meses - 2).fill(medio), 0.15];
  }

  function obtenerSistema(cultivoKey, variedadKey, sistemaKey) {
    const c = window.COSECHAMAS_CULTIVOS[cultivoKey];
    const v = c && c.variedades[variedadKey];
    const s = v && v.sistemas[sistemaKey];
    if (!s || !s.disponible) throw new Error("Combinación de cultivo no disponible");
    return { cultivo: c, variedad: v, sistema: s };
  }

  function calcular(sel, p) {
    const { cultivo, variedad, sistema } = obtenerSistema(sel.cultivo, sel.variedad, sel.sistema);
    const area = Number(p.area);
    const meses = Math.round(Number(p.meses));
    const tasaCampana = (Math.pow(1 + Number(p.tea) / 100, meses / 12) - 1) * 100;
    const rendEfectivo = p.rendimiento * (1 - p.merma / 100);   // kg/ha comercializables
    const produccion = rendEfectivo * area;                       // kg totales

    // ---------- Costos directos ----------
    let kgInsumos = 0;
    sistema.estructura.forEach((g) => g.subgrupos.forEach((sg) => sg.items.forEach((it) => {
      if (it.insumo) kgInsumos += it.coef * area;
    })));

    const tags = {};
    const grupos = sistema.estructura.map((g) => {
      let totalGrupo = 0, jornalesGrupo = 0;
      const subgrupos = g.subgrupos.map((sg) => {
        let totalSub = 0, cantSub = 0;
        const items = sg.items.map((it) => {
          let cant;
          if (it.tipo === "fleteInsumos") cant = kgInsumos;
          else if (it.tipo === "fleteProduccion") cant = produccion;
          else cant = it.coef * area;
          const pu = it.precio === "jornal" ? Number(p.jornal) : it.precio;
          const total = cant * pu;
          totalSub += total; cantSub += cant;
          if (it.u === "Jornal") jornalesGrupo += cant;
          return { actividad: it.a, unidad: it.u, cantidad: cant, unitario: pu, total };
        });
        if (sg.tag) tags[sg.tag] = (tags[sg.tag] || 0) + totalSub;
        if (sg.nombre) tags["sub:" + sg.nombre] = totalSub;
        totalGrupo += totalSub;
        return { nombre: sg.nombre, items, total: totalSub, cantidad: cantSub };
      });
      return { grupo: g.grupo, clave: g.clave, subgrupos, total: totalGrupo, jornales: jornalesGrupo };
    });

    const porClave = Object.fromEntries(grupos.map((g) => [g.clave, g.total]));
    const directos = grupos.reduce((s, g) => s + g.total, 0);

    // ---------- Costos indirectos ----------
    const ind = sistema.indirectos;
    const indirectos = [
      { nombre: `Imprevistos (${ind.imprevistos}% CD)`, tasa: ind.imprevistos },
      { nombre: `Gastos administrativos (${ind.administrativos}% CD)`, tasa: ind.administrativos },
      { nombre: `Asistencia técnica (${ind.asistencia}% CD)`, tasa: ind.asistencia },
      { nombre: `Intereses bancarios por campaña (${tasaCampana.toFixed(2)}% CD)`, tasa: tasaCampana, interes: true }
    ].map((x) => ({ ...x, base: directos, total: (x.tasa * directos) / 100 }));
    const totalIndirectos = indirectos.reduce((s, x) => s + x.total, 0);
    const costoTotal = directos + totalIndirectos;

    // ---------- Resumen ----------
    const pct = (v) => (costoTotal ? (v / costoTotal) * 100 : 0);
    const resumen = {
      directos: [
        { item: "1.1", nombre: "Mano de obra (labores culturales)", total: porClave.manoObra || 0 },
        { item: "1.2", nombre: "Insumos", total: porClave.insumos || 0 },
        { item: "1.3", nombre: "Alquiler de maquinaria agrícola", total: porClave.maquinaria || 0 },
        { item: "1.4", nombre: "Varios", total: porClave.varios || 0 }
      ].map((x) => ({ ...x, pct: pct(x.total) })),
      indirectos: indirectos.map((x, i) => ({ item: "2." + (i + 1), nombre: x.nombre, total: x.total, pct: pct(x.total) })),
      subtotalDirectos: directos, subtotalIndirectos: totalIndirectos, total: costoTotal
    };

    // ---------- Flujo de caja ----------
    const pesos = pesosEgresos(meses);
    const ingresosTotales = produccion * p.precio;
    let acumulado = 0;
    const flujo = pesos.map((w, i) => {
      const egreso = costoTotal * w;
      const ingreso = i === pesos.length - 1 ? ingresosTotales : 0;
      const neto = ingreso - egreso;
      acumulado += neto;
      return { mes: i + 1, pesoEgreso: w, egreso, ingreso, neto, acumulado };
    });

    // ---------- Indicadores ----------
    const vbp = ingresosTotales;
    const utilidad = vbp - costoTotal;
    const indicadores = {
      vbp, costoTotal, utilidad,
      rentabilidad: costoTotal ? (utilidad / costoTotal) * 100 : 0,
      beneficioCosto: costoTotal ? vbp / costoTotal : 0,
      costoUnitario: produccion ? costoTotal / produccion : 0,
      peFisico: p.precio ? costoTotal / p.precio : 0,           // kg a vender
      peEconomico: produccion ? costoTotal / produccion : 0     // S/ por kg
    };

    // ---------- Sensibilidad (plantilla: costo total constante) ----------
    const prodBase = p.rendimiento * area;
    const factoresProd = [0.8, 0.9, 1.0, 1.1];
    const factoresPrecio = [0.8, 0.9, 1.0, 1.1, 1.2];
    const utilidadCon = (fProd, fPrecio) =>
      prodBase * fProd * (1 - p.merma / 100) * p.precio * fPrecio - costoTotal;
    const sensibilidad = {
      factoresProd, factoresPrecio,
      producciones: factoresProd.map((f) => prodBase * f),
      precios: factoresPrecio.map((f) => p.precio * f),
      matriz: factoresPrecio.map((fp) => factoresProd.map((fq) => utilidadCon(fq, fp)))
    };
    const base = utilidad;
    const esc = (nombre, variable, fq, fp) => {
      const u = utilidadCon(fq, fp);
      return { nombre, variable, utilidad: u, variacion: base ? ((u - base) / Math.abs(base)) * 100 : 0 };
    };
    const fmtS = (n) => "S/ " + n.toFixed(2);
    const fmtK = (n) => Math.round(n).toLocaleString("es-PE");
    const escenarios = [
      { nombre: "Base", variable: `Precio ${fmtS(p.precio)} · Rend. ${fmtK(p.rendimiento)} kg/ha`, utilidad: base, variacion: null },
      esc("Conservador", `Precio −10% (${fmtS(p.precio * 0.9)})`, 1, 0.9),
      esc("Conservador", `Rendimiento −10% (${fmtK(p.rendimiento * 0.9)} kg/ha)`, 0.9, 1),
      esc("Conservador (ambos)", "Precio −10% y rendimiento −10%", 0.9, 0.9),
      esc("Optimista", `Precio +10% (${fmtS(p.precio * 1.1)})`, 1, 1.1),
      esc("Optimista", `Rendimiento +10% (${fmtK(p.rendimiento * 1.1)} kg/ha)`, 1.1, 1),
      esc("Optimista (ambos)", "Precio +10% y rendimiento +10%", 1.1, 1.1)
    ];

    // ---------- Punto de equilibrio (gráfico) ----------
    const pe = indicadores.peFisico;
    const volumenes = [0, 0.25, 0.5, 1, 1.5, 2, 2.5].map((f) => pe * f);
    const equilibrio = volumenes.map((v) => ({ volumen: v, ingreso: v * p.precio, costo: costoTotal }));

    // ---------- Partidas para recomendaciones ----------
    const partidas = {
      fertilizantes: tags.fertilizantes || 0,
      fitosanitarios: tags.fitosanitarios || 0,
      agua: tags.agua || 0,
      cosecha: tags["sub:Cosecha"] || 0,
      interes: indirectos.find((x) => x.interes).total
    };

    return {
      seleccion: { cultivo: cultivo.nombre, cientifico: cultivo.cientifico, variedad: variedad.nombre, sistema: sistema.nombre },
      sistema, parametros: { ...p, area, meses }, tasaCampana, rendEfectivo, produccion, kgInsumos,
      grupos, directos, indirectos, totalIndirectos, costoTotal, resumen, flujo,
      indicadores, sensibilidad, escenarios, equilibrio, partidas,
      porHa: (v) => (area ? v / area : 0)
    };
  }

  window.CosechaCalculo = { calcular, obtenerSistema, tasaCampana: (tea, meses) => (Math.pow(1 + tea / 100, meses / 12) - 1) * 100, r2 };
})();
