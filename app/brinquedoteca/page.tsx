"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCriancas, useNow } from "../providers";
import { minutosEntre, calcularValor, formatBRL, formatDuracao } from "@/lib/billing";
import { hora, soDigitos } from "@/lib/format";
import type { Crianca } from "@/lib/types";
import CardMenu, { menuItemCls } from "@/components/CardMenu";
import EditModal from "@/components/EditModal";

const DOT_COLORS = ["bg-rosa", "bg-amarelo", "bg-laranja", "bg-lilas", "bg-teal"];

function comprovanteFamilia(grupo: Crianca[]) {
  const linhas = grupo.map((c) => {
    const min = c.saida ? minutosEntre(c.entrada, c.saida) : 0;
    return `• ${c.nomeCrianca}: ${formatDuracao(min)} — ${formatBRL(c.valor ?? 0)}`;
  });
  const total = grupo.reduce((s, c) => s + (c.valor ?? 0), 0);
  const texto = [
    "*Só um Bolinho* — Brinquedoteca 🎈",
    "",
    `Responsável: ${grupo[0].nomeResponsavel}`,
    ...linhas,
    "",
    `*Total: ${formatBRL(total)}*`,
    "",
    "Obrigado pela visita! 💛",
  ].join("\n");
  const d = soDigitos(grupo[0].telefoneResponsavel);
  const num = d.startsWith("55") ? d : "55" + d;
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
}

const FORMAS = [
  { v: "Dinheiro", icon: "💵" },
  { v: "Pix", icon: "📱" },
  { v: "Cartão", icon: "💳" },
];

const MOTIVOS_RAPIDOS = ["Aniversariante", "Cortesia", "Valor combinado"];

