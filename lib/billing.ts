// Regra de cobrança da brinquedoteca (Só um Bolinho):
//  - Mínimo de 1 hora: qualquer permanência < 60min = valorHora.
//  - Acima disso: horas cheias × valorHora + minutos restantes × valorMinExcedente,
//    com o excedente LIMITADO a valorHora (aí vira mais uma hora cheia).
// Ex. (25/2): 45min→25 · 1h10→45 · 1h30→50 · 2h05→60.
//
// Os preços são configuráveis (Tela de Ajustes). O parâmetro `precos` é
// OBRIGATÓRIO de propósito: o servidor nunca cobra sem consultar a config vigente,
// e o TypeScript aponta qualquer call-site que esqueça de injetar o preço.

export type Precos = { valorHora: number; valorMinExcedente: number };

export const PRECOS_PADRAO: Precos = { valorHora: 25, valorMinExcedente: 2 };

export function minutosEntre(entrada: Date | string | number, saida: Date | string | number): number {
  const a = new Date(entrada).getTime();
  const b = new Date(saida).getTime();
  return Math.max(0, Math.floor((b - a) / 60000));
}

export function calcularValor(minutos: number, p: Precos): number {
  if (minutos < 60) return p.valorHora; // mínimo 1 hora
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  const excedente = Math.min(resto * p.valorMinExcedente, p.valorHora);
  return horas * p.valorHora + excedente;
}

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h === 0 ? `${m}min` : `${h}h${String(m).padStart(2, "0")}`;
}
