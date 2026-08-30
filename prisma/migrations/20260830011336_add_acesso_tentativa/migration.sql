-- CreateTable
CREATE TABLE "AcessoTentativa" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcessoTentativa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcessoTentativa_ip_criadoEm_idx" ON "AcessoTentativa"("ip", "criadoEm");
