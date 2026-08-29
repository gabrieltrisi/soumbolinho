"use client";

import { useMemo, useState } from "react";
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

export default function CaixaPage() {
  const { lista, setLista } = useCriancas();
  const now = useNow();
  const [editando, setEditando] = useState<Crianca | null>(null);
  const [removendo, setRemovendo] = useState<Crianca | null>(null);

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
    () => lista.filter((c) => !c.saida).reduce((s, c) => s + calcularValor(minutosEntre(c.entrada, now)), 0),
    [lista, now],
  );
  const porForma = useMemo(() => {
    const acc: Record<string, number> = { Dinheiro: 0, Pix: 0, "Cartão": 0 };
    for (const c of finalizados) {
      const f = c.formaPagamento ?? "";
      if (f in acc) acc[f] += c.valor ?? 0;
    }
    return acc;
  }, [finalizados]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Caixa · Fechamento do dia</h1>
        <p className="mt-1 text-ink-soft">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </p>
      </div>

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
    </div>
  );
}
