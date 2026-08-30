"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Crianca } from "@/lib/types";
import { PRECOS_PADRAO, type Precos } from "@/lib/billing";

type Ctx = {
  lista: Crianca[];
  setLista: React.Dispatch<React.SetStateAction<Crianca[]>>;
  reload: () => Promise<void>;
  carregando: boolean;
  capacidade: number;
  precos: Precos;
  recarregarConfig: () => void;
};

const CriancasContext = createContext<Ctx | null>(null);

export function CriancasProvider({ children }: { children: React.ReactNode }) {
  const [lista, setLista] = useState<Crianca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [capacidade, setCapacidade] = useState(25);
  const [precos, setPrecos] = useState<Precos>(PRECOS_PADRAO);

  const reload = useCallback(async () => {
    const r = await fetch("/api/criancas", { cache: "no-store" });
    if (r.ok) setLista(await r.json());
    setCarregando(false);
  }, []);

  const carregarConfig = useCallback(() => {
    fetch("/api/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.capacidade) setCapacidade(d.capacidade);
        if (typeof d?.valorHora === "number" && typeof d?.valorMinExcedente === "number") {
          setPrecos({ valorHora: d.valorHora, valorMinExcedente: d.valorMinExcedente });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    reload();
    carregarConfig();
    const onVis = () => {
      if (document.visibilityState === "visible") carregarConfig();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [reload, carregarConfig]);

  return (
    <CriancasContext.Provider value={{ lista, setLista, reload, carregando, capacidade, precos, recarregarConfig: carregarConfig }}>
      {children}
    </CriancasContext.Provider>
  );
}

export function useCriancas() {
  const ctx = useContext(CriancasContext);
  if (!ctx) throw new Error("useCriancas precisa estar dentro do CriancasProvider");
  return ctx;
}

/** Relógio que atualiza a cada segundo — para cronômetros e valores ao vivo. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
