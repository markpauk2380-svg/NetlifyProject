import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

function normalize(code: string) {
  return String(code || "").toUpperCase().replace(/\s+/g, "");
}

export default async (req: Request) => {
  const store = getStore({ name: "promos", consistency: "strong" });

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const admin = String(body.admin || "");
    if (admin !== "ADMIN6" && admin !== "ADMIN67") {
      return Response.json({ ok: false, error: "Нет доступа" }, { status: 403 });
    }

    const key = normalize(body.code);
    const amount = Number(body.amount);
    if (!/^[A-Z0-9_-]{3,24}$/.test(key)) {
      return Response.json({ ok: false, error: "Код: 3–24 символа, латиница/цифры" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > 9999999) {
      return Response.json({ ok: false, error: "Нужна сумма больше 0" }, { status: 400 });
    }

    await store.setJSON(key, { amount });
    return Response.json({ ok: true, code: key, amount });
  }

  const url = new URL(req.url);
  const key = normalize(url.searchParams.get("code") || "");
  if (!key) return Response.json({ ok: false });
  const row = await store.get(key, { type: "json" });
  if (!row || !row.amount) return Response.json({ ok: false });
  return Response.json({ ok: true, amount: row.amount });
};

export const config: Config = {
  path: "/api/promo"
};
