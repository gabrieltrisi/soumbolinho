"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCriancas } from "./providers";
import { soDigitos, mascaraTelefone } from "@/lib/format";
import TermoModal from "@/components/TermoModal";
import type { Crianca } from "@/lib/types";

type ChildRow = { nomeCrianca: string; idade: string; alergias: string };

const emptyResp = { nomeResponsavel: "", telefoneResponsavel: "", endereco: "" };
const emptyChild = (): ChildRow => ({ nomeCrianca: "", idade: "", alergias: "" });

export default function CadastroPage() {
  const { lista, setLista } = useCriancas();
  const [resp, setResp] = useState({ ...emptyResp });
  const [criancas, setCriancas] = useState<ChildRow[]>([emptyChild()]);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [termoAceito, setTermoAceito] = useState(false);
  const [verTermo, setVerTermo] = useState(false);

  const telDigits = soDigitos(resp.telefoneResponsavel);
  const historico = useMemo(() => {
    if (telDigits.length < 8) return [] as Crianca[];
    return lista.filter((c) => {
      const d = soDigitos(c.telefoneResponsavel);
      return d.length >= 8 && (d.includes(telDigits) || telDigits.includes(d));
    });
  }, [lista, telDigits]);
  const responsavelSugerido = historico[0];
  const criancasDoTelefone = useMemo(() => {
    const seen = new Set<string>();
    const out: Crianca[] = [];
    for (const c of historico) {
      const k = c.nomeCrianca.trim().toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(c);
      }
    }
    return out;
  }, [historico]);

  const setR = (k: keyof typeof resp) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setResp((r) => ({ ...r, [k]: k === "telefoneResponsavel" ? mascaraTelefone(e.target.value) : e.target.value }));
  const setChild = (i: number, k: keyof ChildRow) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setCriancas((cs) => cs.map((c, j) => (j === i ? { ...c, [k]: e.target.value } : c)));
  const addChild = () => setCriancas((cs) => [...cs, emptyChild()]);
  const removeChild = (i: number) => setCriancas((cs) => (cs.length > 1 ? cs.filter((_, j) => j !== i) : cs));

  const preencherResponsavel = (c: Crianca) =>
    setResp((r) => ({ ...r, nomeResponsavel: c.nomeResponsavel, endereco: c.endereco || r.endereco }));
  const adicionarCriancaConhecida = (c: Crianca) =>
    setCriancas((cs) => {
      const novo = { nomeCrianca: c.nomeCrianca, idade: String(c.idade), alergias: c.alergias ?? "" };
      const vazio = cs.findIndex((x) => !x.nomeCrianca.trim());
      return vazio >= 0 ? cs.map((x, j) => (j === vazio ? novo : x)) : [...cs, novo];
    });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSaving(true);
    try {
      const r = await fetch("/api/criancas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responsavel: resp, criancas, termoAceito }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "Não foi possível registrar.");
      }
      const criadas: Crianca[] = await r.json();
      setLista((l) => [...criadas, ...l]);
      setResp({ ...emptyResp });
      setCriancas([emptyChild()]);
      setTermoAceito(false);
      setFlash(
        criadas.length === 1
          ? `${criadas[0].nomeCrianca} entrou na brinquedoteca! 🎈`
          : `${criadas.length} crianças entraram na brinquedoteca! 🎈`,
      );
      setTimeout(() => setFlash(null), 6000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-[15px] text-ink placeholder:text-ink-soft/70 transition focus:border-rosa focus:bg-white";
  const labelCls = "mb-1.5 block font-display text-[13px] font-semibold text-ink";

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-bold text-ink">Novo check-in</h1>
        <p className="mt-1 text-ink-soft">Registre a entrada — uma ou várias crianças do mesmo responsável.</p>
      </div>

      {flash && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-teal/20 px-5 py-4">
          <span className="font-display text-sm font-semibold text-ink">{flash}</span>
          <Link href="/brinquedoteca" className="font-display text-sm font-semibold text-teal underline underline-offset-2 hover:text-ink">
            Ver na brinquedoteca →
          </Link>
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-5">
        {/* Responsável */}
        <section className="rounded-3xl border border-line bg-cream-2/60 p-6 shadow-[0_10px_40px_-24px_rgba(90,69,81,.5)]">
          <h2 className="font-display text-lg font-bold text-ink">Responsável</h2>
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Nome do responsável *</label>
                <input className={inputCls} value={resp.nomeResponsavel} onChange={setR("nomeResponsavel")} placeholder="Ex.: Mariana Souza" required />
              </div>
              <div>
                <label className={labelCls}>Telefone *</label>
                <input className={inputCls} type="tel" value={resp.telefoneResponsavel} onChange={setR("telefoneResponsavel")} placeholder="(71) 9 ..." required />
              </div>
            </div>
            <div>
              <label className={labelCls}>Endereço</label>
              <input className={inputCls} value={resp.endereco} onChange={setR("endereco")} placeholder="Rua, nº, bairro" />
            </div>

            {responsavelSugerido && (
              <div className="rounded-2xl border border-lilas/40 bg-lilas/12 px-4 py-3">
                <div className="font-display text-[13px] font-semibold text-ink">📌 Cliente recorrente</div>
                <button type="button" onClick={() => preencherResponsavel(responsavelSugerido)} className="mt-0.5 text-[13px] font-semibold text-lilas underline underline-offset-2 hover:text-ink">
                  Preencher com dados de {responsavelSugerido.nomeResponsavel}
                </button>
                {criancasDoTelefone.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] text-ink-soft">Adicionar:</span>
                    {criancasDoTelefone.map((c) => (
                      <button key={c.id} type="button" onClick={() => adicionarCriancaConhecida(c)} className="rounded-full border border-line bg-white/70 px-3 py-0.5 text-[12px] font-semibold text-ink transition hover:border-lilas">
                        + {c.nomeCrianca}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Crianças */}
        <section className="rounded-3xl border border-line bg-cream-2/60 p-6 shadow-[0_10px_40px_-24px_rgba(90,69,81,.5)]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Crianças <span className="text-rosa">({criancas.length})</span></h2>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {criancas.map((c, i) => (
              <div key={i} className="rounded-2xl border border-line bg-white/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-[13px] font-semibold text-ink-soft">Criança {i + 1}</span>
                  {criancas.length > 1 && (
                    <button type="button" onClick={() => removeChild(i)} className="rounded-full px-2 py-0.5 text-[12px] font-semibold text-rosa-deep transition hover:bg-rosa/10">
                      remover ✕
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
                  <div>
                    <label className={labelCls}>Nome da criança *</label>
                    <input className={inputCls} value={c.nomeCrianca} onChange={setChild(i, "nomeCrianca")} placeholder="Ex.: Helena Souza" required />
                  </div>
                  <div>
                    <label className={labelCls}>Idade *</label>
                    <input className={inputCls} type="number" min={0} max={17} value={c.idade} onChange={setChild(i, "idade")} placeholder="Ex.: 6" required />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>Alergias</label>
                  <input className={inputCls} value={c.alergias} onChange={setChild(i, "alergias")} placeholder="Nenhuma / ex.: amendoim, lactose" />
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addChild} className="mt-4 w-full rounded-2xl border-2 border-dashed border-lilas/50 py-3 font-display text-[14px] font-semibold text-lilas transition hover:bg-lilas/10">
            + Adicionar outra criança
          </button>
        </section>

        <label className="flex items-start gap-3 rounded-2xl border border-line bg-cream-2/60 px-4 py-3 text-sm">
          <input type="checkbox" checked={termoAceito} onChange={(e) => setTermoAceito(e.target.checked)} required className="mt-0.5 h-5 w-5 flex-none accent-rosa" />
          <span className="text-ink-soft">
            Responsável ciente e de acordo com o{" "}
            <button type="button" onClick={() => setVerTermo(true)} className="font-semibold text-lilas underline underline-offset-2">
              termo de responsabilidade
            </button>
            .
          </span>
        </label>

        {erro && <div className="rounded-2xl bg-rosa/15 px-4 py-3 text-sm font-semibold text-rosa-deep">{erro}</div>}

        <button type="submit" disabled={saving} className="rounded-full bg-rosa px-6 py-4 font-display text-[16px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(229,115,138,.9)] transition hover:bg-rosa-deep disabled:opacity-60">
          {saving ? "Registrando..." : criancas.length > 1 ? `Registrar ${criancas.length} crianças 🎈` : "Registrar entrada 🎈"}
        </button>
      </form>

      {verTermo && <TermoModal onClose={() => setVerTermo(false)} />}
    </div>
  );
}
