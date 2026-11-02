// CosechaMas · Base de datos de cultivos
// ---------------------------------------------------------------------------
// Para agregar un cultivo nuevo, copia el bloque de "cebolla" y cambia:
//   - ficha:          datos de la ficha técnica (se muestran tal cual)
//   - valores:        valores sugeridos para el cuestionario de parámetros
//   - estructura:     costo de producción POR HECTÁREA (coef = cantidad por ha)
//   - recomendaciones / plagas: textos para el informe
// Precio "jornal" = toma el costo de jornal que ingresa el usuario.
// tipo "fleteInsumos"    = cantidad = suma de Kg/Lt de todos los insumos.
// tipo "fleteProduccion" = cantidad = producción efectiva en Kg.
// ---------------------------------------------------------------------------
window.COSECHAMAS_CULTIVOS = {
  cebolla: {
    nombre: "Cebolla",
    cientifico: "Allium cepa L.",
    disponible: true,
    variedades: {
      "roja-arequipena": {
        nombre: "Roja Arequipeña",
        disponible: true,
        sistemas: {
          convencional: {
            nombre: "Convencional",
            disponible: true,
            fuente: "Plantilla de costos CosechaMas (referencia por hectárea).",
            ficha: [
              ["Cultivo", "Cebolla"],
              ["Variedad", "Roja Arequipeña"],
              ["Sistema de producción", "Convencional"],
              ["Rango de temperatura óptima", "12.8 °C a 24 °C"],
              ["Rango de altitud (msnm)", "Entre el nivel del mar y 3,500 msnm"],
              ["Suelos", "Suelos de buena textura (franco), fértiles (M.O. 3%) y bien drenados"],
              ["pH del suelo", "Cercano al neutro (6.0 a 7.0)"],
              ["Salinidad", "No tolera suelos salinos (< 1.2 mmhos/cm)"],
              ["Ciclo productivo", "6 meses"],
              ["Tipo de siembra", "Directa"],
              ["Distanciamiento", "50 cm entre surcos y 10 cm entre plantas, dos hileras por surco"],
              ["Época de siembra", "Todo el año"],
              ["Periodo de cosecha", "150 a 180 días después del trasplante"],
              ["Dosis de fertilización (N-P-K)", "244-115-260"],
              ["Tipo de riego", "Gravedad"],
              ["Requerimiento hídrico", "4,500 – 5,000 m³/ha (riego por goteo) y 7,000 – 7,500 m³/ha (riego por gravedad)"]
            ],
            npk: "244-115-260",
            valores: { rendimiento: 30000, merma: 5, precio: 1.2, jornal: 50, tea: 15, meses: 6 },
            indirectos: { imprevistos: 5, administrativos: 5, asistencia: 3 },
            estructura: [
              {
                grupo: "MANO DE OBRA", clave: "manoObra",
                subgrupos: [
                  { nombre: "Preparación de terreno definitivo", items: [
                    { a: "Recojo de maleza, junta y quema", u: "Jornal", coef: 2, precio: "jornal" },
                    { a: "Limpieza de acequias, desagües y drenes", u: "Jornal", coef: 2, precio: "jornal" },
                    { a: "Riego de aniego y remojo", u: "Jornal", coef: 1, precio: "jornal" },
                    { a: "Tomeo y arreglo de bordos y surcos", u: "Jornal", coef: 2, precio: "jornal" }
                  ]},
                  { nombre: "Trasplante", items: [
                    { a: "Arranque, preparación y transporte de plantas", u: "Jornal", coef: 2, precio: "jornal" },
                    { a: "Trasplante", u: "Jornal", coef: 15, precio: "jornal" },
                    { a: "Riego de asentamiento", u: "Jornal", coef: 1, precio: "jornal" },
                    { a: "Replante", u: "Jornal", coef: 2, precio: "jornal" }
                  ]},
                  { nombre: "Labores culturales", items: [
                    { a: "Aplicación de herbicidas (2)", u: "Jornal", coef: 4, precio: "jornal" },
                    { a: "Aplicación de fertilizantes (2)", u: "Jornal", coef: 4, precio: "jornal" },
                    { a: "Deshierbo", u: "Jornal", coef: 10, precio: "jornal" },
                    { a: "Aplicación de insecticidas", u: "Jornal", coef: 2, precio: "jornal" },
                    { a: "Aplicación de fungicidas", u: "Jornal", coef: 2, precio: "jornal" },
                    { a: "Riegos", u: "Jornal", coef: 4, precio: "jornal" },
                    { a: "Tumba", u: "Jornal", coef: 7, precio: "jornal" }
                  ]},
                  { nombre: "Cosecha", items: [
                    { a: "Arranque de plantas, recojo y amontono", u: "Jornal", coef: 15, precio: "jornal" },
                    { a: "Desmoche y selección", u: "Jornal", coef: 20, precio: "jornal" },
                    { a: "Ensacado y pesado", u: "Jornal", coef: 6, precio: "jornal" },
                    { a: "Guardianía", u: "Jornal", coef: 8, precio: "jornal" }
                  ]}
                ]
              },
              {
                grupo: "MAQUINARIA AGRÍCOLA", clave: "maquinaria",
                subgrupos: [
                  { nombre: null, items: [
                    { a: "Rastrojeada", u: "Hora/maq.", coef: 1, precio: 100 },
                    { a: "Aradura", u: "Hora/maq.", coef: 3, precio: 110 },
                    { a: "Gradeo, gancho y nivelación", u: "Hora/maq.", coef: 1, precio: 120 },
                    { a: "Surqueo para la siembra", u: "Hora/maq.", coef: 1, precio: 135 }
                  ]}
                ]
              },
              {
                grupo: "INSUMOS", clave: "insumos",
                subgrupos: [
                  { nombre: "Fertilizantes", tag: "fertilizantes", items: [
                    { a: "Nitrato de amonio", u: "Kg", coef: 600, precio: 3.5, insumo: true },
                    { a: "Fosfato diamónico", u: "Kg", coef: 250, precio: 3.5, insumo: true },
                    { a: "Sulfato de potasio", u: "Kg", coef: 500, precio: 3.0, insumo: true },
                    { a: "Abono foliar", u: "Kg", coef: 3, precio: 45, insumo: true }
                  ]},
                  { nombre: "Insecticidas", tag: "fitosanitarios", items: [
                    { a: "Metomil", u: "Lt", coef: 0.5, precio: 67.84, insumo: true },
                    { a: "Cipermetrina", u: "Lt", coef: 1, precio: 47.5, insumo: true },
                    { a: "Clorpirifos", u: "Lt", coef: 1, precio: 73, insumo: true },
                    { a: "Spinetoram", u: "Lt", coef: 0.25, precio: 400, insumo: true }
                  ]},
                  { nombre: "Fungicidas", tag: "fitosanitarios", items: [
                    { a: "Propineb + Cimoxanil", u: "Kg", coef: 1, precio: 85, insumo: true },
                    { a: "Mancozeb", u: "Kg", coef: 1, precio: 39, insumo: true },
                    { a: "Metiram", u: "Kg", coef: 1, precio: 85, insumo: true }
                  ]},
                  { nombre: "Herbicidas", tag: "fitosanitarios", items: [
                    { a: "Pendimethalin", u: "Lt", coef: 4, precio: 47, insumo: true },
                    { a: "Oxifluorfen", u: "Lt", coef: 1.5, precio: 75, insumo: true },
                    { a: "Cletodim", u: "Lt", coef: 1, precio: 123, insumo: true }
                  ]},
                  { nombre: "pH, adherentes y surfactante", items: [
                    { a: "Varios", u: "Kg o Lt", coef: 1, precio: 15, insumo: true }
                  ]},
                  { nombre: "Agua", tag: "agua", items: [
                    { a: "Canon de agua", u: "m³", coef: 7500, precio: 0.028 }
                  ]}
                ]
              },
              {
                grupo: "VARIOS", clave: "varios",
                subgrupos: [
                  { nombre: null, items: [
                    { a: "Alquiler de terreno", u: "Ha", coef: 1, precio: 1500 },
                    { a: "Envases o sacos para la cosecha", u: "Unidad", coef: 600, precio: 0.5 },
                    { a: "Flete traslado de insumos", u: "Kg", tipo: "fleteInsumos", precio: 0.1 },
                    { a: "Flete traslado de producción", u: "Kg", tipo: "fleteProduccion", precio: 0.1 }
                  ]}
                ]
              }
            ],
            plagas: "trips (Thrips tabaci), mildiu (Peronospora destructor), mancha púrpura (Alternaria porri) y pudrición blanca (Sclerotium cepivorum)",
            recomendacionesCultivo: [
              "Riego: la cebolla tiene raíces superficiales y es sensible tanto al déficit como al exceso de agua. Un riego por gravedad bien nivelado, sin encharcamientos, reduce pudriciones del bulbo; si es posible migrar a riego por goteo, el requerimiento baja de 7,000–7,500 a 4,500–5,000 m³/ha.",
              "Suspender los riegos 2 a 3 semanas antes de la cosecha (al inicio de la tumba) favorece el curado del bulbo, mejora su conservación y reduce la merma post-cosecha.",
              "Curado y selección: dejar orear los bulbos en campo antes del desmoche y clasificarlos por calibre permite acceder a mejores precios en mercados mayoristas y de exportación."
            ]
          },
          organico: { nombre: "Orgánico", disponible: false }
        }
      }
    }
  },
  papa:   { nombre: "Papa",    disponible: false, variedades: {} },
  palta:  { nombre: "Palta",   disponible: false, variedades: {} },
  arveja: { nombre: "Arveja",  disponible: false, variedades: {} },
  ajo:    { nombre: "Ajo",     disponible: false, variedades: {} },
  maiz:   { nombre: "Maíz",    disponible: false, variedades: {} }
};

window.COSECHAMAS_REGIONES = [
  "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Cusco",
  "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque", "Lima", "Loreto",
  "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali"
];
