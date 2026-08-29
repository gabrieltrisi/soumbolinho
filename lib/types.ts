export type Crianca = {
  id: number;
  nomeCrianca: string;
  idade: number;
  endereco: string;
  telefoneResponsavel: string;
  nomeResponsavel: string;
  alergias: string | null;
  termoAceito: boolean;
  entrada: string;
  saida: string | null;
  valor: number | null;
  formaPagamento: string | null;
};
