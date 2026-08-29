# 🎈 Só um Bolinho — Brinquedoteca

Sistema de **check-in e controle de caixa** da brinquedoteca do *Só um Bolinho — Espaço de eventos e Recreação kids*.

Feito para o **balcão da recepção**: a atendente registra a entrada da criança, o sistema **cronometra o tempo**, **calcula o valor automaticamente** e fecha o **caixa do dia** — sem conta na mão, sem papel.

---

## ✨ O que ele faz

**Entrada e saída**
- 🧒 Check-in rápido: criança, idade, responsável, telefone, endereço e alergias.
- 👨‍👧‍👦 **Irmãos**: várias crianças de um mesmo responsável em um só cadastro, agrupadas por família.
- ⏱️ **Cronômetro ao vivo** e **valor correndo** por criança.
- 🏁 **Check-out** com cálculo automático do valor (individual ou **família inteira** de uma vez).

**Caixa**
- 💰 **Fechamento do dia**: crianças no dia, faturamento, ticket médio, valor em aberto.
- 💵📱💳 **Forma de pagamento** (Dinheiro / Pix / Cartão) com total recebido por forma.
- 📲 **Comprovante no WhatsApp** do responsável (individual ou somado por família).

**Praticidade e segurança**
- 🔁 **Cliente recorrente**: digitou o telefone → preenche o responsável e sugere as crianças que já vieram.
- ✏️ **Editar**, 🗑️ **remover** e ↩️ **reabrir** um check-in (corrigir enganos).
- ⚠️ **Alergias em destaque** na lista.
- 📋 **Termo de responsabilidade** confirmado no cadastro.

### 💲 Regra de cobrança
- Permanência **abaixo de 1 hora** → **R$ 25,00** (mínimo de 1 hora).
- Acima disso → **horas cheias × R$ 25** + **minutos restantes × R$ 2**, com o excedente **limitado a R$ 25** (aí vira mais uma hora cheia).
- Exemplos: `45min → R$25` · `1h07 → R$39` · `1h30 → R$50` · `2h05 → R$60`.

---

## 🧱 Stack

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 16** (App Router) + **React 19** |
| Estilo | **Tailwind CSS v4** (tema da marca via `@theme`) |
| Banco / ORM | **PostgreSQL** (Neon) + **Prisma 6** |
| Fontes | Fredoka + Nunito (Google Fonts) |

O sistema tem **3 telas** com menu no topo: **Cadastro**, **Brinquedoteca** (quem está lá agora) e **Caixa** (fechamento do dia).

---

## 🚀 Rodando localmente

```bash
# 1. Instale as dependências
npm install

# 2. Configure o banco
cp .env.example .env
#   → preencha DATABASE_URL e DIRECT_URL com as credenciais do Neon

# 3. Crie as tabelas
npx prisma migrate deploy   # (ou "migrate dev" em desenvolvimento)

# 4. Suba o servidor
npm run dev
```

Acesse **http://localhost:3000**.

> 💡 O banco é um PostgreSQL hospedado (Neon), então o mesmo sistema roda no PC da recepção ou publicado online — sem mudar nada no código.

---

## 📁 Estrutura

```
app/
  page.tsx              → Cadastro (check-in)
  brinquedoteca/        → Crianças na brinquedoteca (cronômetro + check-out)
  caixa/                → Fechamento do dia (caixa + comprovantes)
  api/criancas/         → Endpoints (listar, criar, check-out, editar, remover)
  providers.tsx         → Estado compartilhado das crianças
components/             → TopNav, cards, modais, KPIs, termo
lib/
  billing.ts            → Regra de cobrança
  format.ts             → Telefone, datas
  prisma.ts             → Cliente Prisma
prisma/schema.prisma    → Modelo de dados
```

---

## 🗺️ Roadmap (próximos passos)

O sistema foi pensado para **crescer**. Ideias já mapeadas:

- [ ] 📱 **PWA** — instalar no tablet como app (tela cheia, ícone na tela inicial).
- [ ] 🔒 **PIN de acesso** — proteger o Caixa/faturamento no tablet do balcão.
- [ ] 📊 **Relatórios** — faturamento por semana/mês, horários de pico, dias mais movimentados.
- [ ] 📤 **Exportar CSV** — do dia/mês, para a contabilidade.
- [ ] 🧾 **Comprovante para impressão** — além do WhatsApp.
- [ ] 🏠 **Capacidade / lotação** — limite de crianças e aviso ao lotar.
- [ ] 🎟️ **Pacotes e promoções** — hora cheia, aniversários, mensalidades.
- [ ] 👥 **Cadastro de clientes** — histórico por família, aniversários.

Sugestões e novas ideias são bem-vindas — a base está pronta para receber.

---

<sub>Feito com 💛 para a brinquedoteca do Só um Bolinho.</sub>
