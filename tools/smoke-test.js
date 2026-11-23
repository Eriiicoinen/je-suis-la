// Smoke test : exécute app.js avec un DOM factice et rend chaque écran dans plusieurs états.
const fs = require("fs"), path = require("path"), vm = require("vm");
const APP = process.argv[2] || path.join(__dirname, "..");

function el() {
  const fn = function () { return el(); };
  return new Proxy(fn, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => "";
      if (k === "querySelectorAll") return () => [];
      if (k === "children") return [];
      if (k === "dataset") return t._ds || (t._ds = {});
      if (k === "style") return t._st || (t._st = {});
      if (k === "isConnected") return true;
      if (k in t && k !== "length" && k !== "name") return t[k];
      if (k === "textContent" || k === "innerHTML" || k === "value") return t["_" + k] || "";
      if (k === "then") return undefined;
      return el();
    },
    set(t, k, v) { t[k === "textContent" || k === "innerHTML" || k === "value" ? "_" + k : k] = v; return true; },
    apply() { return el(); }
  });
}

const store = {};
const errors = [];
const view = el();
const ctx = {
  console, Date, Math, JSON, Promise, URL: { createObjectURL: () => "", revokeObjectURL() {} },
  setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  structuredClone: (o) => JSON.parse(JSON.stringify(o)),
  localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
  matchMedia: () => ({ matches: false }),
  navigator: { userAgent: "node", vibrate() {}, storage: {}, serviceWorker: undefined },
  location: { hash: "#/", protocol: "file:", reload() {} },
  scrollTo() {}, scrollY: 0,
  addEventListener() {},
  Image: function () { return el(); }, Blob: function () {}, File: function () {},
};
ctx.window = ctx;
ctx.document = {
  querySelector: (s) => (s === "#view" ? view : el()),
  querySelectorAll: () => [],
  addEventListener() {}, createElement: () => el(), body: el(), visibilityState: "visible",
};
vm.createContext(ctx);
for (const f of ["config.js", "content.js"]) vm.runInContext(fs.readFileSync(path.join(APP, f), "utf8"), ctx, { filename: f });

const routes = ["#/", "#/phase/latence", "#/phase/actif", "#/phase/transition", "#/phase/poussee", "#/phase/actif/pos/hanches",
  "#/timer", "#/breathe", "#/words", "#/mat", "#/pro", "#/coach", "#/show", "#/prefs", "#/bag", "#/msg",
  "#/train", "#/train/session", "#/train/quiz", "#/birth", "#/after", "#/ready", "#/imprevus", "#/imprevus/cesarienne",
  "#/card", "#/todo", "#/log", "#/depart", "#/questions", "#/photos", "#/calme", "#/calme/apres"];

const now = Date.now(), M = 60000;
const scenarios = {
  vide: {},
  "travail régulier 5 min/2h": { contractions: Array.from({ length: 26 }, (_, i) => ({ s: now - (25 - i) * 5 * M, e: now - (25 - i) * 5 * M + 60000 })), settings: { phone: "01 23 45 67 89", mName: "Mat", address: "1 rue X", access: "Entrée nuit", dueDate: "2026-11-20" } },
  "contraction oubliée": { contractions: [{ s: now - 20 * M, e: now - 19 * M }, { s: now - 10 * M, e: now - 9 * M }, { s: now - 5 * M, e: null }] },
  "longue confirmée + eaux teintées": { contractions: [{ s: now - 4 * M, e: null, long: 1 }], events: [{ t: now - M, type: "eaux", detail: "teinte" }] },
  "bébé né": { contractions: [{ s: now - 5 * 24 * 60 * M, e: now - 5 * 24 * 60 * M + 1000 }, { s: now - 9 * 60 * M, e: now - 9 * 60 * M + 50000 }], events: [{ t: now - 2 * 60 * M, type: "arrivee" }, { t: now - 30 * M, type: "naissance" }], baby: { prenom: "Léa", sexe: "f", poids: "3,2 kg" }, todo: { secu: true }, posLog: [{ id: "slow-dance", s: now - 3 * 60 * M, e: now - 2 * 60 * M }, { id: "hanches", s: now - 2 * 60 * M, e: null }], words: ["Pense à la plage"], lists: { photos: { 1: true } }, log: [{ t: now - 26 * 60 * M, type: "tg" }, { t: now - 3 * 60 * M, type: "td" }, { t: now - 2 * 60 * M, type: "pipi" }, { t: now - 20 * M, type: "bib" }], settings: { dueDate: "2026-11-01" } },
  "paywall": { __paywall: true },
  "accompagnante (sa compagne)": { settings: { partner: "f", phone: "01 23 45 67 89" }, contractions: [{ s: now - 9 * M, e: now - 8 * M }], events: [{ t: now - 30 * M, type: "naissance" }] },
};

