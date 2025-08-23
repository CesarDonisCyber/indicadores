
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

// ======================
// Tipos y utilidades
// ======================

type Area = "Ciberseguridad" | "Concientización";

type Indicador =
  // Ciberseguridad
  | "Antivirus"
  | "Cortex XDR"
  | "Alertas SIEM"
  | "Alertas O365"
  | "Correos maliciosos"
  // Concientización
  | "Concientización primer ingreso"
  | "Comunicados de ciberseguridad"
  | "Capacitaciones focalizadas"
  | "Pruebas de ingeniería social"
  | "Comunicados ciberseguridad Gerencia tecnología";

const INDICADORES_BY_AREA: Record<Area, Indicador[]> = {
  Ciberseguridad: ["Antivirus", "Cortex XDR", "Alertas SIEM", "Alertas O365", "Correos maliciosos"],
  Concientización: [
    "Concientización primer ingreso",
    "Comunicados de ciberseguridad",
    "Capacitaciones focalizadas",
    "Pruebas de ingeniería social",
    "Comunicados ciberseguridad Gerencia tecnología",
  ],
};

interface Registro {
  id: string;
  area: Area;
  indicador: Indicador;
  fecha: string; // YYYY-MM-DD
  tipo: string; // detalle / tipo / título / campaña / área
  resueltas: number; // métrica A (según indicador)
  sinAtender: number; // métrica B (según indicador)
}

// Storage keys
const LS_KEY = "indicadores_seg_gui_v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function currentYYYYMM() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function format(n: number) {
  return new Intl.NumberFormat().format(n);
}

function monthLabel(ym: string) {
  // ym: YYYY-MM
  const date = new Date(`${ym}-01T00:00:00`);
  return date.toLocaleDateString("es-ES", { year: "numeric", month: "long" });
}

