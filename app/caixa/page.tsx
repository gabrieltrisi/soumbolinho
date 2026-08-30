"use client";

import { useEffect, useMemo, useState } from "react";
import { useCriancas, useNow } from "../providers";
import Kpi from "@/components/Kpi";
import CardMenu, { menuItemCls } from "@/components/CardMenu";
import EditModal from "@/components/EditModal";
import { minutosEntre, calcularValor, formatBRL, formatDuracao } from "@/lib/billing";
import { hora, ehHoje, soDigitos } from "@/lib/format";
import type { Crianca } from "@/lib/types";

function whatsappComprovante(c: Crianca) {
  const min = c.saida ? minutosEntre(c.entrada, c.saida) : 0;
  const texto = [
    "*Só um Bolinho* — Brinquedoteca 🎈",
    "",
    `Criança: ${c.nomeCrianca}`,
    `Entrada: ${hora(c.entrada)}`,
    `Saída: ${c.saida ? hora(c.saida) : "-"}`,
    `Tempo: ${formatDuracao(min)}`,
    `*Valor: ${formatBRL(c.valor ?? 0)}*`,
    "",
    "Obrigado pela visita! 💛",
  ].join("\n");
  const d = soDigitos(c.telefoneResponsavel);
  const num = d.startsWith("55") ? d : "55" + d;
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
}

const FORMA_ICON: Record<string, string> = { Dinheiro: "💵", Pix: "📱", "Cartão": "💳" };

type FechamentoRec = {
  data: string;
  totalSistema: number;
  totalDinheiro: number;
  atendimentos: number;
  fundoInicial: number;
  dinheiroContado: number | null;
  divergencia: number | null;
  observacao: string | null;
  fechadoPor: string | null;
};

