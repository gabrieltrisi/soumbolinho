-- CreateTable
CREATE TABLE "Configuracao" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "valorHora" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "valorMinExcedente" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "capacidade" INTEGER NOT NULL DEFAULT 25,
    "pinHash" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "atualizadoPor" TEXT,

    CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("id")
);
