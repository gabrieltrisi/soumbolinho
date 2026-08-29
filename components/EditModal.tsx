"use client";

import { useState } from "react";
import type { Crianca } from "@/lib/types";
import { mascaraTelefone } from "@/lib/format";

export default function EditModal({
  crianca,
  onClose,
  onSaved,
}: {
  crianca: Crianca;
  onClose: () => void;
  onSaved: (c: Crianca) => void;
}) {
  const [form, setForm] = useState({
    nomeCrianca: crianca.nomeCrianca,
    idade: String(crianca.idade),
    telefoneResponsavel: crianca.telefoneResponsavel,
    nomeResponsavel: crianca.nomeResponsavel,
    endereco: crianca.endereco,
    alergias: crianca.alergias ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: k === "telefoneResponsavel" ? mascaraTelefone(e.target.value) : e.target.value }));

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSaving(true);
    try {
      const r = await fetch(`/api/criancas/${crianca.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "Erro ao salvar.");
      }
      onSaved(await r.json());
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-2xl border border-line bg-white/80 px-4 py-2.5 text-[15px] text-ink placeholder:text-ink-soft/70 transition focus:border-rosa focus:bg-white";
  const labelCls = "mb-1 block font-display text-[12px] font-semibold text-ink";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-line bg-cream p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-bold text-ink">Editar cadastro</h2>
        <form onSubmit={salvar} className="mt-4 flex flex-col gap-3">
          <div>
            <label className={labelCls}>Nome da criança *</label>
            <input className={inputCls} value={form.nomeCrianca} onChange={set("nomeCrianca")} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Idade *</label>
              <input className={inputCls} type="number" min={0} max={17} value={form.idade} onChange={set("idade")} required />
            </div>
            <div>
              <label className={labelCls}>Telefone *</label>
              <input className={inputCls} type="tel" value={form.telefoneResponsavel} onChange={set("telefoneResponsavel")} required />
            </div>
          </div>
          <div>
            <label className={labelCls}>Nome do responsável *</label>
            <input className={inputCls} value={form.nomeResponsavel} onChange={set("nomeResponsavel")} required />
          </div>
          <div>
            <label className={labelCls}>Endereço</label>
            <input className={inputCls} value={form.endereco} onChange={set("endereco")} />
          </div>
          <div>
            <label className={labelCls}>Alergias</label>
            <textarea className={`${inputCls} min-h-[60px] resize-y`} value={form.alergias} onChange={set("alergias")} />
          </div>
          {erro && <div className="rounded-2xl bg-rosa/15 px-4 py-2.5 text-sm font-semibold text-rosa-deep">{erro}</div>}
          <div className="mt-1 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-line bg-white/70 px-5 py-2.5 font-display text-[14px] font-semibold text-ink transition hover:bg-white">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-full bg-rosa px-5 py-2.5 font-display text-[14px] font-semibold text-white transition hover:bg-rosa-deep disabled:opacity-60">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