export default function CaixaPage() {
  const { lista, setLista, precos } = useCriancas();
  const now = useNow();
  const [editando, setEditando] = useState<Crianca | null>(null);
  const [removendo, setRemovendo] = useState<Crianca | null>(null);
  const [fecharAberto, setFecharAberto] = useState(false);
  const [fechamento, setFechamento] = useState<FechamentoRec | null>(null);
  const [fundo, setFundo] = useState("0");
  const [contado, setContado] = useState("");
  const [obsFech, setObsFech] = useState("");
  const [salvandoFech, setSalvandoFech] = useState(false);

  useEffect(() => {
    fetch("/api/caixa/fechamento")
      .then((r) => r.json())
      .then((d) => {
        if (d?.fechamento) {
          setFechamento(d.fechamento);
          setFundo(String(d.fechamento.fundoInicial ?? 0).replace(".", ","));
          if (d.fechamento.dinheiroContado != null) setContado(String(d.fechamento.dinheiroContado).replace(".", ","));
          setObsFech(d.fechamento.observacao ?? "");
        }
      })
      .catch(() => {});
  }, []);

  async function reabrir(c: Crianca) {
    const r = await fetch(`/api/criancas/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reopen" }),
    });
    const upd: Crianca = await r.json();
    setLista((l) => l.map((x) => (x.id === upd.id ? upd : x)));
  }
  async function confirmarRemover() {
    if (!removendo) return;
    await fetch(`/api/criancas/${removendo.id}`, { method: "DELETE" });
    setLista((l) => l.filter((x) => x.id !== removendo.id));
    setRemovendo(null);
  }

  const checkinsHoje = useMemo(() => lista.filter((c) => ehHoje(c.entrada)).length, [lista]);
  const finalizados = useMemo(
    () =>
      lista
        .filter((c) => c.saida && ehHoje(c.saida))
        .sort((a, b) => new Date(b.saida!).getTime() - new Date(a.saida!).getTime()),
    [lista],
  );
  const totalDia = useMemo(() => finalizados.reduce((s, c) => s + (c.valor ?? 0), 0), [finalizados]);
  const ticketMedio = finalizados.length > 0 ? totalDia / finalizados.length : 0;
  const emAberto = useMemo(
    () => lista.filter((c) => !c.saida).reduce((s, c) => s + calcularValor(minutosEntre(c.entrada, now), precos), 0),
    [lista, now, precos],
  );
  const porForma = useMemo(() => {
    const acc: Record<string, number> = { Dinheiro: 0, Pix: 0, "Cartão": 0 };
    for (const c of finalizados) {
      const f = c.formaPagamento ?? "";
      if (f in acc) acc[f] += c.valor ?? 0;
    }
    return acc;
  }, [finalizados]);

  const fundoNum = Number(fundo.replace(",", ".")) || 0;
  const esperadoDinheiro = fundoNum + porForma.Dinheiro;
  const contadoNum = contado.trim() ? Number(contado.replace(",", ".")) : null;
  const divergenciaPrevia = contadoNum != null && Number.isFinite(contadoNum) ? contadoNum - esperadoDinheiro : null;

  async function salvarFechamento() {
    setSalvandoFech(true);
    try {
      const r = await fetch("/api/caixa/fechamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundoInicial: fundoNum,
          dinheiroContado: contadoNum,
          observacao: obsFech.trim() || null,
        }),
      });
      const d = await r.json();
      setFechamento(d.fechamento);
      setFecharAberto(false);
    } finally {
      setSalvandoFech(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Caixa · Fechamento do dia</h1>
          <p className="mt-1 text-ink-soft">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>
        </div>
        <button
          onClick={() => setFecharAberto(true)}
          className={`flex-none rounded-full px-5 py-2.5 font-display text-[14px] font-semibold transition ${
            fechamento
              ? "border border-teal/50 bg-teal/10 text-[#3d8b93] hover:bg-teal/20"
              : "bg-lilas text-white hover:opacity-90"
          }`}
        >
          {fechamento ? "✓ Dia fechado · revisar" : "🔒 Fechar o dia"}
        </button>
      </div>

      {fechamento && (
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-teal/40 bg-teal/10 px-5 py-3 text-sm">
          <span className="font-display font-semibold text-[#3d8b93]">✓ Caixa fechado</span>
          {fechamento.fechadoPor && <span className="text-ink-soft">por {fechamento.fechadoPor}</span>}
          {fechamento.divergencia != null && (
            <span
              className={`font-display font-semibold ${
                Math.abs(fechamento.divergencia) < 0.01
                  ? "text-[#3d8b93]"
                  : fechamento.divergencia < 0
                    ? "text-rosa-deep"
                    : "text-[#b5702a]"
              }`}
            >
              {Math.abs(fechamento.divergencia) < 0.01
                ? "sem divergência"
                : `divergência ${fechamento.divergencia > 0 ? "+" : ""}${formatBRL(fechamento.divergencia)}`}
            </span>
          )}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Crianças hoje" value={checkinsHoje} />
        <Kpi label="Faturamento" value={formatBRL(totalDia)} accent="text-teal" sub={emAberto > 0 ? `+ ${formatBRL(emAberto)} em aberto` : "nenhum em aberto"} />
        <Kpi label="Ticket médio" value={formatBRL(ticketMedio)} />
        <Kpi label="Finalizados" value={finalizados.length} accent="text-lilas" />
      </div>

      {finalizados.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-2xl border border-line bg-white/50 px-5 py-3 text-sm">
          <span className="font-display font-semibold text-ink-soft">Recebido por forma:</span>
          <span className="text-ink-soft">💵 Dinheiro <b className="font-display text-ink">{formatBRL(porForma.Dinheiro)}</b></span>
          <span className="text-ink-soft">📱 Pix <b className="font-display text-ink">{formatBRL(porForma.Pix)}</b></span>
          <span className="text-ink-soft">💳 Cartão <b className="font-display text-ink">{formatBRL(porForma["Cartão"])}</b></span>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-ink">Finalizados hoje</h2>
        <span className="font-display text-sm font-semibold text-ink-soft">
          Total: <span className="text-teal">{formatBRL(totalDia)}</span>
        </span>
      </div>

      {finalizados.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-cream-2/40 px-6 py-14 text-center">
          <div className="text-4xl">🧾</div>
          <p className="mt-3 font-display text-lg font-semibold text-ink">Nenhuma saída registrada hoje</p>
          <p className="text-sm text-ink-soft">Os check-outs aparecem aqui com o valor cobrado.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {finalizados.map((c) => {
            const min = c.saida ? minutosEntre(c.entrada, c.saida) : 0;
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line/70 bg-cream-2/40 px-4 py-3 text-sm">
                <span className="font-display font-semibold text-ink">{c.nomeCrianca}</span>
                <span className="text-ink-soft">{hora(c.entrada)}–{c.saida ? hora(c.saida) : ""} · {formatDuracao(min)}</span>
                {c.motivoAjuste && (
                  <span
                    className="rounded-full bg-lilas/20 px-2.5 py-0.5 text-[12px] font-semibold text-lilas"
                    title={c.valorTabela != null ? `Tabela ${formatBRL(c.valorTabela)}` : undefined}
                  >
                    🎁 {c.motivoAjuste}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2.5">
                  {c.formaPagamento && (
                    <span className="rounded-full bg-cream-2 px-2.5 py-0.5 text-[12px] font-semibold text-ink-soft">
                      {FORMA_ICON[c.formaPagamento] ?? ""} {c.formaPagamento}
                    </span>
                  )}
                  <a
                    href={whatsappComprovante(c)}
                    target="_blank"
                    rel="noreferrer"
                    title="Enviar comprovante no WhatsApp"
                    className="rounded-full bg-teal/25 px-3 py-1 font-display text-[12px] font-semibold text-[#3d8b93] transition hover:bg-teal/40"
                  >
                    📲 Comprovante
                  </a>
                  <span className="font-display font-bold text-teal tabular-nums">{formatBRL(c.valor ?? 0)}</span>
                  <CardMenu>
                    <button className={menuItemCls} onClick={() => reabrir(c)}>↩️ Reabrir</button>
                    <button className={menuItemCls} onClick={() => setEditando(c)}>✏️ Editar</button>
                    <button className={`${menuItemCls} text-rosa-deep`} onClick={() => setRemovendo(c)}>🗑️ Remover</button>
                  </CardMenu>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editando && (
        <EditModal
          crianca={editando}
          onClose={() => setEditando(null)}
          onSaved={(upd) => {
            setLista((l) => l.map((c) => (c.id === upd.id ? upd : c)));
            setEditando(null);
          }}
        />
      )}

      {removendo && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setRemovendo(null)}>
          <div className="w-full max-w-sm rounded-3xl border border-line bg-cream p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-3xl">🗑️</div>
            <h2 className="mt-2 font-display text-xl font-bold text-ink">Remover {removendo.nomeCrianca}?</h2>
            <p className="mt-1 text-sm text-ink-soft">Essa ação não pode ser desfeita.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setRemovendo(null)} className="flex-1 rounded-full border border-line bg-white/70 px-5 py-2.5 font-display text-[14px] font-semibold text-ink transition hover:bg-white">Cancelar</button>
              <button onClick={confirmarRemover} className="flex-1 rounded-full bg-rosa-deep px-5 py-2.5 font-display text-[14px] font-semibold text-white transition hover:opacity-90">Remover</button>
            </div>
          </div>
        </div>
      )}

      {fecharAberto && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setFecharAberto(false)}>
          <div className="w-full max-w-md rounded-3xl border border-line bg-cream p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="font-display text-sm font-semibold uppercase tracking-wide text-ink-soft">Fechamento do dia</div>
              <div className="mt-1 font-display text-xl font-bold text-ink">{new Date().toLocaleDateString("pt-BR")}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-white/60 px-4 py-2.5">
                <div className="text-ink-soft">Total do dia</div>
                <div className="font-display text-lg font-bold text-teal">{formatBRL(totalDia)}</div>
              </div>
              <div className="rounded-2xl bg-white/60 px-4 py-2.5">
                <div className="text-ink-soft">Atendimentos</div>
                <div className="font-display text-lg font-bold text-ink">{finalizados.length}</div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 rounded-2xl bg-white/40 px-4 py-2 text-[13px] text-ink-soft">
              <span>💵 {formatBRL(porForma.Dinheiro)}</span>
              <span>📱 {formatBRL(porForma.Pix)}</span>
              <span>💳 {formatBRL(porForma["Cartão"])}</span>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <label className="grid grid-cols-2 items-center gap-2">
                <span className="font-display text-[13px] font-semibold text-ink">Fundo de caixa (troco)</span>
                <input inputMode="decimal" value={fundo} onChange={(e) => setFundo(e.target.value.replace(/[^\d.,]/g, ""))} className="rounded-xl border border-line bg-white px-3 py-2 text-right font-display font-semibold text-ink focus:border-rosa" />
              </label>
              <label className="grid grid-cols-2 items-center gap-2">
                <span className="font-display text-[13px] font-semibold text-ink">Dinheiro contado</span>
                <input inputMode="decimal" value={contado} onChange={(e) => setContado(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="conte a gaveta" className="rounded-xl border border-line bg-white px-3 py-2 text-right font-display font-semibold text-ink focus:border-rosa" />
              </label>
            </div>

            <div className="mt-3 rounded-2xl bg-cream-2/60 px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-soft">Esperado em dinheiro</span>
                <span className="font-display font-semibold text-ink tabular-nums">{formatBRL(esperadoDinheiro)}</span>
              </div>
              {divergenciaPrevia != null && (
                <div className="mt-1 flex justify-between">
                  <span className="text-ink-soft">Divergência</span>
                  <span className={`font-display font-bold tabular-nums ${Math.abs(divergenciaPrevia) < 0.01 ? "text-[#3d8b93]" : divergenciaPrevia < 0 ? "text-rosa-deep" : "text-[#b5702a]"}`}>
                    {divergenciaPrevia > 0 ? "+" : ""}
                    {formatBRL(divergenciaPrevia)}
                  </span>
                </div>
              )}
            </div>

            <input value={obsFech} onChange={(e) => setObsFech(e.target.value)} placeholder="Observação (opcional)" className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 focus:border-rosa" />

            <div className="mt-5 flex gap-3">
              <button onClick={() => setFecharAberto(false)} className="flex-1 rounded-full border border-line bg-white/70 px-5 py-3 font-display text-[15px] font-semibold text-ink transition hover:bg-white">Cancelar</button>
              <button onClick={salvarFechamento} disabled={salvandoFech} className="flex-1 rounded-full bg-rosa px-5 py-3 font-display text-[15px] font-semibold text-white transition hover:bg-rosa-deep disabled:opacity-60">
                {salvandoFech ? "..." : fechamento ? "Atualizar fechamento" : "Confirmar fechamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
