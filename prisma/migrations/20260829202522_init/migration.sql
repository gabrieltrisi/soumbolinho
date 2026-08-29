-- CreateTable
CREATE TABLE "Crianca" (
    "id" SERIAL NOT NULL,
    "nomeCrianca" TEXT NOT NULL,
    "idade" INTEGER NOT NULL,
    "endereco" TEXT NOT NULL,
    "telefoneResponsavel" TEXT NOT NULL,
    "nomeResponsavel" TEXT NOT NULL,
    "alergias" TEXT,
    "termoAceito" BOOLEAN NOT NULL DEFAULT false,
    "entrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saida" TIMESTAMP(3),
    "valor" DOUBLE PRECISION,
    "formaPagamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Crianca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Crianca_entrada_idx" ON "Crianca"("entrada");
