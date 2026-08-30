-- CreateTable
CREATE TABLE "FechamentoCaixa" (
    "id" SERIAL NOT NULL,
    "data" TEXT NOT NULL,
    "totalSistema" DOUBLE PRECISION NOT NULL,
    "totalDinheiro" DOUBLE PRECISION NOT NULL,
    "totalPix" DOUBLE PRECISION NOT NULL,
    "totalCartao" DOUBLE PRECISION NOT NULL,
    "atendimentos" INTEGER NOT NULL,
    "fundoInicial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dinheiroContado" DOUBLE PRECISION,
    "divergencia" DOUBLE PRECISION,
    "observacao" TEXT,
    "fechadoPor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FechamentoCaixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backup" (
    "id" SERIAL NOT NULL,
    "data" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "destino" TEXT NOT NULL DEFAULT 'db',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FechamentoCaixa_data_key" ON "FechamentoCaixa"("data");

-- CreateIndex
CREATE UNIQUE INDEX "Backup_data_key" ON "Backup"("data");