let runs = 0;
for (const [name, state] of Object.entries(scenarios)) {
  for (const k of Object.keys(store)) delete store[k];
  const st = { accepted: true, ...state }; delete st.__paywall;
  store["jsl-state-v1"] = JSON.stringify(st);
  ctx.APP_CONFIG.paywall = !!state.__paywall;
  for (const r of routes) {
    ctx.location.hash = r;
    try { vm.runInContext(fs.readFileSync(path.join(APP, "app.js"), "utf8"), ctx, { filename: "app.js" }); runs++; }
    catch (e) { errors.push(`[${name}] ${r}: ${e.stack.split("\n").slice(0, 3).join(" | ")}`); }
    const html = view.innerHTML;
    if (/Petit souci d'affichage/.test(html)) errors.push(`[${name}] ${r}: écran de secours affiché (un rendu a planté)`);
    if (/\{[^{}|<>]*\|[^{}|<>]*\}/.test(html)) errors.push(`[${name}] ${r}: marque d'accord non résolue → ${html.match(/.{0,40}\{[^{}|<>]*\|[^{}|<>]*\}/)[0]}`);
    if (/undefined|NaN|\[object/.test(html)) errors.push(`[${name}] ${r}: suspicious output → ${(html.match(/.{0,60}(undefined|NaN|\[object).{0,40}/) || [""])[0].replace(/\s+/g, " ")}`);
  }
}
// Contrôles ciblés de la logique
for (const k of Object.keys(store)) delete store[k];
store["jsl-state-v1"] = JSON.stringify({ accepted: true, ...scenarios["travail régulier 5 min/2h"] });
ctx.location.hash = "#/timer";
vm.runInContext(fs.readFileSync(path.join(APP, "app.js"), "utf8"), ctx);
const t = view.innerHTML;
const checks = [
  ["repère atteint affiché", /atteint le repère/.test(t)],
  ["bouton suppression ligne", /data-delc/.test(t)],
  ["tendance affichée", /Rythme stable|rapprochent|espacent/.test(t)],
];
store["jsl-state-v1"] = JSON.stringify({ accepted: true, ...scenarios["contraction oubliée"] });
vm.runInContext(fs.readFileSync(path.join(APP, "app.js"), "utf8"), ctx);
checks.push(["alerte FIN oubliée", /oublié d'appuyer sur FIN/.test(view.innerHTML)]);
store["jsl-state-v1"] = JSON.stringify({ accepted: true, ...scenarios["bébé né"] });
ctx.location.hash = "#/todo";
vm.runInContext(fs.readFileSync(path.join(APP, "app.js"), "utf8"), ctx);
checks.push(["échéance déclaration affichée", /Au plus tard/.test(view.innerHTML)]);
ctx.location.hash = "#/birth";
vm.runInContext(fs.readFileSync(path.join(APP, "app.js"), "utf8"), ctx);
checks.push(["accord « née »", /est née le/.test(view.innerHTML)]);
checks.push(["positions essayées dans le récit", /Positions essayées : Compression des hanches \(1 h 30\), Slow dance/.test(view.innerHTML)]);
checks.push(["récit limité à l'épisode (1 contraction, pas 2)", /1 contraction notée/.test(view.innerHTML)]);
ctx.location.hash = "#/";
{ const f = new Date(now + 30 * 24 * 60 * M); store["jsl-state-v1"] = JSON.stringify({ accepted: true, settings: { dueDate: `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}` } }); }
vm.runInContext(fs.readFileSync(path.join(APP, "app.js"), "utf8"), ctx);
checks.push(["carte « prêts ? » avec J-", /readycard/.test(view.innerHTML) && /J-\d+/.test(view.innerHTML)]);
checks.push(["accueil en mode Avant", /data-v="prep" aria-pressed="true"/.test(view.innerHTML)]);
store["jsl-state-v1"] = JSON.stringify({ accepted: true, contractions: [{ s: now - 5 * M, e: now - 4 * M }] });
vm.runInContext(fs.readFileSync(path.join(APP, "app.js"), "utf8"), ctx);
checks.push(["accueil bascule en Jour J", /data-v="jourj" aria-pressed="true"/.test(view.innerHTML) && /Mode coach/.test(view.innerHTML)]);
store["jsl-state-v1"] = JSON.stringify({ accepted: true, ...scenarios["bébé né"] });
vm.runInContext(fs.readFileSync(path.join(APP, "app.js"), "utf8"), ctx);
checks.push(["accueil bascule en Après", /data-v="apres" aria-pressed="true"/.test(view.innerHTML)]);

const fem = (hash) => { store["jsl-state-v1"] = JSON.stringify({ accepted: true, settings: { partner: "f" }, events: [{ t: now - 30 * M, type: "naissance" }] }); ctx.location.hash = hash; vm.runInContext(fs.readFileSync(path.join(APP, "app.js"), "utf8"), ctx); return view.innerHTML; };
checks.push(["compagne : accord « prête »", /es-tu prête \?/.test(fem("#/train"))]);
checks.push(["compagne : dessins img/f/", /src="img\/f\/hanches/.test(fem("#/phase/actif/pos/hanches"))]);
checks.push(["compagne : reconnaissance conjointe anticipée", /reconnaissance conjointe anticipée/.test(fem("#/todo")) && !/paternité et d/.test(view.innerHTML)]);
checks.push(["compagne : « fière de toi »", /fière de toi/.test(fem("#/words"))]);
store["jsl-state-v1"] = JSON.stringify({ accepted: true }); ctx.location.hash = "#/train";
vm.runInContext(fs.readFileSync(path.join(APP, "app.js"), "utf8"), ctx);
checks.push(["compagnon : retour au masculin", /es-tu prêt \?/.test(view.innerHTML) && !/img\/f\//.test(view.innerHTML)]);

console.log(`${runs} rendus OK`);
checks.forEach(([n, ok]) => console.log(`${ok ? "✓" : "✗"} ${n}`));
if (errors.length) { console.log("\nERREURS :"); errors.forEach((e) => console.log(" - " + e)); process.exit(1); }
if (checks.some((c) => !c[1])) process.exit(1);
