"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Crianca } from "@/lib/types";

type Ctx = {
  lista: Crianca[];
  setLista: React.Dispatch<React.SetStateAction<Crianca[]>>;
  reload: () => Promise<void>;
  carregando: boolean;
  capacidade: number;
};

const CriancasContext = createContext<Ctx | null>(null);

export function CriancasProvider({ children }: { children: React.ReactNode }) {
  const [lista, setLista] = useState<Crianca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [capacidade, setCapacidade] = useState(25);

  const reload = useCallback(async () => {
    const r = await fetch("/api/criancas", { cache: "no-store" });
    if (r.ok) setLista(await r.json());
    setCarregando(false);
  }, []);

  useEffect(() => {
    reload();
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        if (d?.capacidade) setCapacidade(d.capacidade);
      })
      .catch(() => {});
  }, [reload]);

  return (
    <CriancasContext.Provider value={{ lista, setLista, reload, carregando, capacidade }}>
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
