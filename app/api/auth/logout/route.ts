import { NextResponse } from "next/server";
import { cookieOpts, COOKIE } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { ...cookieOpts, maxAge: 0 });
  return res;
}