function saveData(data: Registro[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function loadData(): Registro[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed: Registro[] = JSON.parse(raw);
    return parsed.map((r) => ({ ...r, resueltas: Number(r.resueltas || 0), sinAtender: Number(r.sinAtender || 0) }));
  } catch {
    return [];
  }
}

// Etiquetas y comportamiento por indicador
function indicatorLabels(area: Area, indicador: Indicador) {
  if (area === "Concientización") {
    switch (indicador) {
      case "Comunicados de ciberseguridad":
      case "Comunicados ciberseguridad Gerencia tecnología":
        return {
          tipoLabel: "Título del comunicado",
          resLabel: "Envíos",
          sinLabel: "",
          showRes: true,
          showSin: false,
          auto: () => ({ res: 1, sin: 0 }),
        } as const;
      case "Capacitaciones focalizadas":
        return { tipoLabel: "Área", resLabel: "Personal capacitado", sinLabel: "", showRes: true, showSin: false } as const;
      case "Pruebas de ingeniería social":
        return { tipoLabel: "Nombre de la campaña", resLabel: "Enviados", sinLabel: "Víctimas", showRes: true, showSin: true } as const;
      case "Concientización primer ingreso":
        return { tipoLabel: "Descripción / campaña", resLabel: "Completadas", sinLabel: "Pendientes", showRes: true, showSin: true } as const;
    }
  }
  // Ciberseguridad (por defecto)
  return { tipoLabel: "Tipo de evento", resLabel: "Resueltas", sinLabel: "Sin atender", showRes: true, showSin: true } as const;
}

type FormFields = { fecha: string; tipo: string; resueltas: string; sinAtender: string };

export default function App() {
  const [view, setView] = useState<"menu" | "carga" | "resultados">("menu");
  const [area, setArea] = useState<Area>("Ciberseguridad");
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [mesResultados, setMesResultados] = useState<string>(currentYYYYMM());
  const [resTab, setResTab] = useState<"mensual" | "historico">("mensual");

  const allIndicators = [...INDICADORES_BY_AREA.Ciberseguridad, ...INDICADORES_BY_AREA.Concientización];
  const initForm: FormFields = { fecha: currentYMD(), tipo: "", resueltas: "", sinAtender: "" };
  const initialFormState = allIndicators.reduce((acc, ind) => ({ ...acc, [ind]: { ...initForm } }), {}) as Record<
    Indicador,
    FormFields
  >;
  const [form, setForm] = useState<Record<Indicador, FormFields>>(initialFormState);

  const [tab, setTab] = useState<Indicador>(INDICADORES_BY_AREA.Ciberseguridad[0]);
  useEffect(() => {
    const first = INDICADORES_BY_AREA[area][0];
    setTab(first);
  }, [area]);

  // Carga inicial
  useEffect(() => {
    setRegistros(loadData());
  }, []);

  useEffect(() => {
    saveData(registros);
  }, [registros]);

  function addRegistro(indicador: Indicador) {
    const f = form[indicador];
    const L = indicatorLabels(area, indicador);

    // Autollenado para algunos indicadores
    let r = Number(f.resueltas);
    let s = Number(f.sinAtender);
    if ((L as any).auto) {
      const a = (L as any).auto();
      r = a.res;
      s = a.sin;
    }

    if (!f.fecha || !f.tipo || isNaN(r) || isNaN(s)) return;
    const item: Registro = { id: uid(), area, indicador, fecha: f.fecha, tipo: f.tipo.trim(), resueltas: r, sinAtender: s };
    setRegistros((prev) => [...prev, item]);
    setForm((prev) => ({ ...prev, [indicador]: { ...initForm, fecha: f.fecha } }));
  }

  function removeRegistro(id: string) {
    setRegistros((prev) => prev.filter((x) => x.id !== id));
  }

  // ====== Derivados para resultados ======
  const mesesDisponibles = useMemo(() => {
    const setm = new Set(registros.filter((r) => r.area === area).map((r) => r.fecha.slice(0, 7)));
    const arr = Array.from(setm);
    arr.sort();
    return arr;
  }, [registros, area]);

  const mesesParaSelect = useMemo(() => {
    const list = mesesDisponibles.length ? mesesDisponibles : [mesResultados];
    return list.includes(mesResultados) ? list : [mesResultados, ...list];
  }, [mesesDisponibles, mesResultados]);

  const filtradosMes = useMemo(
    () => registros.filter((r) => r.fecha.slice(0, 7) === mesResultados && r.area === area),
    [registros, mesResultados, area]
  );

  const resumenPorIndicador = useMemo(() => {
    return INDICADORES_BY_AREA[area].map((ind) => {
      const list = filtradosMes.filter((r) => r.indicador === ind);
      const resueltas = list.reduce((a, b) => a + b.resueltas, 0);
      const sinAtender = list.reduce((a, b) => a + b.sinAtender, 0);
      return { indicador: ind, resueltas, sinAtender, total: resueltas + sinAtender };
    });
  }, [filtradosMes, area]);

  const tablaResultados = useMemo(() => {
    return [...filtradosMes].sort((a, b) => (a.indicador + a.fecha + a.tipo).localeCompare(b.indicador + b.fecha + b.tipo));
  }, [filtradosMes]);

  const historicoPorMes = useMemo(() => {
    const map = new Map<string, { resueltas: number; sinAtender: number; total: number }>();
    registros
      .filter((r) => r.area === area)
      .forEach((r) => {
        const m = r.fecha.slice(0, 7);
        const cur = map.get(m) || { resueltas: 0, sinAtender: 0, total: 0 };
        cur.resueltas += r.resueltas;
        cur.sinAtender += r.sinAtender;
        cur.total = cur.resueltas + cur.sinAtender;
        map.set(m, cur);
      });
    const arr = Array.from(map.entries()).map(([mes, v]) => ({ mes, ...v }));
    arr.sort((a, b) => a.mes.localeCompare(b.mes));
    return arr;
  }, [registros, area]);

  const historicoMesIndicador = useMemo(() => {
    const map: Record<string, Record<string, { res: number; sin: number; total: number }>> = {};
    registros
      .filter((r) => r.area === area)
      .forEach((r) => {
        const m = r.fecha.slice(0, 7);
        map[m] = map[m] || {};
        const ind = r.indicador as string;
        const cur = map[m][ind] || { res: 0, sin: 0, total: 0 };
        cur.res += r.resueltas;
        cur.sin += r.sinAtender;
        cur.total = cur.res + cur.sin;
        map[m][ind] = cur;
      });
    const rows: { mes: string; indicador: string; resueltas: number; sinAtender: number; total: number }[] = [];
    Object.keys(map)
      .sort()
      .forEach((m) => {
        Object.keys(map[m])
          .sort()
          .forEach((ind) => {
            const v = map[m][ind];
            rows.push({ mes: m, indicador: ind, resueltas: v.res, sinAtender: v.sin, total: v.total });
          });
      });
    return rows;
  }, [registros, area]);

  // Helpers de UI
  const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" }) => {
    const { variant = "primary", className = "", ...rest } = props;
    const base = "btn " + (variant === "primary" ? "btn-primary" : "btn-outline");
    return <button className={`${base} ${className}`} {...rest} />;
  };

  function renderForm(ind: Indicador) {
    const L = indicatorLabels(area, ind);
    const F = form[ind];
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Fecha</label>
          <input type="date" className="input" value={F.fecha} onChange={(e) => setForm((prev) => ({ ...prev, [ind]: { ...prev[ind], fecha: e.target.value } }))} />
        </div>
        <div>
          <label className="label">{L.tipoLabel}</label>
          <input className="input" placeholder={L.tipoLabel} value={F.tipo} onChange={(e) => setForm((prev) => ({ ...prev, [ind]: { ...prev[ind], tipo: e.target.value } }))} />
        </div>
        {L.showRes && (
          <div>
            <label className="label">{L.resLabel}</label>
            <input type="number" min={0} className="input" placeholder="0" value={F.resueltas} onChange={(e) => setForm((prev) => ({ ...prev, [ind]: { ...prev[ind], resueltas: e.target.value } }))} />
          </div>
        )}
        {L.showSin && (
          <div>
            <label className="label">{L.sinLabel}</label>
            <input type="number" min={0} className="input" placeholder="0" value={F.sinAtender} onChange={(e) => setForm((prev) => ({ ...prev, [ind]: { ...prev[ind], sinAtender: e.target.value } }))} />
          </div>
        )}
      </div>
    );
  }

  function renderTablaCarga(ind: Indicador) {
    const L = indicatorLabels(area, ind);
    const rows = registros
      .filter((r) => r.area === area && r.indicador === ind)
      .sort((a, b) => (a.fecha + a.tipo).localeCompare(b.fecha + b.tipo));

    return (
      <div className="mt-2 max-h-80 overflow-auto border rounded-xl">
        <table className="table">
          <thead>
            <tr>
              <th className="text-left">Indicador</th>
              <th className="text-left">Fecha</th>
              <th className="text-left">{L.tipoLabel}</th>
              {L.showRes && <th className="text-right">{L.resLabel}</th>}
              {L.showSin && <th className="text-right">{L.sinLabel}</th>}
              <th className="text-right">Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td>{r.indicador}</td>
                <td>{r.fecha}</td>
                <td>{r.tipo}</td>
                {L.showRes && <td className="text-right">{format(r.resueltas)}</td>}
                {L.showSin && <td className="text-right">{format(r.sinAtender)}</td>}
                <td className="text-right">{format(r.resueltas + r.sinAtender)}</td>
                <td className="text-right">
                  <button className="btn btn-outline" onClick={() => removeRegistro(r.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {view !== "menu" && (
              <button className="btn btn-outline" onClick={() => setView("menu")}>⟵ Inicio</button>
            )}
            <h1 className="text-xl font-semibold">Indicadores</h1>
          </div>
        </div>

        {view === "menu" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="text-lg font-semibold mb-3">Carga de indicadores</h2>
              <div className="mb-3">
                <label className="label">Área</label>
                <select className="select w-64" value={area} onChange={(e) => setArea(e.target.value as Area)}>
                  <option value="Ciberseguridad">Ciberseguridad</option>
                  <option value="Concientización">Concientización</option>
                </select>
              </div>
              <Button onClick={() => setView("carga")}>Ir a Carga</Button>
            </div>

            <div className="card p-5">
              <h2 className="text-lg font-semibold mb-3">Visualización de resultados</h2>
              <div className="mb-3">
                <label className="label">Área</label>
                <select className="select w-64" value={area} onChange={(e) => setArea(e.target.value as Area)}>
                  <option value="Ciberseguridad">Ciberseguridad</option>
                  <option value="Concientización">Concientización</option>
                </select>
              </div>
              <Button onClick={() => setView("resultados")}>Ver Resultados</Button>
            </div>
          </div>
        )}

        {view === "carga" && (
          <div className="grid grid-cols-1 gap-6">
            <div className="card p-5">
              <h2 className="text-lg font-semibold mb-4">{area} — Carga de indicadores</h2>

              {/* Tabs por indicador (botones) */}
              <div className="flex flex-wrap gap-2 mb-4">
                {INDICADORES_BY_AREA[area].map((i) => (
                  <button
                    key={i}
                    className={`tab ${tab === i ? "tab-active" : ""}`}
                    onClick={() => setTab(i)}
                  >
                    {i}
                  </button>
                ))}
              </div>

              {/* Form del indicador seleccionado */}
              {renderForm(tab)}
              <div className="mt-3">
                <Button onClick={() => addRegistro(tab)}>Agregar registro</Button>
              </div>

              {/* Tabla del indicador seleccionado */}
              {renderTablaCarga(tab)}
            </div>
          </div>
        )}

        {view === "resultados" && (
          <div className="grid grid-cols-1 gap-6">
            <div className="card p-5">
              <h2 className="text-lg font-semibold mb-3">Resumen</h2>

              {/* Tabs Mensual/Historico */}
              <div className="flex items-center gap-2 mb-4">
                <button className={`tab ${resTab === "mensual" ? "tab-active" : ""}`} onClick={() => setResTab("mensual")}>Mensual</button>
                <button className={`tab ${resTab === "historico" ? "tab-active" : ""}`} onClick={() => setResTab("historico")}>Histórico</button>
              </div>

              {/* Área */}
              <div className="mb-4">
                <label className="label">Área</label>
                <select className="select w-64" value={area} onChange={(e) => setArea(e.target.value as Area)}>
                  <option value="Ciberseguridad">Ciberseguridad</option>
                  <option value="Concientización">Concientización</option>
                </select>
              </div>

              {resTab === "mensual" && (
                <>
                  <div className="mb-4">
                    <label className="label">Mes</label>
                    <select className="select w-64" value={mesResultados} onChange={(e) => setMesResultados(e.target.value)}>
                      {mesesParaSelect.map((m) => (
                        <option key={m} value={m}>
                          {monthLabel(m)} ({m})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                    {resumenPorIndicador.map((k) => {
                      const L = indicatorLabels(area, k.indicador as Indicador);
                      return (
                        <div key={k.indicador} className="card p-4">
                          <div className="font-semibold mb-2">{k.indicador}</div>
                          {L.showRes && (
                            <div className="flex justify-between"><span>{L.resLabel}</span><strong>{format(k.resueltas)}</strong></div>
                          )}
                          {L.showSin && (
                            <div className="flex justify-between"><span>{L.sinLabel}</span><strong>{format(k.sinAtender)}</strong></div>
                          )}
                          <div className="flex justify-between border-t pt-2 mt-2"><span>Total</span><strong>{format(k.total)}</strong></div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Gráfico apilado por indicador */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={resumenPorIndicador}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="indicador" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="resueltas" name="Métrica A" stackId="a" />
                        <Bar dataKey="sinAtender" name="Métrica B" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Detalle del mes */}
                  <div className="max-h-96 overflow-auto border rounded-xl mt-4">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="text-left">Indicador</th>
                          <th className="text-left">Fecha</th>
                          <th className="text-left">Detalle</th>
                          <th className="text-right">Métrica A</th>
                          <th className="text-right">Métrica B</th>
                          <th className="text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tablaResultados.length === 0 && (
                          <tr><td className="p-3 text-slate-500" colSpan={6}>Sin datos para el mes seleccionado.</td></tr>
                        )}
                        {tablaResultados.map((r) => (
                          <tr key={r.id} className="border-t">
                            <td>{r.indicador}</td>
                            <td>{r.fecha}</td>
                            <td>{r.tipo}</td>
                            <td className="text-right">{format(r.resueltas)}</td>
                            <td className="text-right">{format(r.sinAtender)}</td>
                            <td className="text-right">{format(r.resueltas + r.sinAtender)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {resTab === "historico" && (
                <>
                  {/* Gráfico por mes */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={historicoPorMes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" tickFormatter={(v) => monthLabel(String(v))} />
                        <YAxis />
                        <Tooltip formatter={(v: any) => format(Number(v))} labelFormatter={(l: any) => monthLabel(String(l))} />
                        <Legend />
                        <Bar dataKey="resueltas" name="Métrica A" stackId="a" />
                        <Bar dataKey="sinAtender" name="Métrica B" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tabla totales por mes */}
                  <div className="max-h-80 overflow-auto border rounded-xl mt-4">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="text-left">Mes</th>
                          <th className="text-right">Métrica A</th>
                          <th className="text-right">Métrica B</th>
                          <th className="text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicoPorMes.length === 0 && (
                          <tr><td className="p-3 text-slate-500" colSpan={4}>Sin datos históricos.</td></tr>
                        )}
                        {historicoPorMes.map((r) => (
                          <tr key={r.mes} className="border-t">
                            <td>{monthLabel(r.mes)} ({r.mes})</td>
                            <td className="text-right">{format(r.resueltas)}</td>
                            <td className="text-right">{format(r.sinAtender)}</td>
                            <td className="text-right">{format(r.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Detalle histórico por mes + indicador */}
                  <div className="max-h-96 overflow-auto border rounded-xl mt-4">
                    <table className="table">
                      <thead>
                        <tr>
                          <th className="text-left">Mes</th>
                          <th className="text-left">Indicador</th>
                          <th className="text-right">Métrica A</th>
                          <th className="text-right">Métrica B</th>
                          <th className="text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicoMesIndicador.length === 0 && (
                          <tr><td className="p-3 text-slate-500" colSpan={5}>Sin detalle histórico.</td></tr>
                        )}
                        {historicoMesIndicador.map((r, idx) => (
                          <tr key={`${r.mes}-${r.indicador}-${idx}`} className="border-t">
                            <td>{monthLabel(r.mes)} ({r.mes})</td>
                            <td>{r.indicador}</td>
                            <td className="text-right">{format(r.resueltas)}</td>
                            <td className="text-right">{format(r.sinAtender)}</td>
                            <td className="text-right">{format(r.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Pie de ayuda */}
        <div className="mt-6 text-sm text-slate-600">
          <p>💡 Todos los datos se guardan en tu navegador (localStorage). Puedes incrustar esta app en SharePoint usando el web part “Insertar (Embed)”.</p>
        </div>
      </div>
    </div>
  );
}
