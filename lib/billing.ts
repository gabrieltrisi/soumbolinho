// Regra de cobrança da brinquedoteca (Só um Bolinho):
//  - Mínimo de 1 hora: qualquer permanência < 60min = R$ 25.
//  - Acima disso: horas cheias × R$25 + minutos restantes × R$2,
//    com o excedente LIMITADO a R$25 (aí vira mais uma hora cheia).
// Ex.: 45min→25 · 1h10→45 · 1h30→50 · 2h05→60.

export const VALOR_HORA = 25;
export const VALOR_MIN_EXCEDENTE = 2;

export function minutosEntre(entrada: Date | string | number, saida: Date | string | number): number {
  const a = new Date(entrada).getTime();
  const b = new Date(saida).getTime();
  return Math.max(0, Math.floor((b - a) / 60000));
}

export function calcularValor(minutos: number): number {
  if (minutos < 60) return VALOR_HORA; // mínimo 1 hora
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  const excedente = Math.min(resto * VALOR_MIN_EXCEDENTE, VALOR_HORA);
  return horas * VALOR_HORA + excedente;
}

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h === 0 ? `${m}min` : `${h}h${String(m).padStart(2, "0")}`;
}
