// Vérifie une clé de licence auprès du prestataire de paiement (Polar ou Lemon Squeezy).
// Variables d'environnement à définir dans Netlify (Site configuration → Environment variables) :
//   PAY_PROVIDER     = "polar" ou "lemonsqueezy"
//   Polar :          POLAR_ORG_ID (obligatoire), POLAR_BENEFIT_ID (recommandé)
//   Lemon Squeezy :  LS_STORE_ID, LS_PRODUCT_ID (obligatoires)

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function checkPolar(key) {
  const org = process.env.POLAR_ORG_ID;
  if (!org) return { ok: false, error: "Boutique non configurée.", status: 503 };
  const res = await fetch("https://api.polar.sh/v1/customer-portal/license-keys/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, organization_id: org })
  });
  if (res.status === 404 || res.status === 422) return { ok: false, error: "Clé non reconnue." };
  if (!res.ok) return { ok: false, error: "Vérification impossible pour le moment. Réessaie plus tard.", status: 502 };
  const d = await res.json();
  if (d.status !== "granted") return { ok: false, error: "Cette clé n'est plus valide." };
  const benefit = process.env.POLAR_BENEFIT_ID;
  if (benefit && d.benefit_id !== benefit) return { ok: false, error: "Cette clé ne correspond pas à cette app." };
  return { ok: true };
}

async function checkLemon(key) {
  const store = process.env.LS_STORE_ID, product = process.env.LS_PRODUCT_ID;
  if (!store || !product) return { ok: false, error: "Boutique non configurée.", status: 503 };
  const res = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ license_key: key })
  });
  const d = await res.json().catch(() => ({}));
  if (!d.valid) return { ok: false, error: "Clé non reconnue." };
  if (String(d.meta?.store_id) !== String(store) || String(d.meta?.product_id) !== String(product)) {
    return { ok: false, error: "Cette clé ne correspond pas à cette app." };
  }
  return { ok: true };
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { ok: false, error: "Méthode non autorisée." });
  let key = "";
  try { key = String((await req.json()).key || "").trim(); } catch (e) {}
  if (key.length < 8 || key.length > 100) return json(400, { ok: false, error: "Clé invalide." });

  const provider = (process.env.PAY_PROVIDER || "").toLowerCase();
  try {
    const r = provider === "polar" ? await checkPolar(key)
      : provider === "lemonsqueezy" ? await checkLemon(key)
      : { ok: false, error: "Boutique non configurée.", status: 503 };
    return json(r.ok ? 200 : (r.status || 400), { ok: r.ok, error: r.error });
  } catch (e) {
    return json(502, { ok: false, error: "Vérification impossible pour le moment. Réessaie plus tard." });
  }
};
