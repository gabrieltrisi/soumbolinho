"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatBRL } from "@/lib/billing";
import Kpi from "@/components/Kpi";

type Relatorio = {
  de: string;
  ate: string;
  total: number;
  atendimentos: number;
  ticket: number;
  tempoMedioMin: number;
  porForma: Record<string, number>;
  porDia: Record<string, number>;
  porHora: number[];
};

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function diasEntre(de: string, ate: string) {
  const out: string[] = [];
  const d = new Date(de + "T12:00:00");
  const fim = new Date(ate + "T12:00:00");
  while (d <= fim && out.length < 400) {
    out.push(ymd(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}
function rotuloDia(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

const PRESETS = [
  { id: "hoje", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "mes", label: "Este mês" },
  { id: "custom", label: "Período" },
] as const;

export default function RelatoriosPage() {
  const hoje = ymd(new Date());
  const [preset, setPreset] = useState<string>("hoje");
  const [de, setDe] = useState(hoje);
  const [ate, setAte] = useState(hoje);
  const [dados, setDados] = useState<Relatorio | null>(null);
  const [carregando, setCarregando] = useState(true);

  function aplicarPreset(id: string) {
    setPreset(id);
    const agora = new Date();
    if (id === "hoje") {
      setDe(ymd(agora));
      setAte(ymd(agora));
    } else if (id === "7d") {
      const d = new Date(agora);
      d.setDate(d.getDate() - 6);
      setDe(ymd(d));
      setAte(ymd(agora));
    } else if (id === "mes") {
      setDe(ymd(new Date(agora.getFullYear(), agora.getMonth(), 1)));
      setAte(ymd(agora));
    }
  }

  const carregar = useCallback(async () => {
    setCarregando(true);
    const r = await fetch(`/api/relatorios?de=${de}&ate=${ate}`, { cache: "no-store" });
    if (r.ok) setDados(await r.json());
    setCarregando(false);
  }, [de, ate]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function exportarCsv() {
    const r = await fetch(`/api/relatorios/csv?de=${de}&ate=${ate}`, { cache: "no-store" });
    if (!r.ok) return;
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorios-${de}_a_${ate}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const dias = useMemo(() => diasEntre(de, ate), [de, ate]);
  const maxDia = useMemo(() => Math.max(1, ...dias.map((d) => dados?.porDia[d] ?? 0)), [dias, dados]);
  const horas = useMemo(() => {
    const arr = dados?.porHora ?? [];
    const ativos = arr.map((v, h) => ({ h, v })).filter((x) => x.v > 0);
    const inicio = ativos.length ? Math.min(...ativos.map((x) => x.h)) : 8;
    const fim = ativos.length ? Math.max(...ativos.map((x) => x.h)) : 18;
    const lista = [];
    for (let h = inicio; h <= fim; h++) lista.push({ h, v: arr[h] ?? 0 });
    return lista;
  }, [dados]);
  const maxHora = useMemo(() => Math.max(1, ...horas.map((x) => x.v)), [horas]);

  const inputData = "rounded-2xl border border-line bg-white/70 px-3 py-2 text-sm text-ink focus:border-rosa focus:bg-white";

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Relatórios</h1>
          <p className="mt-1 text-ink-soft">Faturamento e movimento por período.</p>
        </div>
        {dados && dados.atendimentos > 0 && (
          <button
            onClick={exportarCsv}
            className="flex-none rounded-full border border-teal/50 bg-teal/10 px-4 py-2 font-display text-[13px] font-semibold text-teal transition hover:bg-teal/20"
          >
            ⬇ Exportar CSV
          </button>
        )}
      </div>

      {/* Período */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => aplicarPreset(p.id)}
            className={`rounded-full px-4 py-2 font-display text-[13px] font-semibold transition ${
              preset === p.id ? "bg-rosa text-white" : "border border-line bg-white/60 text-ink-soft hover:text-ink"
            }`}
          >
            {p.label}
          </button>
        ))}
        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={de} max={ate} onChange={(e) => setDe(e.target.value)} className={inputData} />
            <span className="text-ink-soft">até</span>
            <input type="date" value={ate} min={de} max={hoje} onChange={(e) => setAte(e.target.value)} className={inputData} />
          </div>
        )}
      </div>

      {carregando || !dados ? (
        <p className="py-16 text-center text-ink-soft">Carregando...</p>
      ) : dados.atendimentos === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-cream-2/40 px-6 py-16 text-center">
          <div className="text-4xl">📊</div>
          <p className="mt-3 font-display text-lg font-semibold text-ink">Nada nesse período</p>
          <p className="text-sm text-ink-soft">Ainda não há saídas registradas nas datas escolhidas.</p>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi label="Faturamento" value={formatBRL(dados.total)} accent="text-teal" />
            <Kpi label="Atendimentos" value={dados.atendimentos} />
            <Kpi label="Ticket médio" value={formatBRL(dados.ticket)} />
            <Kpi label="Tempo médio" value={`${Math.floor(dados.tempoMedioMin / 60)}h${String(dados.tempoMedioMin % 60).padStart(2, "0")}`} accent="text-lilas" />
          </div>

          {/* Faturamento por dia */}
          {dias.length > 1 && (
            <div className="mb-8 rounded-3xl border border-line bg-white/50 p-5">
              <h2 className="mb-4 font-display text-lg font-bold text-ink">Faturamento por dia</h2>
              <div className="flex items-end gap-1.5 overflow-x-auto pb-1" style={{ minHeight: 160 }}>
                {dias.map((d) => {
                  const v = dados.porDia[d] ?? 0;
                  return (
                    <div key={d} className="flex min-w-[26px] flex-1 flex-col items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-ink-soft tabular-nums">{v > 0 ? Math.round(v) : ""}</span>
                      <div className="flex w-full items-end" style={{ height: 110 }}>
                        <div className="w-full rounded-t-md bg-rosa/70" style={{ height: `${(v / maxDia) * 100}%` }} />
                      </div>
                      <span className="whitespace-nowrap text-[10px] text-ink-soft">{rotuloDia(d)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Por forma */}
            <div className="rounded-3xl border border-line bg-white/50 p-5">
              <h2 className="mb-4 font-display text-lg font-bold text-ink">Por forma de pagamento</h2>
              <div className="flex flex-col gap-3">
                {(["Dinheiro", "Pix", "Cartão"] as const).map((f) => {
                  const v = dados.porForma[f] ?? 0;
                  const pct = dados.total > 0 ? (v / dados.total) * 100 : 0;
                  const icon = f === "Dinheiro" ? "💵" : f === "Pix" ? "📱" : "💳";
                  return (
                    <div key={f}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-ink-soft">{icon} {f}</span>
                        <span className="font-display font-bold text-ink tabular-nums">{formatBRL(v)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-cream-2">
                        <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Horários de pico */}
            <div className="rounded-3xl border border-line bg-white/50 p-5">
              <h2 className="mb-4 font-display text-lg font-bold text-ink">Horários de pico</h2>
              <div className="flex items-end gap-1" style={{ height: 130 }}>
                {horas.map(({ h, v }) => (
                  <div key={h} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full items-end" style={{ height: 92 }}>
                      <div className="w-full rounded-t bg-lilas/70" style={{ height: `${(v / maxHora) * 100}%` }} title={`${v} entradas`} />
                    </div>
                    <span className="text-[10px] text-ink-soft">{h}h</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[12px] text-ink-soft">Entradas por hora do dia.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
