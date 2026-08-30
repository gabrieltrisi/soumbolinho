"use client";

import { useEffect, useState } from "react";
import { useCriancas } from "../providers";

export default function AjustesPage() {
  const { recarregarConfig } = useCriancas();
  const [valorHora, setValorHora] = useState("");
  const [valorMin, setValorMin] = useState("");
  const [capacidade, setCapacidade] = useState("");
  const [novoPin, setNovoPin] = useState("");
  const [confirmaPin, setConfirmaPin] = useState("");
  const [senhaMestra, setSenhaMestra] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.valorHora === "number") setValorHora(String(d.valorHora).replace(".", ","));
        if (typeof d?.valorMinExcedente === "number") setValorMin(String(d.valorMinExcedente).replace(".", ","));
        if (typeof d?.capacidade === "number") setCapacidade(String(d.capacidade));
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOk(null);

    const pin = novoPin.trim();
    if (pin) {
      if (!/^\d{4,8}$/.test(pin)) return setErro("O PIN deve ter de 4 a 8 dígitos.");
      if (pin !== confirmaPin.trim()) return setErro("A confirmação do PIN não confere.");
    }
    if (!senhaMestra) return setErro("Informe a senha mestra para salvar.");

    setSalvando(true);
    try {
      const body: Record<string, unknown> = { senhaMestra };
      if (valorHora.trim()) body.valorHora = Number(valorHora.replace(",", "."));
      if (valorMin.trim()) body.valorMinExcedente = Number(valorMin.replace(",", "."));
      if (capacidade.trim()) body.capacidade = Number(capacidade);
      if (pin) body.novoPin = pin;

      const r = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "Não foi possível salvar.");
      }
      setSenhaMestra("");
      setNovoPin("");
      setConfirmaPin("");
      recarregarConfig(); // propaga preço/capacidade novos para as telas abertas
      setOk(pin ? "Ajustes salvos e PIN atualizado! 🎈" : "Ajustes salvos! 🎈");
      setTimeout(() => setOk(null), 6000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSalvando(false);
    }
  }

  const inputCls =
    "w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-[15px] text-ink placeholder:text-ink-soft/70 transition focus:border-rosa focus:bg-white";
  const labelCls = "mb-1.5 block font-display text-[13px] font-semibold text-ink";

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink">Ajustes</h1>
        <p className="mt-1 text-ink-soft">Preços, capacidade e PIN — mudam na hora, sem precisar de suporte.</p>
      </div>

      {carregando ? (
        <p className="py-16 text-center text-ink-soft">Carregando...</p>
      ) : (
        <form onSubmit={salvar} className="flex flex-col gap-5">
          {/* Preços */}
          <section className="rounded-3xl border border-line bg-cream-2/60 p-6">
            <h2 className="font-display text-lg font-bold text-ink">Preços e capacidade</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Valor por hora (R$)</label>
                <input inputMode="decimal" className={inputCls} value={valorHora} onChange={(e) => setValorHora(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="25" />
              </div>
              <div>
                <label className={labelCls}>Minuto excedente (R$)</label>
                <input inputMode="decimal" className={inputCls} value={valorMin} onChange={(e) => setValorMin(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="2" />
              </div>
              <div>
                <label className={labelCls}>Capacidade máxima</label>
                <input inputMode="numeric" className={inputCls} value={capacidade} onChange={(e) => setCapacidade(e.target.value.replace(/[^\d]/g, ""))} placeholder="25" />
              </div>
            </div>
            <p className="mt-3 text-[12px] text-ink-soft">
              Regra: até 59min = 1 hora; acima disso, horas cheias + minutos excedentes (limitado ao valor de uma hora).
              Vale para check-outs a partir do momento em que você salvar.
            </p>
          </section>

          {/* PIN */}
          <section className="rounded-3xl border border-line bg-cream-2/60 p-6">
            <h2 className="font-display text-lg font-bold text-ink">Trocar PIN de acesso rápido</h2>
            <p className="mt-1 text-[13px] text-ink-soft">Deixe em branco para manter o PIN atual.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Novo PIN (4 a 8 dígitos)</label>
                <input inputMode="numeric" className={inputCls} value={novoPin} onChange={(e) => setNovoPin(e.target.value.replace(/[^\d]/g, "").slice(0, 8))} placeholder="••••••" />
              </div>
              <div>
                <label className={labelCls}>Confirmar novo PIN</label>
                <input inputMode="numeric" className={inputCls} value={confirmaPin} onChange={(e) => setConfirmaPin(e.target.value.replace(/[^\d]/g, "").slice(0, 8))} placeholder="••••••" />
              </div>
            </div>
          </section>

          {/* Senha mestra */}
          <section className="rounded-3xl border border-rosa/30 bg-rosa/5 p-6">
            <h2 className="font-display text-lg font-bold text-ink">Confirmar com a senha mestra</h2>
            <p className="mt-1 text-[13px] text-ink-soft">Só quem tem a senha da conta (não o PIN) pode mudar preços ou o PIN.</p>
            <input type="password" autoComplete="off" className={`${inputCls} mt-4`} value={senhaMestra} onChange={(e) => setSenhaMestra(e.target.value)} placeholder="senha mestra" />
          </section>

          {erro && <div className="rounded-2xl bg-rosa/15 px-4 py-3 text-sm font-semibold text-rosa-deep">{erro}</div>}
          {ok && <div className="rounded-2xl bg-teal/20 px-4 py-3 text-sm font-semibold text-[#3d8b93]">{ok}</div>}

          <button type="submit" disabled={salvando} className="rounded-full bg-rosa px-6 py-4 font-display text-[16px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(229,115,138,.9)] transition hover:bg-rosa-deep disabled:opacity-60">
            {salvando ? "Salvando..." : "Salvar ajustes"}
          </button>
        </form>
      )}
    </div>
  );
}