function SeletorForma({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-soft">Forma de pagamento</div>
      <div className="flex gap-2">
        {FORMAS.map((f) => (
          <button
            key={f.v}
            type="button"
            onClick={() => onChange(f.v)}
            className={`flex-1 rounded-2xl border px-2 py-2.5 font-display text-[14px] font-semibold transition ${
              value === f.v ? "border-rosa bg-rosa/15 text-ink" : "border-line bg-white/60 text-ink-soft hover:border-rosa/50"
            }`}
          >
            {f.icon} {f.v}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BrinquedotecaPage() {
  const { lista, setLista, capacidade, precos } = useCriancas();
  const now = useNow();
  const [busca, setBusca] = useState("");
  const [checkout, setCheckout] = useState<Crianca | null>(null);
  const [checkoutFamilia, setCheckoutFamilia] = useState<Crianca[] | null>(null);
  const [finalizando, setFinalizando] = useState(false);
  const [forma, setForma] = useState("Dinheiro");
  const [flash, setFlash] = useState<{ texto: string; recibo?: Crianca[] } | null>(null);
  const [editando, setEditando] = useState<Crianca | null>(null);
  const [removendo, setRemovendo] = useState<Crianca | null>(null);
  // Ajuste de valor no check-out (cortesia, aniversariante, valor combinado).
  const [ajustando, setAjustando] = useState(false);
  const [valorAjuste, setValorAjuste] = useState("");
  const [motivo, setMotivo] = useState("");

  function abrirCheckout(c: Crianca) {
    setForma("Dinheiro");
    setAjustando(false);
    setValorAjuste("");
    setMotivo("");
    setCheckout(c);
  }

  const ativos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lista
      .filter((c) => !c.saida)
      .filter(
        (c) =>
          !q ||
          c.nomeCrianca.toLowerCase().includes(q) ||
          c.nomeResponsavel.toLowerCase().includes(q) ||
          c.telefoneResponsavel.includes(q),
      );
  }, [lista, busca]);

  const grupos = useMemo(() => {
    const map = new Map<string, Crianca[]>();
    for (const c of ativos) {
      const k = soDigitos(c.telefoneResponsavel) || `id${c.id}`;
      const arr = map.get(k) ?? [];
      arr.push(c);
      map.set(k, arr);
    }
    return [...map.values()];
  }, [ativos]);

  const totalAtivos = useMemo(() => lista.filter((c) => !c.saida).length, [lista]);
  const ocupacao = capacidade > 0 ? totalAtivos / capacidade : 0;
  const corLotacao =
    ocupacao >= 1 ? "bg-rosa/20 text-rosa-deep" : ocupacao >= 0.7 ? "bg-laranja/25 text-[#b5702a]" : "bg-teal/25 text-[#3d8b93]";

  async function checkout1(c: Crianca, extra: Record<string, unknown> = {}): Promise<Crianca> {
    const r = await fetch(`/api/criancas/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formaPagamento: forma, ...extra }),
    });
    return r.json();
  }

  async function confirmarSaida() {
    if (!checkout) return;
    const extra: Record<string, unknown> = {};
    if (ajustando) {
      const v = Number(valorAjuste.replace(",", "."));
      if (!Number.isFinite(v) || v < 0 || !motivo.trim()) return;
      extra.valor = v;
      extra.motivoAjuste = motivo.trim();
    }
    setFinalizando(true);
    try {
      const upd = await checkout1(checkout, extra);
      setLista((l) => l.map((c) => (c.id === upd.id ? upd : c)));
      const aviso = upd.motivoAjuste ? ` (${upd.motivoAjuste})` : "";
      setFlash({ texto: `${upd.nomeCrianca} saiu · cobrar ${formatBRL(upd.valor ?? 0)}${aviso} 💰` });
      setTimeout(() => setFlash(null), 6000);
      setCheckout(null);
    } finally {
      setFinalizando(false);
    }
  }

  async function confirmarSaidaFamilia() {
    if (!checkoutFamilia) return;
    setFinalizando(true);
    try {
      const atualizadas: Crianca[] = [];
      for (const c of checkoutFamilia) atualizadas.push(await checkout1(c));
      setLista((l) => l.map((c) => atualizadas.find((u) => u.id === c.id) ?? c));
      const total = atualizadas.reduce((s, c) => s + (c.valor ?? 0), 0);
      setFlash({ texto: `Família ${atualizadas[0].nomeResponsavel} saiu · total ${formatBRL(total)} 💰`, recibo: atualizadas });
      setTimeout(() => setFlash(null), 9000);
      setCheckoutFamilia(null);
    } finally {
      setFinalizando(false);
    }
  }

  async function confirmarRemover() {
    if (!removendo) return;
    await fetch(`/api/criancas/${removendo.id}`, { method: "DELETE" });
    setLista((l) => l.filter((c) => c.id !== removendo.id));
    setRemovendo(null);
  }

  const acoesMenu = (c: Crianca) => (
    <CardMenu>
      <button className={menuItemCls} onClick={() => abrirCheckout(c)}>🏁 Finalizar</button>
      <button className={menuItemCls} onClick={() => setEditando(c)}>✏️ Editar</button>
      <button className={`${menuItemCls} text-rosa-deep`} onClick={() => setRemovendo(c)}>🗑️ Remover</button>
    </CardMenu>
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            Na brinquedoteca <span className="text-rosa">({totalAtivos})</span>
          </h1>
          <span className={`rounded-full px-3 py-1 font-display text-[13px] font-semibold ${corLotacao}`}>
            Lotação {totalAtivos}/{capacidade}{ocupacao >= 1 ? " · lotado" : ""}
          </span>
        </div>
        <input
          className="w-full rounded-full border border-line bg-white/70 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/70 transition focus:border-rosa focus:bg-white sm:w-72"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
        />
      </div>

      {flash && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-teal/20 px-4 py-3">
          <span className="font-display text-sm font-semibold text-ink">{flash.texto}</span>
          {flash.recibo && (
            <a href={comprovanteFamilia(flash.recibo)} target="_blank" rel="noreferrer" className="rounded-full bg-teal/30 px-3 py-1 font-display text-[12px] font-semibold text-[#3d8b93] hover:bg-teal/50">
              📲 Comprovante somado
            </a>
          )}
        </div>
      )}

      {grupos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-cream-2/40 px-6 py-16 text-center">
          <div className="text-4xl">🧸</div>
          <p className="mt-3 font-display text-lg font-semibold text-ink">Ninguém na brinquedoteca</p>
          <Link href="/" className="mt-2 inline-block font-display text-sm font-semibold text-rosa underline underline-offset-2">
            Fazer um check-in →
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {grupos.map((grupo, gi) => {
            // Família (2+ crianças no mesmo telefone)
            if (grupo.length > 1) {
              const totalFamilia = grupo.reduce((s, c) => s + calcularValor(minutosEntre(c.entrada, now), precos), 0);
              return (
                <li key={`fam-${gi}`} className="rounded-3xl border border-line bg-white/70 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                    <div>
                      <span className="font-display font-semibold text-ink">👨‍👧‍👦 {grupo[0].nomeResponsavel}</span>
                      <span className="text-sm text-ink-soft"> · {grupo[0].telefoneResponsavel} · {grupo.length} crianças</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg font-bold text-teal tabular-nums">{formatBRL(totalFamilia)}</span>
                      <button onClick={() => setCheckoutFamilia(grupo)} className="rounded-full bg-lilas px-4 py-2 font-display text-[13px] font-semibold text-white transition hover:opacity-90">
                        Finalizar família
                      </button>
                    </div>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {grupo.map((c, i) => {
                      const min = minutosEntre(c.entrada, now);
                      return (
                        <li key={c.id} className="flex items-center gap-3">
                          <span className={`grid h-10 w-10 flex-none place-items-center rounded-full font-display font-bold text-white ${DOT_COLORS[i % DOT_COLORS.length]}`}>
                            {c.nomeCrianca.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="font-display text-[15px] font-semibold text-ink">{c.nomeCrianca}</span>
                            <span className="text-sm text-ink-soft"> · {c.idade} anos · entrou {hora(c.entrada)}</span>
                            {c.alergias && (
                              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-laranja/20 px-2 py-0.5 text-[12px] font-semibold text-[#b5702a]">⚠ {c.alergias}</span>
                            )}
                          </div>
                          <span className="rounded-full bg-cream-2 px-2.5 py-1 font-display text-[12px] font-semibold text-ink tabular-nums">⏱ {formatDuracao(min)}</span>
                          <span className="font-display text-[15px] font-bold text-teal tabular-nums">{formatBRL(calcularValor(min, precos))}</span>
                          {acoesMenu(c)}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            }

            // Criança única
            const c = grupo[0];
            const min = minutosEntre(c.entrada, now);
            const val = calcularValor(min, precos);
            return (
              <li key={c.id} className="flex items-start gap-4 rounded-3xl border border-line bg-white/70 p-4">
                <span className={`grid h-12 w-12 flex-none place-items-center rounded-full font-display text-lg font-bold text-white ${DOT_COLORS[gi % DOT_COLORS.length]}`}>
                  {c.nomeCrianca.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-display text-[17px] font-semibold text-ink">{c.nomeCrianca}</span>
                    <span className="text-sm text-ink-soft">{c.idade} anos</span>
                  </div>
                  <div className="mt-0.5 text-sm text-ink-soft">{c.nomeResponsavel} · {c.telefoneResponsavel}</div>
                  <div className="mt-1 text-[13px] text-ink-soft">Entrou {hora(c.entrada)}</div>
                  {c.alergias && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-laranja/20 px-3 py-1 text-[13px] font-semibold text-[#b5702a]">⚠ Alergia: {c.alergias}</div>
                  )}
                </div>
                <div className="flex flex-none flex-col items-end gap-1.5">
                  {acoesMenu(c)}
                  <span className="rounded-full bg-cream-2 px-3 py-1 font-display text-[13px] font-semibold text-ink tabular-nums">⏱ {formatDuracao(min)}</span>
                  <span className="font-display text-lg font-bold text-teal tabular-nums">{formatBRL(val)}</span>
                  <button onClick={() => abrirCheckout(c)} className="mt-1 rounded-full bg-lilas px-4 py-2 font-display text-[13px] font-semibold text-white transition hover:opacity-90">
                    Finalizar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal check-out individual */}
      {checkout && (() => {
        const min = minutosEntre(checkout.entrada, now);
        const val = calcularValor(min, precos);
        const vNum = Number(valorAjuste.replace(",", "."));
        const vNumValido = Number.isFinite(vNum) && vNum >= 0;
        const ajusteValido = !ajustando || (vNumValido && !!motivo.trim());
        const cobrar = ajustando && vNumValido ? vNum : val;
        return (
          <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setCheckout(null)}>
            <div className="w-full max-w-sm rounded-3xl border border-line bg-cream p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="font-display text-sm font-semibold uppercase tracking-wide text-ink-soft">Finalizar check-in</div>
                <div className="mt-1 font-display text-2xl font-bold text-ink">{checkout.nomeCrianca}</div>
                <div className="mt-6 flex items-center justify-center gap-8">
                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">Tempo</div>
                    <div className="font-display text-2xl font-bold text-ink tabular-nums">{formatDuracao(min)}</div>
                  </div>
                  <div className="h-10 w-px bg-line" />
                  <div>
                    <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-soft">Cobrar</div>
                    <div className="font-display text-3xl font-bold text-teal tabular-nums">{formatBRL(cobrar)}</div>
                    {ajustando && cobrar !== val && (
                      <div className="text-[12px] text-ink-soft line-through tabular-nums">tabela {formatBRL(val)}</div>
                    )}
                  </div>
                </div>
              </div>

              <SeletorForma value={forma} onChange={setForma} />

              {!ajustando ? (
                <button
                  type="button"
                  onClick={() => { setAjustando(true); setValorAjuste(String(val).replace(".", ",")); }}
                  className="mt-4 w-full rounded-2xl border border-dashed border-lilas/50 py-2.5 font-display text-[13px] font-semibold text-lilas transition hover:bg-lilas/10"
                >
                  🎁 Ajustar valor (cortesia, aniversário...)
                </button>
              ) : (
                <div className="mt-4 rounded-2xl border border-lilas/40 bg-lilas/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[13px] font-semibold text-ink">Valor ajustado</span>
                    <button type="button" onClick={() => { setAjustando(false); setMotivo(""); }} className="text-[12px] font-semibold text-ink-soft underline underline-offset-2">
                      remover ajuste
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-display text-lg font-bold text-ink">R$</span>
                    <input
                      inputMode="decimal"
                      value={valorAjuste}
                      onChange={(e) => setValorAjuste(e.target.value.replace(/[^\d.,]/g, ""))}
                      className="w-28 rounded-xl border border-line bg-white px-3 py-2 font-display text-lg font-bold text-ink focus:border-lilas"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {MOTIVOS_RAPIDOS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMotivo(m)}
                        className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition ${
                          motivo === m ? "border-lilas bg-lilas/20 text-ink" : "border-line bg-white/70 text-ink-soft hover:border-lilas"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <input
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Motivo (obrigatório)"
                    className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 focus:border-lilas"
                  />
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button onClick={() => setCheckout(null)} className="flex-1 rounded-full border border-line bg-white/70 px-5 py-3 font-display text-[15px] font-semibold text-ink transition hover:bg-white">Cancelar</button>
                <button onClick={confirmarSaida} disabled={finalizando || !ajusteValido} className="flex-1 rounded-full bg-rosa px-5 py-3 font-display text-[15px] font-semibold text-white transition hover:bg-rosa-deep disabled:opacity-60">
                  {finalizando ? "..." : "Confirmar saída"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal check-out família */}
      {checkoutFamilia && (() => {
        const itens = checkoutFamilia.map((c) => ({ c, min: minutosEntre(c.entrada, now), val: calcularValor(minutosEntre(c.entrada, now), precos) }));
        const total = itens.reduce((s, x) => s + x.val, 0);
        return (
          <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setCheckoutFamilia(null)}>
            <div className="w-full max-w-md rounded-3xl border border-line bg-cream p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="font-display text-sm font-semibold uppercase tracking-wide text-ink-soft">Finalizar família</div>
                <div className="mt-1 font-display text-xl font-bold text-ink">{checkoutFamilia[0].nomeResponsavel}</div>
              </div>
              <ul className="mt-4 flex flex-col gap-2">
                {itens.map(({ c, min, val }) => (
                  <li key={c.id} className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-2.5 text-sm">
                    <span className="font-display font-semibold text-ink">{c.nomeCrianca}</span>
                    <span className="text-ink-soft">{formatDuracao(min)}</span>
                    <span className="font-display font-bold text-teal tabular-nums">{formatBRL(val)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="font-display text-sm font-semibold text-ink-soft">Total a cobrar</span>
                <span className="font-display text-2xl font-bold text-teal tabular-nums">{formatBRL(total)}</span>
              </div>
              <SeletorForma value={forma} onChange={setForma} />
              <div className="mt-5 flex gap-3">
                <button onClick={() => setCheckoutFamilia(null)} className="flex-1 rounded-full border border-line bg-white/70 px-5 py-3 font-display text-[15px] font-semibold text-ink transition hover:bg-white">Cancelar</button>
                <button onClick={confirmarSaidaFamilia} disabled={finalizando} className="flex-1 rounded-full bg-rosa px-5 py-3 font-display text-[15px] font-semibold text-white transition hover:bg-rosa-deep disabled:opacity-60">
                  {finalizando ? "..." : "Confirmar saída"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
