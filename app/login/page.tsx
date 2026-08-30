"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const PIN_LEN = 6;

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<"pin" | "senha">("pin");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = useCallback(
    async (body: object) => {
      setErro(null);
      setEnviando(true);
      try {
        const r = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error ?? "Não foi possível entrar.");
        }
        router.replace("/");
        router.refresh();
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro inesperado.");
        setPin("");
        setEnviando(false);
      }
    },
    [router],
  );

  // Auto-envia quando o PIN completa.
  useEffect(() => {
    if (modo === "pin" && pin.length === PIN_LEN && !enviando) entrar({ pin });
  }, [pin, modo, enviando, entrar]);

  function digito(d: string) {
    if (enviando) return;
    setErro(null);
    setPin((p) => (p.length < PIN_LEN ? p + d : p));
  }
  function apagar() {
    setErro(null);
    setPin((p) => p.slice(0, -1));
  }

  const inputCls =
    "w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-[15px] text-ink placeholder:text-ink-soft/70 transition focus:border-rosa focus:bg-white";
  const labelCls = "mb-1.5 block font-display text-[13px] font-semibold text-ink";
  const teclaCls =
    "rounded-2xl border border-line bg-white/80 py-4 font-display text-2xl font-semibold text-ink transition active:scale-95 hover:border-rosa disabled:opacity-50";

  return (
    <div className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Image src="/logo.png" alt="Só um bolinho" width={1200} height={389} priority className="h-16 w-auto" />
        </div>

        <div className="rounded-3xl border border-line bg-cream-2/60 p-7 shadow-[0_12px_44px_-24px_rgba(90,69,81,.6)]">
          {modo === "pin" ? (
            <>
              <h1 className="font-display text-2xl font-bold text-ink">Acesso rápido</h1>
              <p className="mt-1 text-sm text-ink-soft">Digite seu PIN de {PIN_LEN} dígitos.</p>

              <div className="my-6 flex justify-center gap-3">
                {Array.from({ length: PIN_LEN }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-3.5 w-3.5 rounded-full transition ${
                      i < pin.length ? "bg-rosa" : "border border-line bg-white/60"
                    }`}
                  />
                ))}
              </div>

              {erro && <div className="mb-4 rounded-2xl bg-rosa/15 px-4 py-2.5 text-center text-sm font-semibold text-rosa-deep">{erro}</div>}

              <div className="grid grid-cols-3 gap-2.5">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <button key={d} type="button" onClick={() => digito(d)} disabled={enviando} className={teclaCls}>
                    {d}
                  </button>
                ))}
                <span />
                <button type="button" onClick={() => digito("0")} disabled={enviando} className={teclaCls}>
                  0
                </button>
                <button type="button" onClick={apagar} disabled={enviando || pin.length === 0} className={`${teclaCls} text-xl`} aria-label="Apagar">
                  ⌫
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setModo("senha"); setErro(null); setPin(""); }}
                className="mt-6 w-full text-center text-[13px] font-semibold text-lilas underline underline-offset-2 hover:text-ink"
              >
                Entrar com usuário e senha
              </button>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-ink">Entrar</h1>
              <p className="mt-1 text-sm text-ink-soft">Acesse com seu usuário e senha.</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  entrar({ usuario, senha });
                }}
                className="mt-5 flex flex-col gap-4"
              >
                <div>
                  <label className={labelCls}>Usuário</label>
                  <input className={inputCls} value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="usuário" autoCapitalize="none" autoComplete="username" required />
                </div>
                <div>
                  <label className={labelCls}>Senha</label>
                  <input className={inputCls} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="sua senha" autoComplete="current-password" required />
                </div>

                {erro && <div className="rounded-2xl bg-rosa/15 px-4 py-2.5 text-sm font-semibold text-rosa-deep">{erro}</div>}

                <button type="submit" disabled={enviando} className="mt-1 rounded-full bg-rosa px-6 py-3.5 font-display text-[16px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(229,115,138,.9)] transition hover:bg-rosa-deep disabled:opacity-60">
                  {enviando ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => { setModo("pin"); setErro(null); }}
                className="mt-5 w-full text-center text-[13px] font-semibold text-lilas underline underline-offset-2 hover:text-ink"
              >
                Usar PIN de acesso rápido
              </button>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-[12px] text-ink-soft">Só um Bolinho · Brinquedoteca</p>
      </div>
    </div>
  );
}
