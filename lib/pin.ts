// Hash do PIN com scrypt + salt (node:crypto, sem dependências externas).
// Formato armazenado: "scrypt$N$r$p$saltHex$hashHex".
import { scrypt, randomBytes, timingSafeEqual, type ScryptOptions } from "node:crypto";

const N = 16384; // custo de CPU/memória (~16MB, sob o maxmem default de 32MB)
const r = 8;
const p = 1;
const LEN = 32;

function scryptAsync(pin: string, salt: Buffer, len: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(pin, salt, len, opts, (err, dk) => (err ? reject(err) : resolve(dk)));
  });
}

export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16);
  const dk = await scryptAsync(pin, salt, LEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${dk.toString("hex")}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const partes = stored.split("$");
  if (partes.length !== 6) return false;
  const [tag, sN, sr, sp, saltHex, hashHex] = partes;
  if (tag !== "scrypt" || !saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  if (esperado.length !== LEN) return false; // hash malformado → falha FECHADA (nunca autentica)
  try {
    const dk = await scryptAsync(pin, Buffer.from(saltHex, "hex"), LEN, {
      N: Number(sN),
      r: Number(sr),
      p: Number(sp),
    });
    return timingSafeEqual(dk, esperado);
  } catch {
    return false;
  }
}
