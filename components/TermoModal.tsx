"use client";

export const TERMO_TEXTO = `TERMO DE RESPONSABILIDADE — Brinquedoteca Só um Bolinho

Ao registrar a entrada, o(a) responsável declara que:

1. É o responsável legal pela(s) criança(s) e autoriza a permanência na brinquedoteca.

2. Informou corretamente eventuais alergias e condições de saúde relevantes.

3. Compromete-se a retornar dentro do horário de funcionamento e a retirar a criança pessoalmente ou por pessoa autorizada.

4. Está ciente de que a brinquedoteca é um espaço recreativo e que brincadeiras envolvem riscos naturais; a equipe zela pela segurança, mas o responsável mantém o dever de cuidado.

5. Autoriza a equipe a prestar os primeiros socorros e a acionar atendimento em caso de emergência.

6. Está ciente dos valores: R$ 25,00/hora e R$ 2,00/minuto excedente.`;

export default function TermoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-cream p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-bold text-ink">Termo de responsabilidade</h2>
        <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink-soft">{TERMO_TEXTO}</p>
        <button onClick={onClose} className="mt-6 w-full rounded-full bg-rosa px-5 py-3 font-display text-[15px] font-semibold text-white transition hover:bg-rosa-deep">
          Fechar
        </button>
      </div>
    </div>
  );
}
