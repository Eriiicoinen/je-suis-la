/* Je suis là : MVP. Tout est stocké localement sur le téléphone. */
(() => {
  "use strict";

  const C = window.CONTENT;
  const CFG = window.APP_CONFIG || { paywall: false };
  let MOTION = true;
  try { MOTION = !matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  const KEY = "jsl-state-v1";
  const MIN = 60 * 1000;
  const HOUR = 60 * MIN;

  // ---------- État persistant ----------
  const DEFAULTS = {
    accepted: false,
    epidural: false,
    likes: {},            // { positionId: 1 | -1 }
    contractions: [],     // [{ s: ms, e: ms|null }]
    current: null,        // { id, since }
    license: null,        // { key, at } après achat
    dayJUntil: 0,         // mode jour J : tout débloqué jusqu'à cette date (ms)
    checks: {},
    events: [],           // [{ t: ms, type, detail? }] journal + soins (boire, wc, moi)
    prefs: {},            // ses souhaits
    bag: {},              // sac de maternité coché
    baby: {},             // prénom, sexe, poids, taille, heure, signature (messages, faire-part)
    ready: {},            // « Êtes-vous prêts ? » : cases cochées à la main
    todo: {},             // démarches après la naissance
    lists: {},            // listes à cocher : { depart: {0: true…}, questions: {…}, photos: {…} }
    log: [],              // carnet des premiers jours : [{ t, type }]
    words: [],            // ses mots à elle : phrases ajoutées par le couple
    posLog: [],           // positions essayées : [{ id, s, e }] (pour le récit de naissance)
    onboarded: false,
    lastPhase: "actif",
    training: { sessions: 0, lastAt: 0, quizBest: null },
    settings: {
      voice: false,
      sound: false,
      mName: "",
      phone: "",
      address: "",
      access: "",
      dueDate: "",
      first: true,
      intervalMin: 5,
      windowH: 2,
      inhale: 4,
      exhale: 6,
      large: false,
      red: false,
      partner: "m"       // qui accompagne : "m" son compagnon, "f" sa compagne (accords + dessins)
    }
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULTS);
      const s = JSON.parse(raw);
      return { ...structuredClone(DEFAULTS), ...s, settings: { ...DEFAULTS.settings, ...(s.settings || {}) } };
    } catch (e) {
      return structuredClone(DEFAULTS);
    }
  }
  const S = load();

  // ---------- Qui accompagne ? ----------
  // Les textes de content.js portent des marques {masculin|féminin} (« prêt{|e} », « fi{er|ère} »).
  // On les résout selon le réglage, à partir d'une copie intacte du contenu.
  const FEM = () => S.settings.partner === "f";
  const G = (m, f) => (FEM() ? f : m);
  const IMG = () => (FEM() ? "img/f/" : "img/");   // dessins : la partenaire a les cheveux longs
  const RAW = window.CONTENT_RAW || (window.CONTENT_RAW = structuredClone(C));
  function applyGender(src = RAW, dst = C) {
    for (const k in src) {
      const v = src[k];
      if (typeof v === "string") dst[k] = v.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, m, f) => (FEM() ? f : m));
      else if (v && typeof v === "object") applyGender(v, dst[k]);
    }
  }
  applyGender();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible : l'app marche quand même */ }
  }

  // ---------- Utilitaires ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  function dur(ms) {
    ms = Math.max(0, ms);
    const t = Math.floor(ms / 1000);
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return h ? `${h}h${pad(m)}` : `${m}:${pad(s)}`;
  }
  const clock = (ms) => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
  // « 5 min », « 4 min 30 », « 45 s »
  function human(ms) {
    const t = Math.round(ms / 1000);
    if (t < 60) return `${t} s`;
    const m = Math.floor(t / 60), s = Math.round((t % 60) / 10) * 10;
    return s && s < 60 ? `${m} min ${s}` : `${m} min`;
  }
  // « 3 s », « 12 min », « 2 h 05 »
  const ago = (ms) => ms < HOUR ? human(ms) : `${Math.floor(ms / HOUR)} h ${pad(Math.floor((ms % HOUR) / MIN))}`;
  const lastEvent = (type) => {
    for (let i = S.events.length - 1; i >= 0; i--) if (S.events[i].type === type) return S.events[i];
    return null;
  };
  function logEvent(type, detail) {
    S.events.push({ t: Date.now(), type, ...(detail ? { detail } : {}) });
    if (type === "peridurale") S.epidural = true;
    save();
  }
  const telOf = () => (S.settings.phone || "").replace(/[^\d+]/g, "");
  const born = () => S.baby.sexe === "f" ? "née" : S.baby.sexe === "m" ? "né" : "né·e";
  const DAY = 24 * HOUR;
  const midnight = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const longDate = (d, o = {}) => new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", ...o });
  // Terme prévu (saisi par l'utilisateur) : { days, label, rel, short }
  function dueInfo() {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(S.settings.dueDate || "");
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    const days = Math.round((d - midnight(Date.now())) / DAY);
    const rel = days > 1 ? `dans ${days} jours` : days === 1 ? "demain" : days === 0 ? "aujourd'hui" : days === -1 ? "dépassé d'un jour" : `dépassé de ${-days} jours`;
    return { days, label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }), rel, short: days > 0 ? `J-${days}` : days === 0 ? "Jour J" : `J+${-days}` };
  }
  function routeUrl() {
    const a = (S.settings.address || "").trim();
    if (!a) return "";
    const q = encodeURIComponent(a);
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ? `https://maps.apple.com/?daddr=${q}&dirflg=d` : `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`;
  }
  // Le travail a-t-il commencé ? (pour ne plus afficher la préparation en premier)
  function inLabour() {
    const now = Date.now(), l = S.contractions[S.contractions.length - 1];
    if (lastEvent("naissance")) return false;
    if (l && now - (l.e || l.s) < 3 * HOUR) return true;
    return ["eaux", "depart", "arrivee", "peridurale"].some((t) => { const e = lastEvent(t); return e && now - e.t < DAY; });
  }
  function toast(text, label, fn) {
    const old = $(".toast"); if (old) old.remove();
    const t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status");
    t.innerHTML = `<span>${esc(text)}</span>${label ? `<button class="btn">${esc(label)}</button>` : ""}`;
    if (label) t.querySelector("button").onclick = () => { t.remove(); fn && fn(); };
    document.body.appendChild(t);
    if (!label) setTimeout(() => t.remove(), 3500);
  }
  // Partage un fichier (feuille de partage du téléphone), sinon le télécharge
  async function shareFile(blob, name, text) {
    try {
      const file = new File([blob], name, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], ...(text ? { text } : {}) }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }

  // Voix (synthèse vocale du téléphone, fonctionne hors-ligne sur la plupart des appareils)
  function speak(text) {
    if (!S.settings.voice || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-FR"; u.rate = 0.85; u.pitch = 0.95;
      const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.startsWith("fr"));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  // Sons doux (optionnels) : une note qui monte à l'inspiration, qui descend à l'expiration.
  // Utile sur iPhone, où la vibration n'existe pas, et quand le téléphone est posé.
  let actx = null, curGain = null;
  function tone(from, to, secs) {
    if (!S.settings.sound) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = actx || new AC();
      if (actx.state === "suspended") actx.resume();
      const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(from, t);
      o.frequency.linearRampToValueAtTime(to, t + secs);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.08, t + Math.min(0.8, secs / 3));
      g.gain.linearRampToValueAtTime(0.0001, t + secs);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + secs + 0.1);
      curGain = g;
    } catch (e) {}
  }
  function hush() {
    try { if (curGain && actx) { curGain.gain.cancelScheduledValues(actx.currentTime); curGain.gain.setTargetAtTime(0.0001, actx.currentTime, 0.05); } } catch (e) {}
    curGain = null;
  }

  // Moteur de respiration partagé (écran Respirer + mode coach)
  function breathing(circle, lbl, idleText = "Prêts ?") {
    let on = false, t = null;
    function cycle() {
      if (!on) return;
      const { inhale, exhale } = S.settings;
      lbl.textContent = "Inspire…"; speak("Inspire"); tone(196, 294, inhale);
      circle.style.transitionDuration = inhale + "s";
      circle.style.transform = "scale(var(--grow, 2.2))";
      vibrate(30);
      t = setTimeout(() => {
        if (!on) return;
        lbl.textContent = "Expire… longuement"; speak("Expire… longuement"); tone(294, 165, exhale);
        circle.style.transitionDuration = exhale + "s";
        circle.style.transform = "scale(1)";
        vibrate([20, 60, 20]);
        t = setTimeout(cycle, exhale * 1000);
      }, inhale * 1000);
    }
    return {
      get on() { return on; },
      start() { if (on) return; on = true; cycle(); },
      stop() {
        on = false; clearTimeout(t);
        circle.style.transitionDuration = "1s"; circle.style.transform = "scale(1)";
        lbl.textContent = idleText;
        hush();
        try { speechSynthesis.cancel(); } catch (e) {}
      }
    };
  }

  // Début / fin de contraction (minuteur et mode coach)
  function toggleContraction() {
    const now = Date.now();
    const l = S.contractions[S.contractions.length - 1];
    if (l && now - (l.e || l.s) < 1500) return false; // anti double-tap
    if (l && l.e === null) { l.e = now; delete l.long; } else S.contractions.push({ s: now, e: null });
    checkDayJ();
    vibrate(60); save(); updateTabbar();
    return true;
  }

  // Alerte liée au journal (perte des eaux teintée, saignement…)
  function eventAlert() {
    const recent = (type) => { const e = lastEvent(type); return e && Date.now() - e.t < 24 * HOUR ? e : null; };
    const call = telOf() ? `<a class="btn primary block" style="margin-top:10px" href="tel:${esc(telOf())}">📞 Appeler ${esc(S.settings.mName || "la maternité")}</a>` : `<a href="#/mat">Enregistrer le numéro de la maternité</a>`;
    const water = recent("eaux"), blood = recent("saignement");
    const arrived = recent("arrivee");
    if (blood || (water && water.detail === "teinte")) {
      return `<div class="banner alert"><strong>⚠️ ${blood ? "Saignement noté" : "Liquide teinté noté"} : appelle la maternité sans attendre.</strong>${arrived ? "<br>Préviens l'équipe présente." : "<br>" + call}</div>`;
    }
    if (water && !arrived) {
      return `<div class="banner warn"><strong>💧 Perte des eaux notée</strong> : préviens la maternité, elle te dira quand venir.<br>${call}</div>`;
    }
    return "";
  }

  // Résumé à lire au téléphone à la maternité
  function summaryLines() {
    const now = Date.now(), st = stats(), lines = [];
    lines.push(S.settings.first ? "C'est notre premier bébé." : "Ce n'est pas notre premier bébé.");
    const due = dueInfo();
    if (due) lines.push(`Terme prévu le ${due.label} (${due.rel}).`);
    const first = episode()[0];
    if (first) lines.push(`Contractions notées depuis ${clock(first.s)} (il y a ${ago(now - first.s)}).`);
    if (st.count >= 2 && st.avgInt) lines.push(`Dernière heure : ${st.count} contractions, environ toutes les ${human(st.avgInt)}, durée moyenne ${human(st.avgDur)}.`);
    else if (st.count === 1) lines.push("Une seule contraction notée dans la dernière heure.");
    S.events.filter((e) => C.events[e.type] && !C.events[e.type].noSummary).forEach((e) => {
      const col = e.type === "eaux" && e.detail ? ` (liquide ${(C.waterColors.find((w) => w.id === e.detail) || {}).label.toLowerCase()})` : "";
      lines.push(`${C.events[e.type].label} à ${clock(e.t)}${col}.`);
    });
    return lines;
  }
  function summaryCard() {
    if (!S.contractions.length && !S.events.some((e) => C.events[e.type])) return "";
    return `<div class="box summary">
      <h3 style="margin-top:0">📋 À dire au téléphone</h3>
      <ul>${summaryLines().map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
      <button class="btn" id="copySum" style="min-height:44px">Copier</button>
    </div>`;
  }
  function bindSummary() {
    const b = $("#copySum"); if (!b) return;
    b.onclick = async () => {
      try { await navigator.clipboard.writeText(summaryLines().join("\n")); b.textContent = "Copié ✓"; } catch (e) { b.textContent = "Copie impossible"; }
    };
  }

  // Phrases du coach : ses mots à elle d'abord, puis les phrases de l'app
  const sayList = () => [...(S.words || []), ...C.say];
  const sayAt = (i) => { const l = sayList(); return l[i % l.length]; };
  const phaseById = (id) => C.phases.find((p) => p.id === id);
  const posById = (id) => C.positions.find((p) => p.id === id);

  function positionsFor(phaseId) {
    return C.positions
      .filter((p) => p.phases.includes(phaseId) && (!S.epidural || p.epi))
      .sort((a, b) => (isLocked(a) - isLocked(b)) || ((S.likes[b.id] || 0) - (S.likes[a.id] || 0)));
  }

  // ---------- Monétisation ----------
  const dayJActive = () => Date.now() < (S.dayJUntil || 0);
  const isPro = () => !CFG.paywall || !!S.license || dayJActive();
  const isLocked = (p) => !isPro() && !(CFG.freePositions || []).includes(p.id);

  // Le travail a commencé : on débloque tout, sans jamais demander de payer.
  function checkDayJ() {
    const d = CFG.dayJ;
    if (!CFG.paywall || S.license || !d) return;
    const now = Date.now();
    const recent = S.contractions.filter((c) => c.s >= now - d.windowH * HOUR).length;
    if (recent >= d.minContractions) S.dayJUntil = Math.max(S.dayJUntil || 0, now + d.unlockH * HOUR);
  }

  function lockCard(text) {
    return `<a class="banner lock" href="#/pro" style="display:block;text-decoration:none;color:inherit">
      <strong>🔒 ${esc(text)}</strong><br>
      <span class="muted small">Version complète : ${esc(CFG.price || "")}, achat unique, sans abonnement ni pub.</span></a>`;
  }

  function dayJBanner() {
    if (!CFG.paywall || S.license || !dayJActive()) return "";
    return `<div class="banner" style="border-left-color:var(--good)"><strong>🤍 Jour J : tout est débloqué.</strong><br>
      <span class="muted small">Concentrez-vous sur l'essentiel. Si l'app vous a aidés, vous pourrez la soutenir plus tard.</span></div>`;
  }

  // ---------- Écran allumé ----------
  let wakeLock = null;
  let wantAwake = false;
  let awakeBusy = false;
  // Réconcilie l'état voulu et l'état réel : sans ça, passer d'un écran « allumé »
  // à un autre (minuteur → coach) relâchait le verrou et l'écran s'éteignait.
  async function keepAwake(on) {
    wantAwake = on;
    if (awakeBusy || !("wakeLock" in navigator)) return;
    awakeBusy = true;
    try {
      for (let guard = 0; guard < 5; guard++) {
        if (wantAwake && !wakeLock && document.visibilityState === "visible") {
          const l = await navigator.wakeLock.request("screen");
          l.addEventListener("release", () => { if (wakeLock === l) wakeLock = null; });
          wakeLock = l;
        } else if (!wantAwake && wakeLock) {
          const l = wakeLock; wakeLock = null;
          await l.release();
        } else break;
      }
    } catch (e) { /* refusé ou non supporté */ }
    awakeBusy = false;
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && wantAwake) keepAwake(true);
  });

  // ---------- Vues ----------
  const view = $("#view");
  let cleanup = null;
  // Redessine un écran en arrêtant d'abord ce que le précédent avait lancé
  // (respiration, voix, minuteries) : à utiliser pour tout re-rendu hors routeur.
  function go(fn, ...args) {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    try { fn(...args); } catch (e) { safeScreen(e); }
    tick();
  }
  // Filet de sécurité : jamais d'écran blanc le jour J. Si un écran plante, l'essentiel reste accessible.
  function safeScreen(err) {
    try { console.error(err); } catch (e) {}
    cleanup = null;
    const tel = telOf();
    view.innerHTML = `
      <h1>Petit souci d'affichage</h1>
      <p class="muted">Cet écran n'a pas pu s'ouvrir. Tes données sont intactes, et l'essentiel est ici :</p>
      ${tel ? `<a class="btn primary block" href="tel:${esc(tel)}" style="margin-top:12px">📞 Appeler ${esc(S.settings.mName || "la maternité")}</a>` : ""}
      <a class="btn block danger" href="tel:15" style="margin-top:10px">🚑 Urgence : 15</a>
      <div class="grid2" style="margin-top:10px"><a class="btn" href="#/timer">⏱️ Minuteur</a><a class="btn" href="#/">🏠 Accueil</a></div>
      <button class="btn block" id="reload" style="margin-top:10px">↻ Recharger l'app</button>`;
    const r = $("#reload"); if (r) r.onclick = () => location.reload();
  }

  function backBtn(href) {
    return `<a class="back" href="${href}" aria-label="Retour">‹</a>`;
  }

  function currentBanner() {
    if (!S.current) return "";
    const p = posById(S.current.id);
    if (!p) return "";
    return `
      <div class="banner" data-nudge="${S.current.since}">
        <div><strong>${p.emoji} En cours : ${esc(p.title)}</strong></div>
        <div class="muted small">depuis <span data-since="${S.current.since}"></span>
          <span class="nudge" hidden> · Pensez à changer de position</span></div>
      </div>`;
  }

  function timerBanner() {
    const last = S.contractions[S.contractions.length - 1];
    if (last && last.e === null) {
      return `<a class="banner alert" href="#/timer" style="display:block;text-decoration:none;color:inherit">
        <strong>⏱️ Contraction en cours</strong> · <span data-since="${last.s}"></span></a>`;
    }
    return "";
  }

  // Trois moments, trois accueils : avant, jour J, après. L'app choisit seule, tu peux changer.
  let homeMode = null, homeAuto = null;
  const autoMode = () => lastEvent("naissance") ? "apres" : inLabour() ? "jourj" : "prep";
  function renderHome() {
    const auto = autoMode();
    if (auto !== homeAuto) { homeAuto = auto; homeMode = null; } // la situation a changé : on suit
    const mode = homeMode || auto;
    const born_ = lastEvent("naissance");
    const act = (href, emoji, label) => `<a class="act" href="${href}"><span class="ic">${emoji}</span><span>${label}</span></a>`;
    const tiles = `<div class="tiles">
        ${C.phases.map((p) => `
          <a class="tile" href="#/phase/${p.id}">
            <span class="em">${p.emoji}</span>
            <strong>${esc(p.title)}</strong>
            <span class="muted">${esc(p.sub)}</span>
          </a>`).join("")}
      </div>`;
    const prep = `
      ${readyCard()}
      <a class="btn primary block" href="#/train" style="margin-top:10px;min-height:64px">🏋️ S'entraîner à deux${S.training.sessions ? ` · ${S.training.sessions} séance${S.training.sessions > 1 ? "s" : ""}` : ""}</a>
      <div class="grid2" style="margin-top:10px">
        ${act("#/prefs", "📝", "Ses souhaits")}
        ${act("#/bag", "🎒", "Sac de maternité")}
        ${act("#/questions", "❓", "Questions à poser")}
        ${act("#/imprevus", "🧭", "Les imprévus")}
        ${act("#/words", "💬", "Ses mots à elle")}
        ${act("#/msg", "📱", "Messages prêts")}
      </div>
      <a class="btn block" href="#/calme" style="margin-top:10px">🧘 Et toi ? Garder ton calme le jour J</a>
      <h2>Découvrir les positions</h2>
      ${tiles}
      <div class="box" style="margin-top:16px"><strong>Ça commence ?</strong><br><span class="muted small">Note la première contraction : l'accueil passe tout seul en mode Jour J.</span>
        <a class="btn block" href="#/timer" style="margin-top:10px">⏱️ Noter une contraction</a></div>`;
    const jourj = `
      ${dayJBanner()}
      ${currentBanner()}
      <a class="btn primary block" href="#/coach" style="margin-top:14px;min-height:64px">🎯 Mode coach : je te guide contraction par contraction</a>
      <p class="muted" style="margin-top:14px">Où en est-on ? Choisis la phase, je te montre quoi faire.</p>
      ${tiles}
      <button class="toggle" id="epi" aria-pressed="${S.epidural}">
        <span><strong>💉 Péridurale posée</strong><br><span class="muted small">N'affiche que les positions compatibles</span></span>
        <span class="switch"></span>
      </button>
      <div class="grid2" style="margin-top:14px">
        ${act("#/words", "💬", "Quoi lui dire")}
        ${act("#/breathe", "🫁", "Respirer")}
        ${act("#/depart", "🚗", "On part")}
        ${act("#/msg", "📱", "Prévenir les proches")}
      </div>
      <a class="btn block" href="#/calme" style="margin-top:10px">🧘 Et toi ? SOS calme en 60 s</a>
      <a class="btn block" href="#/imprevus" style="margin-top:10px">🧭 Si ça ne se passe pas comme prévu</a>`;
    const apres = `
      ${born_
        ? `<a class="banner" href="#/birth" style="display:block;text-decoration:none;color:inherit;border-left-color:var(--good)"><strong>🎉 ${esc(S.baby.prenom || "Bébé")} est ${born()} !</strong> Voir votre récit de naissance ›</a>`
        : `<a class="btn block birthbtn" href="#/birth" style="margin-top:12px">🎉 Bébé est né !</a>`}
      <div class="grid2" style="margin-top:12px">
        ${act("#/after", "👶", "Premières heures")}
        ${act("#/log", "📒", "Carnet tétées")}
        ${act("#/photos", "📸", "Photos à faire")}
        ${act("#/card", "💌", "Faire-part")}
        ${act("#/msg", "📱", "Annoncer")}
        ${act("#/todo", "🗂️", "Démarches")}
      </div>
      <a class="btn block" href="#/calme/apres" style="margin-top:10px">🌱 Et toi ? Prendre soin de toi aussi</a>`;
    view.innerHTML = `
      <div class="homehead">
        <img src="${IMG()}accueil${MOTION ? "" : "-still"}.svg" alt="">
        <div><h1>Je suis là</h1><p class="muted small">Là, maintenant : quoi faire pour l'aider.</p></div>
        <button class="iconbtn" id="redq" aria-pressed="${!!S.settings.red}" aria-label="Mode nuit rouge" title="Mode nuit rouge">${S.settings.red ? "☀️" : "🌙"}</button>
      </div>
      <div class="seg modes" id="mode">
        ${[["prep", "Avant"], ["jourj", "Jour J"], ["apres", "Après"]].map(([v, l]) => `<button data-v="${v}" aria-pressed="${mode === v}">${l}</button>`).join("")}
      </div>
      ${timerBanner()}
      ${eventAlert()}
      ${mode === "prep" ? prep : mode === "jourj" ? jourj : apres}
      <p class="muted small" style="margin-top:20px">Si ça ne lui fait pas du bien, on change. C'est elle qui décide. Les consignes de l'équipe passent avant tout.</p>
    `;
    const epi = $("#epi");
    if (epi) epi.onclick = () => { S.epidural = !S.epidural; save(); go(renderHome); };
    $("#mode").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; homeMode = b.dataset.v; go(renderHome); };
    $("#redq").onclick = () => { S.settings.red = !S.settings.red; save(); applyPrefs(); go(renderHome); };
  }

  function renderPhase(phaseId) {
    const ph = phaseById(phaseId);
    if (!ph) return renderHome();
    if (S.lastPhase !== phaseId) { S.lastPhase = phaseId; save(); }
    const list = positionsFor(phaseId);
    view.innerHTML = `
      <div class="topbar">${backBtn("#/")}<h1>${ph.emoji} ${esc(ph.title)}</h1></div>
      ${S.epidural ? `<div class="chips"><span class="chip epi">💉 Péridurale : positions compatibles</span></div>` : ""}
      <div class="tips"><ul>${ph.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
      <h2>Positions & gestes</h2>
      <div class="poslist">
        ${list.map((p) => {
          const l = S.likes[p.id] || 0;
          if (isLocked(p)) {
            return `<a class="poscard locked" href="#/pro">
              <img class="thumb" src="${IMG()}${p.id}-still.svg" alt="">
              <span class="t">${esc(p.title)}</span>
              <span class="tag">🔒</span>
            </a>`;
          }
          return `<a class="poscard ${l > 0 ? "liked" : l < 0 ? "disliked" : ""}" href="#/phase/${phaseId}/pos/${p.id}">
            <img class="thumb" src="${IMG()}${p.id}-still.svg" alt="">
            <span class="t">${esc(p.title)}</span>
            <span class="tag">${l > 0 ? "❤️" : l < 0 ? "👎" : "›"}</span>
          </a>`;
        }).join("") || `<p class="muted">Aucune position pour ce filtre.</p>`}
      </div>
      ${list.some(isLocked) ? lockCard(`${list.filter(isLocked).length} autres positions dans la version complète`) : ""}
      ${phaseId === "poussee" ? `<p class="muted small" style="margin-top:14px">Pendant la poussée, c'est la sage-femme qui guide. Ces positions sont des idées à proposer, pas à imposer.</p>` : ""}
    `;
  }

  function renderPos(phaseId, posId) {
    const p = posById(posId);
    if (!p) return renderPhase(phaseId);
    if (isLocked(p)) return renderPro();
    const list = positionsFor(phaseId).filter((x) => !isLocked(x));
    const i = list.findIndex((x) => x.id === posId);
    const prev = i > 0 ? list[i - 1] : null;
    const next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
    const like = S.likes[p.id] || 0;
    const isCurrent = S.current && S.current.id === p.id;

    view.innerHTML = `
      <div class="topbar">${backBtn(`#/phase/${phaseId}`)}<span class="muted">${i + 1} / ${list.length}</span></div>
      <img class="picto" src="${IMG()}${p.id}${MOTION ? "" : "-still"}.svg" alt="${esc(p.title)}">
      <h1 style="text-align:center">${esc(p.title)}</h1>
      <div class="chips" style="justify-content:center">
        ${p.epi ? `<span class="chip epi">💉 Possible sous péridurale</span>` : ""}
        ${p.equipment.map((e) => `<span class="chip">${esc(e)}</span>`).join("")}
      </div>
      <ol class="steps">${p.steps.map((s) => `<li><span>${esc(s)}</span></li>`).join("")}</ol>
      <div class="box you"><h3 style="margin-top:0">👉 Ce que TU fais</h3>${esc(p.partner)}</div>
      <div class="box"><h3 style="margin-top:0">Pourquoi ça aide</h3>${esc(p.why)}</div>
      ${p.caution ? `<div class="box caution">⚠️ ${esc(p.caution)}</div>` : ""}
      <button class="btn block ${isCurrent ? "on" : "primary"}" id="try" style="margin-top:14px">
        ${isCurrent ? "✓ Position en cours" : "On essaie celle-ci"}
      </button>
      <div class="row" style="margin-top:10px">
        <button class="btn ${like > 0 ? "on" : ""}" id="like">❤️ Elle aime</button>
        <button class="btn ${like < 0 ? "on" : ""}" id="dislike">👎 Pas pour elle</button>
      </div>
      <div class="pager">
        ${prev ? `<a class="btn" href="#/phase/${phaseId}/pos/${prev.id}" aria-label="Précédente">‹ ${prev.emoji}</a>` : "<span></span>"}
        <span class="muted small">glisse ← →</span>
        ${next ? `<a class="btn" href="#/phase/${phaseId}/pos/${next.id}" aria-label="Suivante">${next.emoji} ›</a>` : "<span></span>"}
      </div>
    `;
    window.scrollTo(0, 0);

    $("#try").onclick = () => {
      const t = Date.now(), open = S.posLog[S.posLog.length - 1];
      if (open && open.e === null) open.e = t;
      S.current = isCurrent ? null : { id: p.id, since: t };
      if (!isCurrent) S.posLog.push({ id: p.id, s: t, e: null });
      save(); go(renderPos, phaseId, posId);
    };
    const setLike = (v) => {
      if ((S.likes[p.id] || 0) === v) delete S.likes[p.id]; else S.likes[p.id] = v;
      save(); go(renderPos, phaseId, posId);
    };
    $("#like").onclick = () => setLike(1);
    $("#dislike").onclick = () => setLike(-1);

    // Glisser pour changer de fiche
    let x0 = null, y0 = null;
    const ts = (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; };
    const te = (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const target = dx < 0 ? next : prev;
      if (target) location.hash = `#/phase/${phaseId}/pos/${target.id}`;
    };
    view.addEventListener("touchstart", ts, { passive: true });
    view.addEventListener("touchend", te, { passive: true });
    cleanup = () => {
      view.removeEventListener("touchstart", ts);
      view.removeEventListener("touchend", te);
    };
  }

  // ---------- Minuteur de contractions ----------
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const median = (a) => {
    if (!a.length) return null;
    const r = [...a].sort((x, y) => x - y), m = r.length >> 1;
    return r.length % 2 ? r[m] : (r[m - 1] + r[m]) / 2;
  };
  const intervalsOf = (arr) => {
    const out = [];
    for (let k = 1; k < arr.length; k++) out.push(arr[k].s - arr[k - 1].s);
    return out;
  };
  // Épisode en cours : les contractions qui se suivent sans trou de plus de 4 h.
  // Évite de mélanger un faux travail d'il y a trois jours avec ce qui se passe maintenant.
  function episode(before = Infinity) {
    const cs = S.contractions.filter((c) => c.s < before);
    let i = cs.length - 1;
    while (i > 0 && cs[i].s - cs[i - 1].s <= 4 * HOUR) i--;
    return i < 0 ? [] : cs.slice(i);
  }
  // Série régulière : on remonte tant que l'écart reste proche du repère.
  // Un écart double isolé (un appui oublié) ne casse pas la série.
  function regularRun(limit) {
    const cs = S.contractions;
    let i = cs.length - 1, longPrev = false;
    if (i < 0) return [];
    const gap = (k) => cs[k].s - cs[k - 1].s;
    while (i > 0) {
      const g = gap(i);
      if (g <= limit * 1.3) { i--; longPrev = false; continue; }
      if (g <= limit * 2.6 && !longPrev && i > 1 && gap(i - 1) <= limit * 1.3) { i--; longPrev = true; continue; }
      break;
    }
    return cs.slice(i);
  }

  function stats() {
    const now = Date.now();
    const done = S.contractions.filter((c) => c.e !== null);
    const lastHour = done.filter((c) => c.s >= now - HOUR);
    const avgDur = avg(lastHour.map((c) => c.e - c.s));
    const avgInt = avg(intervalsOf(lastHour));

    // Repère de départ saisi par l'utilisateur (pas un diagnostic)
    const st = S.settings;
    const winMs = st.windowH * HOUR;
    const limit = st.intervalMin * MIN;
    const run = regularRun(limit);
    const last = run[run.length - 1];
    const regular = run.length >= 3 && median(intervalsOf(run)) <= limit && now - last.s <= limit * 1.5;
    const regularFor = regular ? now - run[0].s : 0;
    const reached = regularFor >= winMs * 0.9;

    // Tendance (description, pas diagnostic) : les 3 derniers écarts face aux 3 précédents
    let trend = null;
    const ints = intervalsOf(episode()).slice(-6);
    if (ints.length === 6 && now - S.contractions[S.contractions.length - 1].s < HOUR) {
      const r = median(ints.slice(3)) / median(ints.slice(0, 3));
      trend = r < 0.85 ? "closer" : r > 1.18 ? "wider" : "stable";
    }
    return { count: lastHour.length, avgDur, avgInt, reached, regularFor, winMs, trend };
  }
  const TREND = { closer: "↘ Elles se rapprochent", wider: "↗ Elles s'espacent", stable: "→ Rythme stable" };

  // Contraction « en cours » depuis trop longtemps : presque toujours un oubli d'appuyer sur FIN.
  const STALE_MS = 150 * 1000;
  function isStale() {
    const l = S.contractions[S.contractions.length - 1];
    return !!l && l.e === null && !l.long && Date.now() - l.s > STALE_MS;
  }
  function staleBanner() {
    const l = S.contractions[S.contractions.length - 1];
    if (l && l.e === null && l.long) {
      return `<div class="banner alert"><strong>Une contraction qui ne s'arrête pas, ou une douleur continue sans répit :</strong> préviens ${lastEvent("arrivee") ? "l'équipe" : "la maternité"} sans attendre.${!lastEvent("arrivee") && telOf() ? `<a class="btn primary block" style="margin-top:10px" href="tel:${esc(telOf())}">📞 Appeler ${esc(S.settings.mName || "la maternité")}</a>` : ""}</div>`;
    }
    if (!isStale()) return "";
    return `<div class="banner warn" id="stale"><strong>⏳ « En cours » depuis plus de ${human(Date.now() - l.s)}.</strong> Tu as peut-être oublié d'appuyer sur FIN ?
      <div class="row" style="margin-top:10px">
        <button class="btn" data-stale="fix">Oui, elle a duré ≈ ${human(estDuration().ms)}</button>
        <button class="btn" data-stale="keep">Non, elle continue</button>
      </div></div>`;
  }
  function bindStale(render) {
    const el = $("#stale"); if (!el) return;
    el.onclick = (e) => {
      const b = e.target.closest("[data-stale]"); if (!b) return;
      const l = S.contractions[S.contractions.length - 1];
      if (!l || l.e !== null) return;
      if (b.dataset.stale === "fix") { l.e = l.s + estDuration().ms; l.est = 1; } else l.long = 1;
      save(); updateTabbar(); go(render);
    };
  }

  let pendingWater = false; // choix de la couleur du liquide en cours
  let pendingNote = false;  // saisie d'une note en cours
  const eventDetail = (e) => !e.detail ? "" : e.type === "eaux" ? ((C.waterColors.find((w) => w.id === e.detail) || {}).label || "") : e.detail;
  function renderTimer() {
    const last = S.contractions[S.contractions.length - 1];
    const running = last && last.e === null;
    const st = stats();
    const rows = S.contractions.slice(-12).map((c, idx, arr) => {
      const globalIdx = S.contractions.length - arr.length + idx;
      const prev = S.contractions[globalIdx - 1];
      return `<tr>
        <td>${clock(c.s)}</td>
        <td>${c.e === null ? "en cours" : (c.est ? "≈ " : "") + dur(c.e - c.s)}</td>
        <td>${prev ? dur(c.s - prev.s) : "–"}</td>
        <td><button class="x sm" data-delc="${globalIdx}" aria-label="Supprimer cette contraction">×</button></td>
      </tr>`;
    }).reverse().join("");

    view.innerHTML = `
      <h1>⏱️ Contractions</h1>
      <p class="muted small">Appuie au début, puis à la fin de chaque contraction.</p>
      ${st.reached ? `
        <div class="banner alert">
          <strong>📞 Vous avez atteint le repère que vous avez noté</strong>
          (toutes les ${S.settings.intervalMin} min depuis ${S.settings.windowH} h).<br>
          Appelez la maternité.
          ${S.settings.phone ? `<a class="btn primary block" style="margin-top:10px" href="tel:${esc(S.settings.phone.replace(/[^\d+]/g, ""))}">Appeler ${esc(S.settings.mName || "la maternité")}</a>` : `<a href="#/mat">Enregistrer le numéro</a>`}
        </div>` : st.regularFor ? `
        <div class="banner">
          <strong>Écarts de ${S.settings.intervalMin} min ou moins depuis ${ago(st.regularFor)}</strong>
          <div class="progress"><div style="width:${Math.min(100, Math.round(st.regularFor / st.winMs * 100))}%"></div></div>
          <span class="muted small">Ton repère : ${S.settings.windowH} h. Un signe d'alerte ou un doute ? On appelle sans attendre le repère.</span>
        </div>` : ""}
      ${staleBanner()}
      <button class="bigbtn ${running ? "running" : ""}" id="tap">
        <span>${running ? "FIN" : "DÉBUT"}<small data-since="${running ? last.s : last && last.e ? last.e : ""}"></small>
        <small>${running ? "de la contraction" : last && last.e ? "de repos" : "de contraction"}</small></span>
      </button>
      <div class="stats">
        <div class="stat"><b>${st.count}</b><span>dans la dernière heure</span></div>
        <div class="stat"><b>${st.avgDur ? dur(st.avgDur) : "–"}</b><span>durée moyenne</span></div>
        <div class="stat"><b>${st.avgInt ? dur(st.avgInt) : "–"}</b><span>écart moyen</span></div>
      </div>
      ${st.trend ? `<p class="center trend">${TREND[st.trend]}</p>` : ""}
      ${trendChart()}
      ${rows ? `
        <table class="hist">
          <thead><tr><th>Début</th><th>Durée</th><th>Écart</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="row" style="margin-top:14px">
          <button class="btn" id="undo">↶ Annuler la dernière</button>
          <button class="btn danger" id="clear">Tout effacer</button>
        </div>` : `<p class="muted" style="text-align:center">Pas encore de contraction notée.</p>`}
      <p class="muted small" style="margin-top:16px">Repère de départ : toutes les ${S.settings.intervalMin} min depuis ${S.settings.windowH} h.
        <a href="#/mat">Modifier</a>. L'écart se mesure du début d'une contraction au début de la suivante.</p>

      <h2>Journal</h2>
      ${eventAlert()}
      ${pendingNote ? `
        <div class="box"><strong>📝 Note</strong>
          <input type="text" id="noteText" placeholder="Ce que l'équipe a dit, un détail à retenir…" style="margin-top:10px" maxlength="200">
          <div class="row" style="margin-top:8px"><button class="btn primary" id="noteSave">Enregistrer</button><button class="btn" id="noteCancel">Annuler</button></div>
        </div>` : pendingWater ? `
        <div class="box"><strong>💧 Couleur du liquide ?</strong>
          <div class="grid2" id="waterColors" style="margin-top:10px">
            ${C.waterColors.map((w) => `<button class="btn" data-c="${w.id}">${esc(w.label)}</button>`).join("")}
          </div>
          <button class="btn block" id="waterCancel" style="margin-top:8px;min-height:44px">Annuler</button>
        </div>` : `
        <div class="grid2" id="evButtons">
          ${Object.entries(C.events).filter(([id]) => id !== "naissance").map(([id, e]) => `<button class="btn" data-ev="${id}">${e.emoji} ${esc(e.label)}</button>`).join("")}
        </div>
        <div style="margin-top:10px">
          ${lastEvent("naissance") ? `<a class="btn primary block" href="#/birth">🎉 Voir le récit de naissance</a>` : `<button class="btn block birthbtn" data-ev="naissance" id="birthBtn">🎉 Bébé est né !</button>`}
        </div>`}
      ${S.events.some((e) => C.events[e.type]) ? `
        <ul class="journal">
          ${S.events.map((e, i) => C.events[e.type] ? `<li><span>${clock(e.t)}</span><span>${C.events[e.type].emoji} ${esc(C.events[e.type].label)}${e.detail ? " · " + esc(eventDetail(e)) : ""}</span><button class="x" data-del="${i}" aria-label="Supprimer">×</button></li>` : "").reverse().join("")}
        </ul>` : ""}
      ${summaryCard()}
    `;

    const again = () => go(renderTimer);
    $("#tap").onclick = () => { if (toggleContraction()) again(); };
    bindStale(renderTimer);
    view.querySelectorAll("[data-delc]").forEach((b) => b.onclick = () => {
      if (b.dataset.armed) { S.contractions.splice(+b.dataset.delc, 1); save(); updateTabbar(); return again(); }
      b.dataset.armed = "1"; b.textContent = "?"; b.classList.add("armed");
      setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = "×"; b.classList.remove("armed"); } }, 2500);
    });
    const onEv = (e) => {
      const b = e.target.closest("[data-ev]"); if (!b) return;
      if (b.dataset.ev === "eaux") { pendingWater = true; return again(); }
      if (b.dataset.ev === "note") { pendingNote = true; again(); const n = $("#noteText"); if (n) n.focus(); return; }
      if (b.dataset.ev === "naissance") { logEvent("naissance"); vibrate([60, 60, 60, 60, 200]); location.hash = "#/birth"; return; }
      if (b.dataset.ev === "depart") { logEvent("depart"); vibrate(40); location.hash = "#/depart"; return; }
      logEvent(b.dataset.ev); vibrate(40); again();
    };
    const evb = $("#evButtons"); if (evb) evb.onclick = onEv;
    const bb = $("#birthBtn"); if (bb) bb.onclick = onEv;
    const ns = $("#noteSave");
    if (ns) {
      const saveNote = () => { const v = $("#noteText").value.trim(); pendingNote = false; if (v) logEvent("note", v); again(); };
      ns.onclick = saveNote;
      $("#noteText").addEventListener("keydown", (e) => { if (e.key === "Enter") saveNote(); });
      $("#noteCancel").onclick = () => { pendingNote = false; again(); };
    }
    const wc = $("#waterColors");
    if (wc) {
      wc.onclick = (e) => {
        const b = e.target.closest("[data-c]"); if (!b) return;
        pendingWater = false; logEvent("eaux", b.dataset.c); vibrate(40); again();
      };
      $("#waterCancel").onclick = () => { pendingWater = false; again(); };
    }
    view.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => {
      S.events.splice(+b.dataset.del, 1); save(); again();
    });
    bindSummary();
    const undo = $("#undo");
    if (undo) undo.onclick = () => {
      const l = S.contractions[S.contractions.length - 1];
      if (l && l.e !== null) { l.e = null; delete l.est; } else S.contractions.pop();
      save(); again(); updateTabbar();
    };
    const clear = $("#clear");
    if (clear) {
      let armed = false;
      clear.onclick = () => {
        if (!armed) { armed = true; clear.textContent = "Appuie encore pour confirmer"; setTimeout(() => { armed = false; if (clear.isConnected) clear.textContent = "Tout effacer"; }, 3000); return; }
        S.contractions = []; S.events = []; save(); again(); updateTabbar();
      };
    }

    keepAwake(true);
    // Surveille le repère et les oublis d'appui (sans redessiner pendant une saisie)
    const stale0 = isStale();
    const iv = setInterval(() => {
      if (pendingNote) return;
      const fresh = stats();
      if (fresh.reached && !st.reached) vibrate([200, 100, 200, 100, 400]);
      if (fresh.reached !== st.reached || isStale() !== stale0 || !!fresh.regularFor !== !!st.regularFor) again();
    }, 5000);
    cleanup = () => { clearInterval(iv); keepAwake(false); };
  }

  // ---------- Respiration ----------
  function renderBreathe() {
    const st = S.settings;
    view.innerHTML = `
      <h1>🫁 Respirer ensemble</h1>
      <p class="muted small">Respire avec elle, à voix basse, pour lui donner le rythme. L'expiration est plus longue que l'inspiration.</p>
      <div class="breathe-wrap">
        <div>
          <div class="circle" id="circle"></div>
        </div>
      </div>
      <div class="breathe-label" id="lbl">Prêts ?</div>
      <button class="btn primary block" id="go" style="margin-top:12px">▶ Démarrer</button>
      <h2>Rythme</h2>
      <div class="seg" id="rhythm">
        ${[[3, 5], [4, 6], [4, 8]].map(([a, b]) => `<button data-a="${a}" data-b="${b}" aria-pressed="${st.inhale === a && st.exhale === b}">${a} s / ${b} s</button>`).join("")}
      </div>
      <p class="muted small">Inspire par le nez / expire par la bouche, comme pour souffler sur une bougie sans l'éteindre.</p>
      ${voiceToggle()}
    `;
    const circle = $("#circle"), lbl = $("#lbl"), go = $("#go");
    const eng = breathing(circle, lbl);
    function stop() { eng.stop(); go.textContent = "▶ Démarrer"; keepAwake(false); }
    go.onclick = () => {
      if (eng.on) return stop();
      go.textContent = "■ Arrêter"; keepAwake(true); eng.start();
    };
    bindVoice();
    $("#rhythm").onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      S.settings.inhale = +b.dataset.a; S.settings.exhale = +b.dataset.b; save();
      [...$("#rhythm").children].forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    };
    cleanup = stop;
  }

  // ---------- Voix ----------
  function voiceToggle() {
    const voice = "speechSynthesis" in window ? `<button class="toggle" id="voice" aria-pressed="${!!S.settings.voice}">
      <span><strong>🔊 Guide vocal</strong><br><span class="muted small">Le téléphone dit « Inspire… Expire… » : tes mains restent libres</span></span>
      <span class="switch"></span></button>` : "";
    const sound = (window.AudioContext || window.webkitAudioContext) ? `<button class="toggle" id="sound" aria-pressed="${!!S.settings.sound}">
      <span><strong>🎐 Sons doux</strong><br><span class="muted small">Une note qui monte à l'inspiration et redescend à l'expiration : yeux fermés, elle suit</span></span>
      <span class="switch"></span></button>` : "";
    return voice + sound;
  }
  function bindVoice() {
    const b = $("#voice");
    if (b) b.onclick = () => {
      S.settings.voice = !S.settings.voice; save();
      b.setAttribute("aria-pressed", String(S.settings.voice));
      if (S.settings.voice) speak("Je suis là."); else { try { speechSynthesis.cancel(); } catch (e) {} }
    };
    const so = $("#sound");
    if (so) so.onclick = () => {
      S.settings.sound = !S.settings.sound; save();
      so.setAttribute("aria-pressed", String(S.settings.sound));
      if (S.settings.sound) tone(196, 294, 1.5); else hush();
    };
  }

  // ---------- Mode coach ----------
  // Pendant la contraction : où on en est, la respiration, ton geste, une phrase.
  // Entre deux : les rappels de soins.
  const HILL = (() => {
    const pts = [];
    for (let i = 0; i <= 50; i++) { const x = i / 50; pts.push([x * 300, 82 - 70 * Math.sin(Math.PI * x) ** 2]); }
    return pts;
  })();
  const hillY = (p) => 82 - 70 * Math.sin(Math.PI * Math.min(1, p)) ** 2;
  let sayIndex = 0;

  function estDuration() {
    const d = S.contractions.filter((c) => c.e !== null).slice(-5).map((c) => c.e - c.s).filter((x) => x > 10000 && x < 4 * MIN).sort((a, b) => a - b);
    return d.length >= 2 ? { ms: d[Math.floor(d.length / 2)], measured: true } : { ms: 60000, measured: false };
  }

  function reminders() {
    const now = Date.now(), out = [];
    const since = (type) => { const e = lastEvent(type); return e ? now - e.t : Infinity; };
    const ep = episode();
    const started = ep[0] ? now - ep[0].s : 0;
    if (since("boire") > 20 * MIN) out.push({ id: "boire", text: "💧 Propose-lui une gorgée d'eau (paille)", btn: "✓ Elle a bu" });
    if (since("wc") > HOUR && started > 45 * MIN) out.push({ id: "wc", text: "🚽 Toilettes : une vessie vide laisse plus de place à bébé", btn: "✓ Fait" });
    if (S.current && now - S.current.since > 45 * MIN) {
      const p = posById(S.current.id);
      out.push({ id: "pos", text: `🔄 « ${p ? p.title : "Même position"} » depuis ${ago(now - S.current.since)} : on change ?`, link: `#/phase/${S.lastPhase || "actif"}` });
    } else if (!S.current) {
      out.push({ id: "pos", text: "🔄 Une position à essayer ?", link: `#/phase/${S.lastPhase || "actif"}` });
    }
    out.push({ id: "frais", text: "🧊 Gant frais sur la nuque, baume à lèvres" });
    if (since("moi") > 90 * MIN && started > HOUR) out.push({ id: "moi", text: "🥪 Et toi ? Bois un verre d'eau, mange un truc.", btn: "✓ C'est fait" });
    return out;
  }

  function renderCoach() {
    if (!isPro()) {
      view.innerHTML = `
        <h1>🎯 Mode coach</h1>
        <p>Pendant chaque contraction : où elle en est, la respiration, ton geste et une phrase à lui dire. Entre deux : les rappels qui comptent.</p>
        ${lockCard("Mode coach dans la version complète")}
        <p class="muted small">Le jour J, tout se débloque automatiquement dès que tu notes des contractions dans le <a href="#/timer">minuteur</a>.</p>`;
      return;
    }
    const last = S.contractions[S.contractions.length - 1];
    const running = last && last.e === null;
    const cur = S.current && posById(S.current.id);
    const cue = cur ? cur.partner : C.coach.defaultCue;

    if (running) {
      const est = estDuration();
      const area = `M0,90 ${HILL.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")} L300,90 Z`;
      const line = `M${HILL.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L")}`;
      view.innerHTML = `
        <div class="coach-head"><span class="pill hot">Contraction</span><span class="big-time" data-since="${last.s}"></span></div>
        <svg class="hill" viewBox="0 0 300 92" aria-hidden="true">
          <defs><clipPath id="cp"><rect id="cpr" x="0" y="0" width="0" height="92"/></clipPath></defs>
          <path d="${area}" style="fill:var(--accent);opacity:.3" clip-path="url(#cp)"/>
          <path d="${line}" style="fill:none;stroke:var(--muted);stroke-width:2.5;opacity:.6"/>
          <circle id="dot" cx="0" cy="82" r="8" style="fill:var(--accent)"/>
        </svg>
        <div class="stage" id="stage">${esc(C.coach.stages[0].label)}</div>
        <div class="muted small center" id="hint">${esc(C.coach.stages[0].hint)}</div>
        <p class="muted small center">${est.measured ? `Estimation d'après ses dernières contractions (≈ ${human(est.ms)}).` : "Repère indicatif (≈ 1 min) : il s'affinera au fil des contractions."}</p>
        <div class="coach-breath"><div class="cwrap"><div class="circle sm" id="circle"></div></div><div class="breathe-label" id="lbl"></div></div>
        <div class="box you"><strong>👉 Ton geste</strong><br>${esc(cue)}</div>
        <div class="box say"><strong>💬 Dis-lui</strong><br><span id="say">« ${esc(sayAt(sayIndex))} »</span></div>
        <button class="btn block stopbtn" id="tap">FIN de la contraction</button>
        ${staleBanner()}
        ${voiceToggle()}
      `;
      const eng = breathing($("#circle"), $("#lbl"), "");
      eng.start();
      const dot = $("#dot"), cpr = $("#cpr"), stage = $("#stage"), hint = $("#hint"), sayEl = $("#say");
      let lastStage = -1;
      const update = () => {
        const p = (Date.now() - last.s) / est.ms;
        const x = Math.min(1, p) * 300;
        dot.setAttribute("cx", x.toFixed(1)); dot.setAttribute("cy", hillY(p).toFixed(1));
        cpr.setAttribute("width", x.toFixed(1));
        const si = C.coach.stages.findIndex((s) => p <= s.upTo);
        if (si !== lastStage) {
          lastStage = si;
          stage.textContent = C.coach.stages[si].label; hint.textContent = C.coach.stages[si].hint;
          if (si === 1) vibrate(30);
        }
      };
      update();
      const stale0 = isStale();
      const iv = setInterval(() => { update(); if (isStale() !== stale0) go(renderCoach); }, 200);
      const sv = setInterval(() => { sayIndex++; sayEl.textContent = `« ${sayAt(sayIndex)} »`; }, 9000);
      $("#tap").onclick = () => { if (toggleContraction()) go(renderCoach); };
      bindStale(renderCoach);
      bindVoice();
      keepAwake(true);
      cleanup = () => { clearInterval(iv); clearInterval(sv); eng.stop(); keepAwake(false); };
      return;
    }

    // Entre deux contractions
    const prev = S.contractions[S.contractions.length - 2];
    const rem = last ? reminders() : [];
    view.innerHTML = `
      <div class="coach-head"><span class="pill calm">${last ? "Repos" : G("Prêt", "Prête")}</span>${last ? `<span class="big-time" data-since="${last.e}"></span>` : ""}</div>
      ${last
        ? `<p class="muted small center">Dernière : ${human(last.e - last.s)}${prev ? ` · écart ${human(last.s - prev.s)}` : ""}</p>`
        : `<p class="center">Appuie au <strong>début</strong> de la contraction : je te guide pendant, et je te rappelle l'essentiel entre deux.</p>`}
      ${eventAlert()}
      <button class="bigbtn" id="tap"><span>DÉBUT<small>de contraction</small></span></button>
      ${rem.length ? `<h2>Entre deux contractions</h2><div id="rem">
        ${rem.map((r) => `<div class="remind">
          <span>${esc(r.text)}</span>
          ${r.btn ? `<button class="btn" data-log="${r.id}">${esc(r.btn)}</button>` : r.link ? `<a class="btn" href="${r.link}">Voir</a>` : ""}
        </div>`).join("")}</div>` : ""}
      <div class="grid2" style="margin-top:14px">
        <a class="btn" href="#/show">🖐️ Montre-moi</a>
        <a class="btn" href="#/words">💬 Quoi lui dire</a>
      </div>
      <a class="btn block" href="#/calme" style="margin-top:10px">🧘 Et toi ? SOS calme en 60 s</a>
    `;
    $("#tap").onclick = () => { if (toggleContraction()) { sayIndex++; go(renderCoach); } };
    const remEl = $("#rem");
    if (remEl) remEl.onclick = (e) => {
      const b = e.target.closest("[data-log]"); if (!b) return;
      logEvent(b.dataset.log); vibrate(30); go(renderCoach);
    };
    keepAwake(true);
    cleanup = () => keepAwake(false);
  }

  // ---------- Montre-moi ----------
  function renderShow() {
    view.innerHTML = `
      <h1>🖐️ Montre-moi</h1>
      <p class="muted small">Pendant une contraction, elle ne peut pas parler : elle pointe, tu touches, tu sais quoi faire.</p>
      <div class="board" id="board">
        ${C.board.map((b) => `<button class="bcard" data-id="${b.id}"><span class="em">${b.emoji}</span><span>${esc(b.her)}</span></button>`).join("")}
      </div>
    `;
    $("#board").onclick = (e) => {
      const btn = e.target.closest("[data-id]"); if (!btn) return;
      const b = C.board.find((x) => x.id === btn.dataset.id);
      const m = document.createElement("div");
      m.className = "modal";
      m.innerHTML = `<div class="card center">
        <div style="font-size:4.5em;line-height:1">${b.emoji}</div>
        <h2 style="margin:10px 0 6px;font-size:1.6em">« ${esc(b.her)} »</h2>
        <div class="box you" style="text-align:left"><strong>👉 Ce que tu fais</strong><br>${esc(b.you)}</div>
        <button class="btn primary block" id="ok">✓ C'est fait</button>
        ${b.link ? `<a class="btn block" style="margin-top:8px" href="${b.link}" id="go">Voir les positions</a>` : ""}
      </div>`;
      const close = () => m.remove();
      m.onclick = (ev) => { if (ev.target === m) close(); };
      m.querySelector("#ok").onclick = () => { if (b.log) logEvent(b.log); vibrate(30); close(); };
      const go = m.querySelector("#go"); if (go) go.onclick = close;
      document.body.appendChild(m);
      vibrate(20);
    };
  }

  // ---------- Ses souhaits ----------
  function prefsSheet() {
    const liked = C.positions.filter((p) => (S.likes[p.id] || 0) > 0).map((p) => p.title);
    const rows = C.prefsFields.filter((f) => f.id !== "prenom" && S.prefs[f.id]).map((f) => `<div class="prow"><span>${esc(f.label)}</span><strong>${esc(S.prefs[f.id])}</strong></div>`);
    if (liked.length) rows.push(`<div class="prow"><span>Positions qu'elle aime</span><strong>${esc(liked.join(", "))}</strong></div>`);
    return rows.join("");
  }
  function renderPrefs() {
    if (!isPro()) {
      view.innerHTML = `<div class="topbar">${backBtn("#/")}<h1>📝 Ses souhaits</h1></div>
        <p>Notez ensemble ses souhaits pour le jour J, et montrez-les à l'équipe en un geste, en grand.</p>
        ${lockCard("Ses souhaits dans la version complète")}`;
      return;
    }
    const P = S.prefs;
    view.innerHTML = `
      <div class="topbar">${backBtn("#/")}<h1>📝 Ses souhaits</h1></div>
      <p class="muted small">À remplir <strong>ensemble</strong>, avant le jour J. Le jour J, montre la fiche à l'équipe en un geste.</p>
      <button class="btn primary block" id="showTeam">👀 Montrer à l'équipe</button>
      ${C.prefsFields.map((f) => f.type === "choice" ? `
        <span class="muted small" style="display:block;margin-top:14px">${esc(f.label)}</span>
        <div class="seg wrap" data-f="${f.id}">
          ${f.options.map((o) => `<button aria-pressed="${P[f.id] === o}" data-v="${esc(o)}">${esc(o)}</button>`).join("")}
        </div>` : `
        <label class="field"><span>${esc(f.label)}</span><input type="text" data-f="${f.id}" value="${esc(P[f.id] || "")}" placeholder="${esc(f.ph || "")}"></label>`).join("")}
      <p class="muted small">Les positions marquées ❤️ s'ajoutent automatiquement à la fiche.</p>
    `;
    view.querySelectorAll("input[data-f]").forEach((el) => el.addEventListener("input", () => { P[el.dataset.f] = el.value.trim(); save(); }));
    view.querySelectorAll(".seg[data-f]").forEach((seg) => seg.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const f = seg.dataset.f;
      P[f] = P[f] === b.dataset.v ? "" : b.dataset.v; save();
      [...seg.children].forEach((x) => x.setAttribute("aria-pressed", String(P[f] === x.dataset.v)));
    });
    $("#showTeam").onclick = () => {
      const m = document.createElement("div");
      m.className = "modal team";
      m.innerHTML = `<div class="card">
        <h2 style="margin-top:0">Souhaits de naissance${S.prefs.prenom ? ` de ${esc(S.prefs.prenom)}` : ""}</h2>
        ${prefsSheet() || `<p class="muted">Rien de rempli pour l'instant.</p>`}
        <p class="muted small">Ce sont des souhaits : l'équipe médicale reste seule juge de ce qui est possible.</p>
        <button class="btn block noprint" style="margin-top:10px">Fermer</button>
        <button class="btn block noprint" id="printPrefs" style="margin-top:8px;min-height:44px">🖨️ Imprimer ou enregistrer en PDF (pour le dossier)</button>
      </div>`;
      m.querySelector("button").onclick = () => m.remove();
      m.querySelector("#printPrefs").onclick = () => { try { window.print(); } catch (e) {} };
      document.body.appendChild(m);
    };
  }

  // ---------- Sac de maternité ----------
  function renderBag() {
    const total = C.bag.reduce((n, s) => n + s.items.length, 0);
    const done = Object.values(S.bag).filter(Boolean).length;
    view.innerHTML = `
      <div class="topbar">${backBtn("#/")}<h1>🎒 Sac de maternité</h1></div>
      <div class="progress"><div style="width:${Math.round(done / total * 100)}%"></div></div>
      <p class="muted small">${done} / ${total} prêts. À préparer vers le 8e mois. Vérifie aussi la liste de ta maternité.</p>
      <div id="bag">
        ${C.bag.map((s, si) => `<h2>${esc(s.title)}</h2>${s.items.map((it, ii) => {
          const id = si + "-" + ii;
          return `<button class="check" data-id="${id}" aria-pressed="${!!S.bag[id]}"><span class="box2">${S.bag[id] ? "✓" : ""}</span><span class="lbl">${esc(it)}</span></button>`;
        }).join("")}`).join("")}
      </div>
    `;
    $("#bag").onclick = (e) => {
      const b = e.target.closest(".check"); if (!b) return;
      S.bag[b.dataset.id] = !S.bag[b.dataset.id]; save();
      const y = window.scrollY; renderBag(); window.scrollTo(0, y);
    };
  }

  // ---------- Messages aux proches ----------
  function messageText(m) {
    const B = S.baby;
    const extra = [B.poids, B.taille].filter(Boolean).join(", ");
    return m.text
      .replace("{prenom}", B.prenom || "Bébé")
      .replace("né·e", born())
      .replace("{heure}", B.heure || clock(Date.now()))
      .replace("{poids}{taille}", extra ? extra + ". " : "");
  }
  function renderMsg() {
    const B = S.baby;
    view.innerHTML = `
      <div class="topbar">${backBtn("#/")}<h1>📱 Messages aux proches</h1></div>
      <p class="muted small">Des messages prêts à envoyer en deux gestes, pour ne pas passer le jour J sur ton téléphone. Tu choisis les destinataires au moment d'envoyer.</p>
      <div id="msgs">
        ${C.messages.map((m) => `
          <div class="box">
            <strong>${esc(m.title)}</strong>
            <p class="msgtext" data-m="${m.id}">${esc(messageText(m))}</p>
            <div class="row">
              <button class="btn primary" data-share="${m.id}">Envoyer…</button>
              <a class="btn" href="sms:?&body=${encodeURIComponent(messageText(m))}" data-sms="${m.id}">SMS</a>
            </div>
          </div>`).join("")}
      </div>
      <h2>Pour le message de naissance</h2>
      <div class="grid2">
        <label class="field"><span>Prénom</span><input type="text" data-b="prenom" value="${esc(B.prenom || "")}"></label>
        <label class="field"><span>Heure</span><input type="text" data-b="heure" value="${esc(B.heure || "")}" placeholder="${clock(Date.now())}"></label>
        <label class="field"><span>Poids</span><input type="text" data-b="poids" value="${esc(B.poids || "")}" placeholder="3,250 kg"></label>
        <label class="field"><span>Taille</span><input type="text" data-b="taille" value="${esc(B.taille || "")}" placeholder="50 cm"></label>
      </div>
    `;
    const refresh = () => C.messages.forEach((m) => {
      view.querySelector(`[data-m="${m.id}"]`).textContent = messageText(m);
      view.querySelector(`[data-sms="${m.id}"]`).href = "sms:?&body=" + encodeURIComponent(messageText(m));
    });
    view.querySelectorAll("input[data-b]").forEach((el) => el.addEventListener("input", () => { S.baby[el.dataset.b] = el.value.trim(); save(); refresh(); }));
    $("#msgs").onclick = async (e) => {
      const b = e.target.closest("[data-share]"); if (!b) return;
      const m = C.messages.find((x) => x.id === b.dataset.share);
      const text = messageText(m);
      try {
        if (navigator.share) await navigator.share({ text });
        else { await navigator.clipboard.writeText(text); b.textContent = "Copié ✓"; }
      } catch (err) { /* partage annulé */ }
    };
  }

  // ---------- Graphique : les contractions se rapprochent-elles ? ----------
  function trendChart() {
    const cs = S.contractions.slice(-13);
    if (cs.length < 3) return "";
    const ints = [];
    for (let k = 1; k < cs.length; k++) ints.push({ t: cs[k].s, v: (cs[k].s - cs[k - 1].s) / MIN });
    const ref = S.settings.intervalMin;
    const max = Math.min(30, Math.max(ref * 2, ...ints.map((i) => i.v)));
    const W = 300, H = 120, base = H - 18, top = 14, bw = W / ints.length;
    const yOf = (v) => base - (Math.min(v, max) / max) * (base - top);
    const bars = ints.map((it, k) => {
      const y = yOf(it.v), x = k * bw + bw * 0.18, w = bw * 0.64;
      const close = it.v <= ref;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${(base - y).toFixed(1)}" rx="3" style="fill:var(${close ? "--accent" : "--surface-2"})"/>
        <text x="${(x + w / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" style="fill:var(--muted);font-size:9px">${Math.round(it.v * 2) / 2}</text>`;
    }).join("");
    const ry = yOf(ref).toFixed(1);
    return `<div class="chart">
      <div class="small muted">Écart entre les contractions (min). Les barres raccourcissent quand elles se rapprochent ; pointillés = ton repère (${ref} min).</div>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Écarts entre les dernières contractions">
        <line x1="0" y1="${ry}" x2="${W}" y2="${ry}" style="stroke:var(--warn);stroke-width:1.5;stroke-dasharray:4 4"/>
        ${bars}
        <line x1="0" y1="${base}" x2="${W}" y2="${base}" style="stroke:var(--line);stroke-width:1"/>
        <text x="2" y="${H - 4}" style="fill:var(--muted);font-size:9px">${clock(ints[0].t)}</text>
        <text x="${W - 2}" y="${H - 4}" text-anchor="end" style="fill:var(--muted);font-size:9px">${clock(ints[ints.length - 1].t)}</text>
      </svg></div>`;
  }

  // ---------- Récit de naissance ----------
  function birthStory() {
    const b = lastEvent("naissance"); if (!b) return [];
    const d = new Date(b.t);
    const first = episode(b.t)[0];
    const lines = [`${S.baby.prenom || "Notre bébé"} est ${born()} le ${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} à ${clock(b.t)}.`];
    if (S.baby.poids || S.baby.taille) lines.push([S.baby.poids, S.baby.taille].filter(Boolean).join(", ") + ".");
    if (first && first.s < b.t) {
      const n = episode(b.t).length;
      lines.push(`Première contraction notée à ${clock(first.s)} : ${ago(b.t - first.s)} de travail, ${n} contraction${n > 1 ? "s" : ""} notée${n > 1 ? "s" : ""}.`);
    }
    S.events.filter((e) => e.type !== "naissance" && C.events[e.type]).forEach((e) => {
      lines.push(`${clock(e.t)} · ${C.events[e.type].emoji} ${C.events[e.type].label}${e.detail ? (e.type === "eaux" ? ", liquide " + eventDetail(e).toLowerCase() : " : " + eventDetail(e)) : ""}`);
    });
    const tried = {};
    (S.posLog || []).filter((x) => x.s < b.t).forEach((x) => { tried[x.id] = (tried[x.id] || 0) + Math.min(x.e || b.t, b.t) - x.s; });
    const triedTxt = Object.entries(tried).filter(([id, ms]) => ms >= MIN && posById(id)).sort((x, y) => y[1] - x[1]).map(([id, ms]) => `${posById(id).title} (${ago(ms)})`);
    if (triedTxt.length) lines.push(`Positions essayées : ${triedTxt.join(", ")}.`);
    const liked = C.positions.filter((p) => (S.likes[p.id] || 0) > 0).map((p) => p.title);
    if (liked.length) lines.push(`Ce qui l'a aidée : ${liked.join(", ")}.`);
    return lines;
  }
  function renderBirth() {
    const b = lastEvent("naissance");
    if (!b) {
      view.innerHTML = `<div class="topbar">${backBtn("#/")}<h1>🎉 Naissance</h1></div>
        <p>Quand bébé est là, appuie ici : l'app garde l'heure et prépare votre récit de naissance.</p>
        <button class="btn primary block birthbtn" id="born" style="min-height:72px">🎉 Bébé est né !</button>`;
      $("#born").onclick = () => { logEvent("naissance"); vibrate([60, 60, 60, 60, 200]); renderBirth(); };
      return;
    }
    if (!S.baby.heure) { S.baby.heure = clock(b.t); save(); }
    view.innerHTML = `
      <div class="birth-hero">
        <div class="confetti" aria-hidden="true">${["🎉", "✨", "💛", "🎊", "✨", "🍼", "💛", "🎉"].map((c, k) => `<span style="--d:${k * 0.35}s;--x:${(k * 37) % 100}%">${c}</span>`).join("")}</div>
        <div style="font-size:3.6em">👶</div>
        <h1>Bienvenue${S.baby.prenom ? " " + esc(S.baby.prenom) : ""} !</h1>
        <p class="muted">${new Date(b.t).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à ${clock(b.t)}</p>
      </div>
      ${sexSeg()}
      <div class="grid2">
        <label class="field"><span>Prénom</span><input type="text" data-b="prenom" value="${esc(S.baby.prenom || "")}"></label>
        <label class="field"><span>Poids</span><input type="text" data-b="poids" value="${esc(S.baby.poids || "")}" placeholder="3,250 kg"></label>
      </div>
      <div class="box story"><h3 style="margin-top:0">📖 Votre récit de naissance</h3><ul id="story">${birthStory().map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
        <button class="btn" id="copyStory" style="min-height:44px">Copier le récit</button></div>
      <a class="btn primary block" href="#/msg" style="margin-top:12px">📱 Annoncer la naissance</a>
      <a class="btn block" href="#/photos" style="margin-top:10px">📸 Les photos à ne pas manquer</a>
      <a class="btn block" href="#/card" style="margin-top:10px">💌 Créer le faire-part en image</a>
      <a class="btn block" href="#/log" style="margin-top:10px">📒 Carnet des premiers jours (tétées, couches)</a>
      <a class="btn block" href="#/after" style="margin-top:10px">👶 Les premières heures, les premiers jours</a>
      <a class="btn block" href="#/todo" style="margin-top:10px">🗂️ Démarches et délais</a>
      ${CFG.shareUrl ? `<div class="box" style="margin-top:16px"><strong>🤍 L'app vous a aidés ?</strong><br><span class="muted small">Le plus beau merci : la recommander à ${G("un futur papa", "de futurs parents")}.</span>
        <button class="btn block" id="reco" style="margin-top:10px">Recommander l'app</button></div>` : ""}
      <button class="btn block" id="undoBirth" style="margin-top:16px;min-height:44px;opacity:.7">Annuler (appui par erreur)</button>
    `;
    view.querySelectorAll("input[data-b]").forEach((el) => el.addEventListener("input", () => {
      S.baby[el.dataset.b] = el.value.trim(); save();
      $("#story").innerHTML = birthStory().map((l) => `<li>${esc(l)}</li>`).join("");
    }));
    bindSexSeg(() => { $("#story").innerHTML = birthStory().map((l) => `<li>${esc(l)}</li>`).join(""); });
    $("#copyStory").onclick = async (e) => {
      try { await navigator.clipboard.writeText(birthStory().join("\n")); e.target.textContent = "Copié ✓"; } catch (err) { e.target.textContent = "Copie impossible"; }
    };
    const reco = $("#reco");
    if (reco) reco.onclick = async () => {
      const text = `L'app qui m'a guidé${G("", "e")} pendant l'accouchement : positions, gestes, respiration. Pour tous les futurs ${G("papas", "parents")} :`;
      try { if (navigator.share) await navigator.share({ text, url: CFG.shareUrl }); else { await navigator.clipboard.writeText(text + " " + CFG.shareUrl); reco.textContent = "Lien copié ✓"; } } catch (err) {}
    };
    let armed = false;
    $("#undoBirth").onclick = (e) => {
      if (!armed) { armed = true; e.target.textContent = "Appuie encore pour annuler"; return; }
      const i = S.events.lastIndexOf(b); if (i >= 0) S.events.splice(i, 1); save(); renderBirth();
    };
  }

  // ---------- Après la naissance ----------
  function renderAfter() {
    const tel = telOf();
    view.innerHTML = `
      <div class="topbar">${backBtn("#/")}<h1>👶 Après la naissance</h1></div>
      <p class="muted small">Informations générales. À la maternité, l'équipe est là : n'hésite jamais à sonner. À la maison : sage-femme, médecin, et le 15 en urgence.</p>
      ${C.after.map((s) => `
        <h2>${esc(s.title)}</h2>
        <div class="box ${s.alert ? "caution" : ""}"><ul class="afterlist">${s.items.map((it) => `<li>${esc(it)}</li>`).join("")}</ul>
        ${s.alert ? `<div class="row" style="margin-top:10px"><a class="btn danger" href="tel:15">🚑 15</a>${tel ? `<a class="btn" href="tel:${esc(tel)}">📞 Maternité</a>` : ""}</div>` : ""}
        </div>`).join("")}
    `;
  }

  // ---------- Entraînement (avant le jour J) ----------
  function hillMarkup() {
    const area = `M0,90 ${HILL.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")} L300,90 Z`;
    const line = `M${HILL.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L")}`;
    return `<svg class="hill" viewBox="0 0 300 92" aria-hidden="true">
      <defs><clipPath id="cp"><rect id="cpr" x="0" y="0" width="0" height="92"/></clipPath></defs>
      <path d="${area}" style="fill:var(--accent);opacity:.3" clip-path="url(#cp)"/>
      <path d="${line}" style="fill:none;stroke:var(--muted);stroke-width:2.5;opacity:.6"/>
      <circle id="dot" cx="0" cy="82" r="8" style="fill:var(--accent)"/></svg>`;
  }
  function hillSet(p) {
    const x = Math.min(1, p) * 300;
    const dot = $("#dot"), cpr = $("#cpr");
    if (dot) { dot.setAttribute("cx", x.toFixed(1)); dot.setAttribute("cy", hillY(p).toFixed(1)); }
    if (cpr) cpr.setAttribute("width", x.toFixed(1));
  }

  function trainingPositions() {
    const ok = (p) => p && !isLocked(p) && (S.likes[p.id] || 0) >= 0;
    const liked = C.positions.filter((p) => ok(p) && S.likes[p.id] > 0);
    const untested = C.training.defaults.map(posById).filter((p) => ok(p) && !S.likes[p.id]);
    const rest = C.training.defaults.map(posById).filter(ok);
    const pick = [];
    // Une favorite pour se mettre en confiance, puis des positions pas encore testées
    for (const p of [...liked.slice(0, 1), ...untested, ...rest, ...liked]) {
      if (!pick.includes(p)) pick.push(p);
      if (pick.length === 3) break;
    }
    return pick;
  }

  function renderTrainHome() {
    const T = S.training;
    view.innerHTML = `
      <div class="topbar">${backBtn("#/")}<h1>🏋️ S'entraîner à deux</h1></div>
      <p>Le jour J, on retrouve ce qu'on a déjà fait de ses mains. Quelques minutes ensemble, avant le terme, changent tout.</p>
      <div class="stats" style="margin:14px 0">
        <div class="stat"><b>${T.sessions}</b><span>séance${T.sessions > 1 ? "s" : ""}</span></div>
        <div class="stat"><b>${Object.values(S.likes).filter((v) => v > 0).length}</b><span>positions ❤️</span></div>
        <div class="stat"><b>${T.quizBest == null ? "–" : `${T.quizBest}/${C.quiz.length}`}</b><span>meilleur quiz</span></div>
      </div>
      <a class="traincard" href="#/train/session">
        <span class="em">🤝</span>
        <span><strong>Séance guidée</strong><br><span class="muted small">3 positions, une contraction d'entraînement chacune, et son avis. ≈ 6 min.</span></span>
      </a>
      <a class="traincard" href="#/train/quiz">
        <span class="em">🧠</span>
        <span><strong>Quiz : es-tu prêt${G("", "e")} ?</strong><br><span class="muted small">${C.quiz.length} situations du jour J. Que fais-tu ?</span></span>
      </a>
      <div class="tips" style="margin-top:16px"><ul>${C.training.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
      ${T.lastAt ? `<p class="muted small">Dernière séance : ${new Date(T.lastAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}.</p>` : ""}
    `;
  }

  function renderTrainSession() {
    const list = trainingPositions();
    let i = 0, step = "intro";
    const verdicts = [];
    let timers = [], eng = null;
    const clear = () => { timers.forEach(clearInterval); timers = []; if (eng) { eng.stop(); eng = null; } };

    function draw() {
      clear();
      const p = list[i];
      const head = `<div class="topbar">${backBtn("#/train")}<span class="muted">Position ${i + 1} / ${list.length}</span></div>
        <div class="dots">${list.map((_, k) => `<span class="${k < i ? "done" : k === i ? "cur" : ""}"></span>`).join("")}</div>`;

      if (step === "intro") {
        view.innerHTML = `${head}
          <img class="picto" src="${IMG()}${p.id}${MOTION ? "" : "-still"}.svg" alt="${esc(p.title)}">
          <h1 class="center">${esc(p.title)}</h1>
          <ol class="steps">${p.steps.map((s) => `<li><span>${esc(s)}</span></li>`).join("")}</ol>
          <div class="box you"><strong>👉 Ce que TU fais</strong><br>${esc(p.partner)}</div>
          ${p.caution ? `<div class="box caution">⚠️ ${esc(p.caution)}</div>` : ""}
          <button class="btn primary block" id="next" style="min-height:64px">On est en place : contraction d'entraînement</button>`;
        $("#next").onclick = () => { step = "practice"; draw(); };
        return;
      }

      if (step === "practice") {
        const total = C.training.practiceMs, t0 = Date.now();
        view.innerHTML = `${head}
          <div class="coach-head"><span class="pill hot">Entraînement</span><span class="big-time" id="left"></span></div>
          ${hillMarkup()}
          <div class="stage" id="stage"></div>
          <div class="coach-breath"><div class="cwrap"><div class="circle sm" id="circle"></div></div><div class="breathe-label" id="lbl"></div></div>
          <div class="box you"><strong>👉 Ton geste</strong><br>${esc(p.partner)}</div>
          <p class="muted small center">Elle imagine une contraction : tu fais le geste et tu respires avec elle, jusqu'au bout de la vague.</p>
          <button class="btn block" id="skip">Terminer</button>`;
        eng = breathing($("#circle"), $("#lbl"), "");
        eng.start();
        keepAwake(true);
        const update = () => {
          const el = Date.now() - t0, pr = el / total;
          hillSet(pr);
          const si = C.coach.stages.findIndex((s) => pr <= s.upTo);
          $("#stage").textContent = C.coach.stages[si].label;
          $("#left").textContent = dur(Math.max(0, total - el));
          if (el >= total) { vibrate([40, 80, 40]); step = "verdict"; draw(); }
        };
        update();
        timers.push(setInterval(update, 200));
        $("#skip").onclick = () => { step = "verdict"; draw(); };
        return;
      }

      if (step === "verdict") {
        view.innerHTML = `${head}
          <img class="picto" src="${IMG()}${p.id}-still.svg" alt="" style="max-width:260px">
          <h1 class="center">Alors, pour elle ?</h1>
          <p class="muted center">C'est <strong>elle</strong> qui répond. Rien n'est figé : le jour J, son corps décidera.</p>
          <div class="verdict" id="verdict">
            <button class="btn" data-v="1">❤️ J'aime</button>
            <button class="btn" data-v="0">😐 Bof</button>
            <button class="btn" data-v="-1">👎 Pas pour moi</button>
          </div>`;
        $("#verdict").onclick = (e) => {
          const b = e.target.closest("[data-v]"); if (!b) return;
          const v = +b.dataset.v;
          if (v) S.likes[p.id] = v; else delete S.likes[p.id];
          verdicts.push({ p, v });
          save(); vibrate(30);
          if (i < list.length - 1) { i++; step = "intro"; } else step = "done";
          draw();
        };
        return;
      }

      // Fin de séance
      S.training.sessions = (S.training.sessions || 0) + 1;
      S.training.lastAt = Date.now();
      save();
      keepAwake(false);
      view.innerHTML = `
        <div class="topbar">${backBtn("#/train")}<h1>Bravo à vous deux 🤍</h1></div>
        <img class="picto home" src="${IMG()}accueil${MOTION ? "" : "-still"}.svg" alt="">
        <ul class="say">${verdicts.map(({ p, v }) => `<li>${v > 0 ? "❤️" : v < 0 ? "👎" : "😐"} ${esc(p.title)}</li>`).join("")}</ul>
        <p class="muted small">Ses ❤️ remontent en tête de liste et apparaissent dans <a href="#/prefs">ses souhaits</a>. Les 👎 passent en fin de liste.</p>
        <div class="row" style="margin-top:12px">
          <a class="btn primary" href="#/train/session" id="again">Une autre séance</a>
          <a class="btn" href="#/train/quiz">Le quiz</a>
        </div>`;
      $("#again").onclick = (e) => { e.preventDefault(); renderTrainSession(); };
    }

    if (!list.length) {
      view.innerHTML = `<div class="topbar">${backBtn("#/train")}<h1>Séance guidée</h1></div>
        <p>Aucune position disponible : vous les avez toutes écartées 👎. Réinitialisez ses avis dans les fiches.</p>`;
      return;
    }
    draw();
    cleanup = () => { clear(); keepAwake(false); };
  }

  function renderTrainQuiz() {
    const shuffle = (a) => { const r = a.slice(); for (let k = r.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [r[k], r[j]] = [r[j], r[k]]; } return r; };
    const qs = shuffle(C.quiz).map((q) => ({ ...q, opts: shuffle(q.a.map((text, k) => ({ text, ok: k === 0 }))) }));
    let i = 0, score = 0;

    function draw() {
      if (i >= qs.length) {
        const best = S.training.quizBest;
        if (best == null || score > best) S.training.quizBest = score;
        save();
        const msg = score === qs.length ? `Parfait. Tu es prêt${G("", "e")} 💪` : score >= qs.length * 0.7 ? "Très bien : tu as les bons réflexes." : "Bonne base : refais-le dans quelques jours.";
        view.innerHTML = `
          <div class="topbar">${backBtn("#/train")}<h1>🧠 Résultat</h1></div>
          <div class="score">${score} / ${qs.length}</div>
          <p class="center">${msg}</p>
          <div class="row" style="margin-top:14px">
            <button class="btn primary" id="retry">Recommencer</button>
            <a class="btn" href="#/train">Terminer</a>
          </div>`;
        $("#retry").onclick = () => renderTrainQuiz();
        return;
      }
      const q = qs[i];
      view.innerHTML = `
        <div class="topbar">${backBtn("#/train")}<span class="muted">Question ${i + 1} / ${qs.length} · ${score} ✓</span></div>
        <div class="progress"><div style="width:${Math.round(i / qs.length * 100)}%"></div></div>
        <h2 style="margin-top:18px">${esc(q.q)}</h2>
        <p class="muted small">Que fais-tu ?</p>
        <div id="opts">${q.opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o.text)}</button>`).join("")}</div>
        <div id="fb"></div>`;
      $("#opts").onclick = (e) => {
        const b = e.target.closest("[data-k]"); if (!b || $("#opts").dataset.done) return;
        $("#opts").dataset.done = "1";
        const good = q.opts[+b.dataset.k].ok;
        if (good) score++;
        vibrate(good ? 30 : [20, 50, 20]);
        view.querySelectorAll(".opt").forEach((x) => {
          const o = q.opts[+x.dataset.k];
          x.classList.add(o.ok ? "ok" : x === b ? "ko" : "off");
        });
        $("#fb").innerHTML = `<div class="box ${good ? "you" : "caution"}"><strong>${good ? "✓ Oui !" : "Pas tout à fait."}</strong><br>${esc(q.why)}</div>
          <button class="btn primary block" id="nextq">${i < qs.length - 1 ? "Question suivante" : "Voir le résultat"}</button>`;
        $("#nextq").onclick = () => { i++; draw(); window.scrollTo(0, 0); };
      };
    }
    draw();
  }

  // ---------- Fille / garçon (accords dans les messages et le faire-part) ----------
  function sexSeg() {
    return `<div class="seg" id="sexe" style="margin:8px 0">
      ${[["f", "Fille"], ["m", "Garçon"], ["", "Ne pas préciser"]].map(([v, l]) => `<button data-v="${v}" aria-pressed="${(S.baby.sexe || "") === v}">${l}</button>`).join("")}
    </div>`;
  }
  function bindSexSeg(after) {
    const seg = $("#sexe"); if (!seg) return;
    seg.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      S.baby.sexe = b.dataset.v; save();
      [...seg.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      after && after();
    };
  }

  // ---------- Êtes-vous prêts ? ----------
  function readyItems() {
    const bagTotal = C.bag.reduce((n, g) => n + g.items.length, 0);
    const bagDone = Object.values(S.bag).filter(Boolean).length;
    const likes = Object.values(S.likes).filter((v) => v > 0).length;
    const prefsN = Object.values(S.prefs).filter(Boolean).length;
    const quizMin = Math.ceil(C.quiz.length * 0.8);
    let installed = false;
    try { installed = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) {}
    const T = S.training;
    const items = [
      { id: "tel", text: "Numéro de la maternité enregistré", done: !!telOf(), link: "#/mat" },
      { id: "consignes", text: "Consignes de départ demandées à la maternité", hint: "« Quand devons-nous venir ? » Note leur réponse dans l'onglet Maternité.", manual: true, link: "#/questions" },
      { id: "trajet", text: "Trajet repéré, de nuit aussi", hint: "Entrée de nuit, parking, temps de route. Enregistre l'adresse pour lancer l'itinéraire en un geste.", manual: true, link: "#/mat" },
      { id: "sac", text: `Sac de maternité prêt (${bagDone}/${bagTotal})`, done: bagDone >= bagTotal * 0.8, link: "#/bag" },
      { id: "train", text: `Deux séances d'entraînement à deux (${Math.min(2, T.sessions || 0)}/2)`, done: (T.sessions || 0) >= 2, link: "#/train" },
      { id: "likes", text: `Trois positions qu'elle aime ❤️ (${Math.min(3, likes)}/3)`, done: likes >= 3, link: "#/phase/actif" },
      { id: "quiz", text: `Quiz réussi (${quizMin}/${C.quiz.length} ou plus)`, done: (T.quizBest || 0) >= quizMin, link: "#/train/quiz" },
      { id: "prefs", text: "Ses souhaits notés ensemble", done: prefsN >= 3, link: "#/prefs" },
      { id: "imprevus", text: "« Si ça ne se passe pas comme prévu » lu", done: !!S.ready.imprevus, link: "#/imprevus" },
      { id: "calme", text: "SOS calme essayé une fois (Et toi ?)", done: !!S.ready.calme, link: "#/calme" },
      { id: "relais", text: "Relais organisé", hint: "Qui garde les aînés ou les animaux ? Qui prévenir en premier ?", manual: true },
      { id: "install", text: "App installée sur l'écran d'accueil", hint: "Elle marche alors sans réseau. iPhone : Partager → « Sur l'écran d'accueil ». Android : menu ⋮ → « Installer ».", done: installed, manual: !installed }
    ];
    items.forEach((it) => { if (it.manual) it.done = it.done || !!S.ready[it.id]; });
    return items;
  }
  function ring(pct, size = 64) {
    const r = 26, c = 2 * Math.PI * r;
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="${r}" style="fill:none;stroke:var(--surface-2);stroke-width:7"/>
      <circle cx="32" cy="32" r="${r}" transform="rotate(-90 32 32)" style="fill:none;stroke:var(${pct >= 100 ? "--good" : "--accent"});stroke-width:7;stroke-linecap:round;stroke-dasharray:${(c * pct / 100).toFixed(1)} ${c.toFixed(1)}"/>
      <text x="32" y="37" text-anchor="middle" style="fill:var(--text);font-size:15px;font-weight:800">${pct}%</text></svg>`;
  }
  function readyCard() {
    const items = readyItems(), done = items.filter((i) => i.done).length;
    const pct = Math.round(done / items.length * 100), due = dueInfo();
    const next = items.find((i) => !i.done);
    return `<a class="readycard" href="#/ready">
      ${ring(pct)}
      <span><strong>${due ? esc(due.short) + " · " : ""}${pct >= 100 ? "Vous êtes prêts 🤍" : "Êtes-vous prêts ?"}</strong><br>
      <span class="muted small">${next ? "À faire : " + esc(next.text) : "Tout est en place. Il n'y a plus qu'à être là."}</span></span>
      <span class="muted" aria-hidden="true">›</span></a>`;
  }
  function renderReady() {
    const items = readyItems(), done = items.filter((i) => i.done).length;
    const pct = Math.round(done / items.length * 100), due = dueInfo();
    view.innerHTML = `
      <div class="topbar">${backBtn("#/")}<h1>✅ Êtes-vous prêts ?</h1></div>
      <div class="readyhead">
        ${ring(pct, 96)}
        <div>
          ${due ? `<div class="countdown">${esc(due.short)}</div><div class="muted small">Terme prévu le ${esc(due.label)} (${esc(due.rel)})</div>` : `<div class="muted">Indique le terme prévu pour afficher le compte à rebours.</div>`}
          <div class="small" style="margin-top:4px">${done} / ${items.length} en place</div>
        </div>
      </div>
      ${due && due.days < 0 ? `<p class="muted small">Le terme est une estimation : beaucoup de bébés naissent après. Suis le calendrier de suivi donné par ta maternité.</p>` : ""}
      <label class="field"><span>Terme prévu (date donnée par la maternité)</span><input type="date" id="due" value="${esc(S.settings.dueDate || "")}"></label>
      <div id="ready">
        ${items.map((it) => `
          <div class="rdy ${it.done ? "done" : ""}">
            <button class="rbox" ${it.manual ? `data-id="${it.id}" aria-pressed="${!!it.done}" aria-label="Cocher"` : "disabled aria-hidden=\"true\""}>${it.done ? "✓" : ""}</button>
            <span class="lbl"><strong>${esc(it.text)}</strong>${it.hint && !it.done ? `<br><span class="muted small">${esc(it.hint)}</span>` : ""}</span>
            ${it.link && !it.done ? `<a class="btn" href="${it.link}">Y aller</a>` : ""}
          </div>`).join("")}
      </div>
      <p class="muted small" style="margin-top:14px">Les cases rondes se cochent toutes seules quand c'est fait dans l'app ; les autres, c'est toi qui les coches.</p>
    `;
    $("#due").addEventListener("change", (e) => { S.settings.dueDate = e.target.value; save(); go(renderReady); });
    $("#ready").onclick = (e) => {
      const b = e.target.closest("[data-id]"); if (!b) return;
      S.ready[b.dataset.id] = !S.ready[b.dataset.id]; save(); vibrate(20);
      const y = window.scrollY; go(renderReady); window.scrollTo(0, y);
    };
  }

  // ---------- Si ça ne se passe pas comme prévu ----------
  function renderUnexpected(openId) {
    if (!S.ready.imprevus) { S.ready.imprevus = true; save(); }
    const tel = telOf();
    view.innerHTML = `
      <div class="topbar">${backBtn("#/")}<h1>🧭 Si ça ne se passe pas comme prévu</h1></div>
      <p class="muted small">À lire <strong>avant</strong> le jour J, pour ne pas le découvrir sur le moment. Informations générales : l'équipe vous expliquera ce qui se passe pour vous.</p>
      ${C.unexpected.map((u) => `
        <details class="acc ${u.urgent ? "urgent" : ""}" ${u.id === openId ? "open" : ""}>
          <summary><span class="em">${u.emoji}</span><span>${esc(u.title)}</span></summary>
          <p class="muted">${esc(u.intro)}</p>
          <ul class="afterlist">${u.items.map((it) => `<li>${esc(it)}</li>`).join("")}</ul>
          ${u.say ? `<div class="box say"><strong>💬 Dis-lui</strong><br>« ${esc(u.say)} »</div>` : ""}
          ${u.urgent ? `<div class="row" style="margin:10px 0 4px"><a class="btn danger" href="tel:15">🚑 Appeler le 15</a>${tel ? `<a class="btn" href="tel:${esc(tel)}">📞 Maternité</a>` : ""}</div>` : ""}
        </details>`).join("")}
      <p class="muted small" style="margin-top:16px">Quoi qu'il arrive : ta présence calme est ce qui compte le plus pour elle. Et vous aurez le droit d'en reparler après, avec l'équipe.</p>
    `;
  }

  // ---------- Faire-part en image ----------
  let cardPhoto = null; // image choisie : gardée en mémoire le temps de la session, jamais envoyée
  const CARD_THEMES = {
    nuit: { bg: ["#1b1524", "#33243b"], ink: "#f6ece6", soft: "#b9aabd", accent: "#f0a58a" },
    aube: { bg: ["#fdf6ee", "#f6d9c9"], ink: "#3b2a33", soft: "#8d727b", accent: "#d56f52" },
    sauge: { bg: ["#f3f5ee", "#cfdcc9"], ink: "#27352c", soft: "#66786b", accent: "#4f7d62" }
  };
  function cardData() {
    const b = lastEvent("naissance"), B = S.baby;
    const d = b ? new Date(b.t) : new Date();
    return {
      name: B.prenom || "Prénom", born: born(),
      date: d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      time: (B.heure || clock(d.getTime())).replace(/^(\d{1,2}):(\d{2})$/, (m, h, mi) => `${+h} h ${mi}`),
      extra: [B.poids, B.taille].filter(Boolean).join("  ·  "),
      sign: B.sign || "", theme: CARD_THEMES[B.theme] ? B.theme : "nuit", brand: B.brand !== false
    };
  }
  function drawCard(cv) {
    const o = cardData(), T = CARD_THEMES[o.theme];
    const W = 1080, H = 1350, x = cv.getContext("2d");
    cv.width = W; cv.height = H;
    const g = x.createLinearGradient(0, 0, W * 0.4, H);
    g.addColorStop(0, T.bg[0]); g.addColorStop(1, T.bg[1]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // Semis discret (pseudo-aléatoire fixe : la carte ne change pas d'un rendu à l'autre)
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    x.fillStyle = T.accent;
    for (let k = 0; k < 70; k++) {
      const px = rnd() * W, py = rnd() * H, r = 1.5 + rnd() * 4.5;
      x.globalAlpha = 0.08 + rnd() * 0.22;
      x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
    }
    x.globalAlpha = 1;
    x.strokeStyle = T.accent; x.globalAlpha = 0.45; x.lineWidth = 3;
    x.strokeRect(44, 44, W - 88, H - 88);
    x.globalAlpha = 1;
    x.textAlign = "center"; x.textBaseline = "alphabetic";
    const sans = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', serif = 'Georgia, "Times New Roman", serif';
    const spaced = (t, y, px, color) => {
      x.font = `600 ${px}px ${sans}`; x.fillStyle = color;
      try { x.letterSpacing = "10px"; } catch (e) {}
      x.fillText(t, W / 2 + 5, y);
      try { x.letterSpacing = "0px"; } catch (e) {}
    };
    spaced("BIENVENUE", 150, 34, T.soft);
    let y;
    if (cardPhoto) {
      const cx = W / 2, cy = 450, r = 250;
      x.save(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.clip();
      const iw = cardPhoto.naturalWidth || cardPhoto.width, ih = cardPhoto.naturalHeight || cardPhoto.height;
      const sc = Math.max(2 * r / iw, 2 * r / ih);
      x.drawImage(cardPhoto, cx - iw * sc / 2, cy - ih * sc / 2, iw * sc, ih * sc);
      x.restore();
      x.strokeStyle = T.accent; x.lineWidth = 8; x.beginPath(); x.arc(cx, cy, r + 14, 0, 7); x.stroke();
      y = 870;
    } else {
      // Petit croissant de lune, clin d'œil à la nuit de la naissance
      x.fillStyle = T.accent; x.beginPath(); x.arc(W / 2, 330, 62, 0, 7); x.fill();
      x.fillStyle = T.bg[0]; x.beginPath(); x.arc(W / 2 + 30, 312, 56, 0, 7); x.fill();
      y = 640;
    }
    let size = 150;
    do { x.font = `${size}px ${serif}`; size -= 6; } while (x.measureText(o.name).width > W - 200 && size > 50);
    x.fillStyle = T.ink; x.fillText(o.name, W / 2, y);
    x.fillStyle = T.accent; x.fillRect(W / 2 - 50, y + 44, 100, 4);
    x.font = `44px ${sans}`; x.fillStyle = T.ink;
    x.fillText(`${o.born} le ${o.date}`, W / 2, y + 130);
    x.fillText(`à ${o.time}`, W / 2, y + 192);
    if (o.extra) { x.font = `40px ${sans}`; x.fillStyle = T.soft; x.fillText(o.extra, W / 2, y + 268); }
    if (o.sign) {
      let ss = 50;
      do { x.font = `italic ${ss}px ${serif}`; ss -= 3; } while (x.measureText(o.sign).width > W - 220 && ss > 28);
      x.fillStyle = T.ink; x.fillText(o.sign, W / 2, H - 150);
    }
    if (o.brand) { x.globalAlpha = 0.55; x.font = `24px ${sans}`; x.fillStyle = T.soft; x.fillText("Je suis là", W / 2, H - 76); x.globalAlpha = 1; }
  }
  function renderCard() {
    const B = S.baby, b = lastEvent("naissance");
    view.innerHTML = `
      <div class="topbar">${backBtn(b ? "#/birth" : "#/")}<h1>💌 Faire-part</h1></div>
      <p class="muted small">Une image prête à envoyer à la famille. ${b ? "" : "Aperçu : la date et l'heure se rempliront quand tu appuieras sur « Bébé est né ! ». "}La photo reste sur ton téléphone.</p>
      <canvas id="cv" class="cardcv" role="img" aria-label="Aperçu du faire-part"></canvas>
      <div class="row" style="margin-top:12px">
        <button class="btn primary" id="shareCard">Envoyer…</button>
        <button class="btn" id="saveCard">Enregistrer</button>
      </div>
      <label class="btn block" style="margin-top:10px">📷 ${cardPhoto ? "Changer la photo" : "Ajouter une photo"}<input type="file" id="photo" accept="image/*" hidden></label>
      ${cardPhoto ? `<button class="btn block" id="noPhoto" style="margin-top:8px;min-height:44px">Retirer la photo</button>` : ""}
      <span class="muted small" style="display:block;margin-top:14px">Style</span>
      <div class="seg" id="theme">
        ${[["nuit", "Nuit"], ["aube", "Aube"], ["sauge", "Sauge"]].map(([v, l]) => `<button data-v="${v}" aria-pressed="${(CARD_THEMES[B.theme] ? B.theme : "nuit") === v}">${l}</button>`).join("")}
      </div>
      ${sexSeg()}
      <div class="grid2">
        <label class="field"><span>Prénom</span><input type="text" data-b="prenom" value="${esc(B.prenom || "")}"></label>
        <label class="field"><span>Heure</span><input type="text" data-b="heure" value="${esc(B.heure || "")}" placeholder="${clock(b ? b.t : Date.now())}"></label>
        <label class="field"><span>Poids</span><input type="text" data-b="poids" value="${esc(B.poids || "")}" placeholder="3,250 kg"></label>
        <label class="field"><span>Taille</span><input type="text" data-b="taille" value="${esc(B.taille || "")}" placeholder="50 cm"></label>
      </div>
      <label class="field"><span>Signature</span><input type="text" data-b="sign" value="${esc(B.sign || "")}" placeholder="Vos deux prénoms" maxlength="60"></label>
      <button class="toggle" id="brand" aria-pressed="${B.brand !== false}"><span><strong>Mention « Je suis là »</strong><br><span class="muted small">Discrète, en bas de la carte</span></span><span class="switch"></span></button>
    `;
    const cv = $("#cv");
    const redraw = () => { try { drawCard(cv); } catch (e) {} };
    redraw();
    view.querySelectorAll("input[data-b]").forEach((el) => el.addEventListener("input", () => { S.baby[el.dataset.b] = el.value.trim(); save(); redraw(); }));
    bindSexSeg(redraw);
    $("#theme").onclick = (e) => {
      const t = e.target.closest("button"); if (!t) return;
      S.baby.theme = t.dataset.v; save();
      [...$("#theme").children].forEach((k) => k.setAttribute("aria-pressed", String(k === t)));
      redraw();
    };
    $("#brand").onclick = (e) => {
      S.baby.brand = S.baby.brand === false; save();
      e.currentTarget.setAttribute("aria-pressed", String(S.baby.brand)); redraw();
    };
    $("#photo").addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const img = new Image(), url = URL.createObjectURL(f);
      img.onload = () => { URL.revokeObjectURL(url); cardPhoto = img; go(renderCard); };
      img.onerror = () => { URL.revokeObjectURL(url); toast("Cette image ne peut pas être lue."); };
      img.src = url;
    });
    const np = $("#noPhoto"); if (np) np.onclick = () => { cardPhoto = null; go(renderCard); };
    const blobOf = () => new Promise((res) => cv.toBlob(res, "image/jpeg", 0.92));
    const fname = () => `faire-part-${(S.baby.prenom || "bebe").toLowerCase().replace(/[^a-z0-9àâäéèêëîïôöùûüç]+/gi, "-")}.jpg`;
    $("#shareCard").onclick = async () => { const bl = await blobOf(); if (bl) shareFile(bl, fname()); };
    $("#saveCard").onclick = async () => {
      const bl = await blobOf(); if (!bl) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(bl); a.download = fname();
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    };
  }

  // ---------- Démarches après la naissance ----------
  // Jours fériés français (métropole) : fixes + Pâques, Ascension, Pentecôte
  function isHoliday(d) {
    const y = d.getFullYear(), key = (m, day) => `${m}-${day}`;
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, dd = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - dd - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const easter = new Date(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
    const off = (n) => { const x = new Date(easter); x.setDate(x.getDate() + n); return key(x.getMonth() + 1, x.getDate()); };
    const set = new Set(["1-1", "5-1", "5-8", "7-14", "8-15", "11-1", "11-11", "12-25", off(1), off(39), off(50)]);
    return set.has(key(d.getMonth() + 1, d.getDate()));
  }
  // Délai en jours après la naissance (le jour de la naissance ne compte pas) ;
  // s'il finit un samedi, un dimanche ou un jour férié, il est reporté au jour ouvrable suivant.
  function deadline(birthMs, days) {
    const d = midnight(birthMs);
    d.setDate(d.getDate() + days);
    while (d.getDay() === 0 || d.getDay() === 6 || isHoliday(d)) d.setDate(d.getDate() + 1);
    return d;
  }
  function renderTodo() {
    const b = lastEvent("naissance");
    const items = C.admin.items, done = items.filter((it) => S.todo[it.id]).length;
    view.innerHTML = `
      <div class="topbar">${backBtn(b ? "#/birth" : "#/")}<h1>🗂️ Démarches</h1></div>
      <div class="progress"><div style="width:${Math.round(done / items.length * 100)}%"></div></div>
      <p class="muted small">${done} / ${items.length} faites. ${esc(C.admin.note)}</p>
      <div id="todo">
        ${items.map((it) => {
          let when = "";
          if (it.deadlineDays) {
            if (b) {
              const d = deadline(b.t, it.deadlineDays), left = Math.round((d - midnight(Date.now())) / DAY);
              when = `<span class="due ${left <= 1 && !S.todo[it.id] ? "soon" : ""}">Au plus tard ${longDate(d)}${S.todo[it.id] ? "" : left > 1 ? ` (dans ${left} jours)` : left === 1 ? " (demain)" : left === 0 ? " (aujourd'hui)" : " (délai dépassé : contacte la mairie)"}</span>`;
            } else when = `<span class="due">Dans les ${it.deadlineDays} jours après la naissance : la date s'affichera ici.</span>`;
          }
          return `<button class="check tall" data-id="${it.id}" aria-pressed="${!!S.todo[it.id]}">
            <span class="box2">${S.todo[it.id] ? "✓" : ""}</span>
            <span><span class="lbl"><strong>${esc(it.title)}</strong></span>${when}<span class="muted small" style="display:block">${esc(it.detail)}</span></span>
          </button>`;
        }).join("")}
      </div>
    `;
    $("#todo").onclick = (e) => {
      const t = e.target.closest(".check"); if (!t) return;
      S.todo[t.dataset.id] = !S.todo[t.dataset.id]; save(); vibrate(20);
      const y = window.scrollY; go(renderTodo); window.scrollTo(0, y);
    };
  }

  // ---------- Listes à cocher simples (départ, questions, photos) ----------
  function renderList(key, back) {
    const L = C.lists[key], store = S.lists[key] || (S.lists[key] = {});
    const done = L.items.filter((it, i) => store[i]).length;
    const tel = telOf();
    view.innerHTML = `
      <div class="topbar">${backBtn(back || "#/")}<h1>${esc(L.title)}</h1></div>
      <p class="muted small">${esc(L.intro)}</p>
      ${key === "depart" ? `
        ${tel ? `<a class="btn primary block" href="tel:${esc(tel)}">📞 Prévenir ${esc(S.settings.mName || "la maternité")} de votre arrivée</a>` : ""}
        ${routeUrl() ? `<a class="btn block" href="${esc(routeUrl())}" target="_blank" rel="noopener" style="margin-top:10px">🗺️ Lancer l'itinéraire</a>` : ""}
        ${S.settings.access ? `<div class="box"><strong>🚪 Accès</strong><br>${esc(S.settings.access)}</div>` : ""}` : ""}
      <div class="progress" style="margin-top:12px"><div style="width:${Math.round(done / L.items.length * 100)}%"></div></div>
      <div id="list">
        ${L.items.map((it, i) => `<button class="check" data-i="${i}" aria-pressed="${!!store[i]}"><span class="box2">${store[i] ? "✓" : ""}</span><span class="lbl">${esc(it)}</span></button>`).join("")}
      </div>
      ${key === "depart" ? `<a class="btn block" href="#/msg" style="margin-top:10px">📱 Prévenir les proches</a>
        <p class="muted small center" style="margin-top:12px">Roule calmement : arriver trois minutes plus tard ne change rien.</p>` : ""}
      ${key === "questions" ? `<a class="btn block" href="#/mat" style="margin-top:10px">📞 Noter leurs réponses dans l'onglet Maternité</a>` : ""}
      ${done ? `<button class="btn block" id="lreset" style="margin-top:10px;min-height:44px">↻ Tout décocher</button>` : ""}
    `;
    $("#list").onclick = (e) => {
      const b = e.target.closest(".check"); if (!b) return;
      store[b.dataset.i] = !store[b.dataset.i]; save(); vibrate(20);
      const y = window.scrollY; go(renderList, key, back); window.scrollTo(0, y);
    };
    const r = $("#lreset"); if (r) r.onclick = () => { S.lists[key] = {}; save(); go(renderList, key, back); };
  }

  // ---------- Carnet des premiers jours : tétées, biberons, couches ----------
  // Un simple carnet : aucun seuil, aucune interprétation. C'est l'équipe qui dit ce qui est attendu.
  let logOffset = 0; // « c'était il y a… » (minutes)
  const LOGT = {
    tg: { emoji: "🤱", label: "Sein gauche", feed: 1 }, td: { emoji: "🤱", label: "Sein droit", feed: 1 },
    bib: { emoji: "🍼", label: "Biberon", feed: 1 }, pipi: { emoji: "💧", label: "Pipi" }, selle: { emoji: "💩", label: "Selle" }
  };
  function logSummary() {
    const since = Date.now() - DAY, r = S.log.filter((e) => e.t >= since);
    const n = (f) => r.filter(f).length;
    const lastFeed = [...S.log].reverse().find((e) => LOGT[e.type] && LOGT[e.type].feed);
    const lines = [`Sur les dernières 24 h : ${n((e) => e.type === "tg" || e.type === "td")} tétée(s), ${n((e) => e.type === "bib")} biberon(s), ${n((e) => e.type === "pipi")} pipi(s), ${n((e) => e.type === "selle")} selle(s).`];
    if (lastFeed) lines.push(`Dernier repas : ${LOGT[lastFeed.type].label.toLowerCase()} à ${clock(lastFeed.t)}.`);
    return lines;
  }
  function renderLog() {
    const now = Date.now(), since = now - DAY;
    const r = S.log.filter((e) => e.t >= since);
    const n = (f) => r.filter(f).length;
    const lastFeed = [...S.log].reverse().find((e) => LOGT[e.type] && LOGT[e.type].feed);
    const lastBreast = [...S.log].reverse().find((e) => e.type === "tg" || e.type === "td");
    const dayLabel = (t) => { const d = Math.round((midnight(now) - midnight(t)) / DAY); return d === 0 ? "Aujourd'hui" : d === 1 ? "Hier" : longDate(t); };
    let prevDay = "";
    const rows = S.log.map((e, i) => ({ e, i })).filter((x) => LOGT[x.e.type]).reverse().slice(0, 60).map(({ e, i }) => {
      const dl = dayLabel(e.t), head = dl !== prevDay ? `<li class="day">${esc(dl)}</li>` : "";
      prevDay = dl;
      return `${head}<li><span>${clock(e.t)}</span><span>${LOGT[e.type].emoji} ${LOGT[e.type].label}</span><button class="x" data-del="${i}" aria-label="Supprimer">×</button></li>`;
    }).join("");
    view.innerHTML = `
      <div class="topbar">${backBtn("#/")}<h1>📒 Carnet des premiers jours</h1></div>
      <p class="muted small">La sage-femme va te demander : « Combien de tétées ? De couches mouillées ? » La nuit, à deux, on ne sait plus. Un geste et c'est noté.</p>
      ${lastFeed ? `<div class="banner"><strong>Dernier repas il y a<span data-since="${lastFeed.t}"></span></strong> · ${LOGT[lastFeed.type].label.toLowerCase()} à ${clock(lastFeed.t)}${lastBreast ? `<br><span class="muted small">Dernier sein donné : ${lastBreast.type === "tg" ? "gauche" : "droit"}</span>` : ""}</div>` : ""}
      <div class="seg" id="off" style="margin-top:12px">
        ${[[0, "Maintenant"], [15, "Il y a 15 min"], [30, "30 min"], [60, "1 h"]].map(([v, l]) => `<button data-v="${v}" aria-pressed="${logOffset === v}">${l}</button>`).join("")}
      </div>
      <div class="grid2" id="logb" style="margin-top:10px">
        ${Object.entries(LOGT).map(([id, t]) => `<button class="btn ${id === "bib" ? "" : ""}" data-t="${id}">${t.emoji} ${t.label}</button>`).join("")}
      </div>
      <h2>Depuis 24 h</h2>
      <div class="stats">
        <div class="stat"><b>${n((e) => LOGT[e.type] && LOGT[e.type].feed)}</b><span>tétées / biberons</span></div>
        <div class="stat"><b>${n((e) => e.type === "pipi")}</b><span>pipis</span></div>
        <div class="stat"><b>${n((e) => e.type === "selle")}</b><span>selles</span></div>
      </div>
      ${S.log.length ? `<button class="btn block" id="copyLog" style="margin-top:10px;min-height:44px">Copier le résumé pour la sage-femme</button>
        <ul class="journal">${rows}</ul>` : `<p class="muted center" style="margin-top:16px">Rien de noté pour l'instant.</p>`}
      <p class="muted small">Ce carnet ne fait que compter. C'est l'équipe ou la sage-femme qui vous dit ce qui est attendu pour votre bébé ; au moindre doute, on les appelle.</p>
    `;
    $("#off").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; logOffset = +b.dataset.v; go(renderLog); };
    $("#logb").onclick = (e) => {
      const b = e.target.closest("[data-t]"); if (!b) return;
      S.log.push({ t: Date.now() - logOffset * MIN, type: b.dataset.t });
      S.log.sort((x, y) => x.t - y.t);
      if (S.log.length > 1500) S.log = S.log.slice(-1500);
      logOffset = 0; save(); vibrate(30); go(renderLog);
      toast(`${LOGT[b.dataset.t].emoji} ${LOGT[b.dataset.t].label} : noté`);
    };
    view.querySelectorAll("[data-del]").forEach((b) => b.onclick = () => { S.log.splice(+b.dataset.del, 1); save(); go(renderLog); });
    const cp = $("#copyLog");
    if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(logSummary().join("\n")); cp.textContent = "Copié ✓"; } catch (e) { cp.textContent = "Copie impossible"; } };
  }

  // ---------- Écran « Version complète » ----------
  function renderPro() {
    if (!CFG.paywall || S.license) {
      view.innerHTML = `
        <div class="topbar">${backBtn("#/")}<h1>Version complète</h1></div>
        <p>✓ Tout est débloqué. Merci 🤍</p>`;
      return;
    }
    const total = C.positions.length;
    view.innerHTML = `
      <div class="topbar">${backBtn("#/")}<h1>Version complète</h1></div>
      <img class="picto home" src="${IMG()}accueil${MOTION ? "" : "-still"}.svg" alt="">
      <div class="box">
        <ul style="margin:0;padding-left:20px;line-height:1.8">
          <li>Les <strong>${total} positions et gestes</strong>, phase par phase</li>
          <li>Toutes les positions <strong>sous péridurale</strong></li>
          <li>Le <strong>mode coach</strong> : guidé${G("", "e")} pendant chaque contraction, rappels entre deux</li>
          <li><strong>Ses souhaits</strong> à montrer à l'équipe en un geste</li>
          <li>Toutes les <strong>phrases qui aident</strong> et celles à éviter</li>
          <li>Les futures mises à jour incluses</li>
        </ul>
      </div>
      ${CFG.checkoutUrl
        ? `<a class="btn primary block" href="${esc(CFG.checkoutUrl)}" target="_blank" rel="noopener" style="min-height:64px;font-size:1.1em">Débloquer pour ${esc(CFG.price)}</a>`
        : `<div class="banner warn">Le paiement sera bientôt disponible.</div>`}
      <p class="muted small" style="text-align:center">Achat unique. Pas d'abonnement, pas de pub, pas de compte.<br>Tu reçois une clé par e-mail : colle-la ci-dessous.</p>

      <h2>J'ai une clé</h2>
      <label class="field"><span>Clé de licence (reçue par e-mail)</span>
        <input type="text" id="key" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"></label>
      <button class="btn block" id="activate">Activer</button>
      <p id="msg" class="small" role="status"></p>

      <div class="box" style="margin-top:20px;border-left:4px solid var(--good)">
        <strong>🤍 Promesse jour J</strong><br>
        <span class="muted small">On ne te demandera jamais de payer pendant un accouchement : dès que tu notes des contractions régulières dans le minuteur, tout se débloque automatiquement pendant 24 h. Le minuteur, le journal, la respiration, « Montre-moi », le sac de maternité, les messages aux proches et les signes d'alerte sont toujours gratuits.</span>
      </div>
    `;
    const btn = $("#activate"), msg = $("#msg");
    btn.onclick = async () => {
      const key = $("#key").value.trim();
      if (key.length < 8) { msg.textContent = "Colle la clé reçue par e-mail."; return; }
      btn.disabled = true; btn.textContent = "Vérification…"; msg.textContent = "";
      try {
        const res = await fetch(CFG.activateEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          S.license = { key, at: Date.now() }; save();
          msg.textContent = "✓ Activée ! Merci 🤍";
          setTimeout(() => { location.hash = "#/"; }, 900);
        } else {
          msg.textContent = data.error || (res.status >= 500 || res.status === 404 || res.status === 501
            ? "Vérification impossible pour le moment. Réessaie plus tard."
            : "Clé non reconnue. Vérifie-la ou écris-nous.");
        }
      } catch (e) {
        msg.textContent = "Pas de réseau. L'activation demande une connexion, une seule fois.";
      }
      btn.disabled = false; btn.textContent = "Activer";
    };
  }

  // ---------- Mots & check-list ----------
  function renderWords() {
    view.innerHTML = `
      <h1>💬 Quoi lui dire</h1>
      <p class="muted small">Peu de mots pendant la contraction. Voix basse, lente.</p>
      <ul class="say">${(isPro() ? C.say : C.say.slice(0, CFG.freeSay || 3)).map((s) => `<li>« ${esc(s)} »</li>`).join("")}</ul>
      <h2>Ses mots à elle</h2>
      <p class="muted small">Demande-lui, avant le jour J : « Qu'est-ce que tu voudras entendre ? » Ses phrases passeront en premier dans le mode coach.</p>
      ${(S.words || []).length ? `<ul class="say own">${S.words.map((w, i) => `<li><span>« ${esc(w)} »</span><button class="x" data-delw="${i}" aria-label="Supprimer">×</button></li>`).join("")}</ul>` : ""}
      ${(S.words || []).length < 8 ? `<div class="addrow"><input type="text" id="neww" maxlength="80" placeholder="Pense à la plage de cet été…"><button class="btn" id="addw">Ajouter</button></div>` : ""}
      ${isPro() ? `
      <h2>À éviter</h2>
      <ul class="avoid">${C.avoid.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : lockCard("Toutes les phrases + ce qu'il vaut mieux éviter")}
      <h2>Prendre soin d'elle (et de toi)</h2>
      <div id="checks">
        ${C.checklist.map((c) => `
          <button class="check" data-id="${c.id}" aria-pressed="${!!S.checks[c.id]}">
            <span class="box2">${S.checks[c.id] ? "✓" : ""}</span><span class="lbl">${esc(c.text)}</span>
          </button>`).join("")}
      </div>
      <button class="btn block" id="reset" style="margin-top:8px">↻ Tout décocher</button>
    `;
    $("#checks").onclick = (e) => {
      const b = e.target.closest(".check"); if (!b) return;
      const id = b.dataset.id;
      S.checks[id] = !S.checks[id]; save();
      b.setAttribute("aria-pressed", String(S.checks[id]));
      b.querySelector(".box2").textContent = S.checks[id] ? "✓" : "";
    };
    $("#reset").onclick = () => { S.checks = {}; save(); go(renderWords); };
    const addw = $("#addw");
    if (addw) {
      const add = () => { const v = $("#neww").value.trim(); if (!v) return; S.words = [...(S.words || []), v]; save(); go(renderWords); };
      addw.onclick = add;
      $("#neww").addEventListener("keydown", (e) => { if (e.key === "Enter") add(); });
    }
    view.querySelectorAll("[data-delw]").forEach((b) => b.onclick = () => { S.words.splice(+b.dataset.delw, 1); save(); go(renderWords); });
  }

  // ---------- Et toi ? Garder ton calme ----------
  // SOS 60 s : une consigne toutes les 12 s, respiration lente (4 s / 6 s) en fond.
  function renderCalm(openId) {
    const K = C.calm, STEP = 12000, TOTAL = K.sos.length * STEP, IN = 4, OUT = 6;
    view.innerHTML = `
      <div class="topbar">${backBtn(inLabour() ? "#/coach" : "#/")}<h1>🧘 Et toi ?</h1></div>
      <p class="muted small">${esc(K.intro)}</p>
      <div class="box you" id="sosbox">
        <strong>🆘 SOS : 60 secondes pour retrouver ton calme</strong>
        <div class="coach-breath" id="sosrun" hidden>
          <div class="cwrap"><div class="circle sm" id="circle"></div></div>
          <div class="breathe-label" id="lbl"></div>
        </div>
        <p id="sosstep" style="font-size:1.15em;margin:8px 0">Stress qui monte, mains qui tremblent, envie de fuir : c'est normal. Une minute, et tu y retournes.</p>
        <div class="sosbar" id="sosbar" hidden><span id="sosfill"></span></div>
        <button class="btn primary block" id="sosgo" style="margin-top:10px">▶ Démarrer</button>
      </div>
      <h2>Dis-toi</h2>
      <ul class="say">${K.selfTalk.map((s) => `<li>« ${esc(s)} »</li>`).join("")}</ul>
      ${K.sections.map((s) => `
        <details class="acc" ${s.id === openId ? "open" : ""}>
          <summary><span class="em">${s.emoji}</span><span>${esc(s.title)}</span></summary>
          ${s.intro ? `<p class="muted">${esc(s.intro)}</p>` : ""}
          <ul class="afterlist">${s.items.map((it) => `<li>${esc(it)}</li>`).join("")}</ul>
        </details>`).join("")}
      <a class="btn block" href="#/imprevus/toi" style="margin-top:10px">😵‍💫 Si tu te sens mal (malaise, vertige)</a>
      <p class="muted small" style="margin-top:16px">Prendre soin de toi, ce n'est pas l'abandonner : c'est tenir jusqu'au bout, pour elle.</p>
    `;
    const go_ = $("#sosgo"), run = $("#sosrun"), stepEl = $("#sosstep"), bar = $("#sosbar"), fill = $("#sosfill");
    const circle = $("#circle"), lbl = $("#lbl");
    let t0 = 0, iv = null, bt = null, lastStep = -1;
    const breathe = () => {
      lbl.textContent = "Inspire…"; circle.style.transitionDuration = IN + "s"; circle.style.transform = "scale(var(--grow, 1.8))";
      bt = setTimeout(() => {
        lbl.textContent = "Expire… longuement"; circle.style.transitionDuration = OUT + "s"; circle.style.transform = "scale(1)";
        bt = setTimeout(breathe, OUT * 1000);
      }, IN * 1000);
    };
    function stop(done) {
      clearInterval(iv); clearTimeout(bt); iv = null; keepAwake(false);
      try { speechSynthesis.cancel(); } catch (e) {}
      run.hidden = true; bar.hidden = true;
      circle.style.transitionDuration = "1s"; circle.style.transform = "scale(1)";
      go_.textContent = done ? "↻ Encore une minute" : "▶ Démarrer";
      if (done) {
        stepEl.textContent = G("Tu es prêt. Retourne près d'elle : ta main, ta voix lente.", "Tu es prête. Retourne près d'elle : ta main, ta voix lente.");
        vibrate([40, 80, 40]);
        if (!S.ready.calme) { S.ready.calme = true; save(); }
      }
    }
    go_.onclick = () => {
      if (iv) return stop(false);
      t0 = Date.now(); lastStep = -1;
      run.hidden = false; bar.hidden = false; go_.textContent = "■ Arrêter";
      keepAwake(true); breathe();
      const upd = () => {
        const el = Date.now() - t0;
        if (el >= TOTAL) return stop(true);
        fill.style.width = (el / TOTAL * 100).toFixed(1) + "%";
        const i = Math.floor(el / STEP);
        if (i !== lastStep) { lastStep = i; stepEl.textContent = K.sos[i]; speak(K.sos[i]); vibrate(20); }
      };
      upd(); iv = setInterval(upd, 250);
    };
    cleanup = () => { if (iv) stop(false); };
  }

  // ---------- Maternité & réglages ----------
  function renderMat() {
    const st = S.settings;
    const tel = st.phone.replace(/[^\d+]/g, "");
    view.innerHTML = `
      <h1>📞 Maternité</h1>
      ${tel
        ? `<a class="btn primary block" href="tel:${esc(tel)}" style="min-height:72px;font-size:1.15em">📞 Appeler ${esc(st.mName || "la maternité")}</a>`
        : `<div class="banner warn">Enregistre le numéro de ta maternité ci-dessous, maintenant, pour ne pas le chercher le jour J.</div>`}
      <a class="btn block danger" href="tel:15" style="margin-top:10px">🚑 Urgence : 15</a>
      ${routeUrl() ? `<a class="btn block" href="${esc(routeUrl())}" target="_blank" rel="noopener" style="margin-top:10px">🗺️ Itinéraire vers ${esc(st.mName || "la maternité")}</a>` : ""}
      ${st.access ? `<div class="box"><strong>🚪 Accès</strong><br>${esc(st.access)}</div>` : ""}
      <div class="grid2" style="margin-top:10px">
        <a class="btn" href="#/depart">🚗 Check-list départ</a>
        <a class="btn" href="#/questions">❓ Questions à poser</a>
      </div>
      ${eventAlert()}
      ${summaryCard()}
      <a class="btn block" href="#/msg" style="margin-top:10px">📱 Prévenir les proches</a>

      <h2>Appeler sans attendre si…</h2>
      <div class="box caution"><ul style="margin:0;padding-left:20px">${C.alerts.map((a) => `<li style="margin:6px 0">${esc(a)}</li>`).join("")}</ul></div>

      <h2>Consignes de ta maternité</h2>
      <label class="field"><span>Nom de la maternité</span><input type="text" id="mName" value="${esc(st.mName)}" placeholder="Maternité de…"></label>
      <label class="field"><span>Numéro (salle de naissance / urgences obstétricales)</span><input type="tel" id="phone" value="${esc(st.phone)}" placeholder="01 23 45 67 89"></label>

      <label class="field"><span>Adresse (pour lancer l'itinéraire en un geste)</span><input type="text" id="address" value="${esc(st.address)}" placeholder="12 rue de la Maternité, Ville" autocomplete="off"></label>
      <label class="field"><span>Accès : entrée de nuit, parking, étage…</span><input type="text" id="access" value="${esc(st.access)}" placeholder="La nuit : entrée des urgences, 2e étage" maxlength="200"></label>
      <label class="field"><span>Terme prévu</span><input type="date" id="due" value="${esc(st.dueDate || "")}"></label>

      <span class="muted small">C'est votre…</span>
      <div class="seg" id="first">
        <button data-v="1" aria-pressed="${st.first}">1er bébé</button>
        <button data-v="0" aria-pressed="${!st.first}">Bébé suivant</button>
      </div>
      <span class="muted small">Tu es…</span>
      <div class="seg" id="partner">
        <button data-v="m" aria-pressed="${!FEM()}">Son compagnon</button>
        <button data-v="f" aria-pressed="${FEM()}">Sa compagne</button>
      </div>
      <p class="muted small" style="margin-top:4px">Adapte les dessins et les accords (prêt / prête), ainsi que les démarches après la naissance.</p>
      <div class="row">
        <label class="field"><span>Contractions toutes les (min)</span><input type="number" id="intervalMin" min="1" max="30" value="${st.intervalMin}"></label>
        <label class="field"><span>depuis (heures)</span><input type="number" id="windowH" min="0.5" max="6" step="0.5" value="${st.windowH}"></label>
      </div>
      <p class="muted small">Valeurs pré-remplies = repère courant. <strong>Remplace-les par la consigne exacte de ta maternité.</strong> Le minuteur t'affichera un rappel quand ce repère sera atteint.</p>

      ${CFG.paywall ? `
      <h2>Version complète</h2>
      ${S.license
        ? `<p>✓ Activée. Merci pour ton soutien 🤍</p>`
        : `<a class="btn block" href="#/pro">🔓 Débloquer ou restaurer un achat</a>`}` : ""}

      <h2>Affichage</h2>
      <button class="toggle" id="red" aria-pressed="${!!st.red}">
        <span><strong>🔴 Mode nuit rouge</strong><br><span class="muted small">Lumière rouge et sombre : n'éblouit pas en salle de naissance</span></span><span class="switch"></span>
      </button>
      <button class="toggle" id="large" aria-pressed="${st.large}">
        <span><strong>Grand texte</strong></span><span class="switch"></span>
      </button>

      <h2>À savoir</h2>
      <p class="muted small">${esc(C.disclaimer)}</p>
      <p class="muted small">Toutes les données restent sur ce téléphone. Rien n'est envoyé.</p>

      <h2>Sauvegarde</h2>
      <p class="muted small">Un fichier avec tout ce que tu as noté (contractions, journal, souhaits, récit). À garder en souvenir, ou pour changer de téléphone.</p>
      <div class="row">
        <button class="btn" id="export">⬇️ Sauvegarder</button>
        <label class="btn">⬆️ Restaurer<input type="file" id="import" accept="application/json,.json" hidden></label>
      </div>
      <button class="btn danger block" id="wipe" style="margin-top:14px">Effacer toutes les données</button>
    `;

    bindSummary();
    const bind = (id, fn) => { const el = $("#" + id); el.addEventListener("change", () => { fn(el.value); save(); }); };
    bind("mName", (v) => { st.mName = v.trim(); });
    bind("phone", (v) => { st.phone = v.trim(); go(renderMat); });
    bind("address", (v) => { st.address = v.trim(); go(renderMat); });
    bind("access", (v) => { st.access = v.trim(); go(renderMat); });
    bind("due", (v) => { st.dueDate = v; });
    bind("intervalMin", (v) => { const n = parseFloat(v); if (n > 0) st.intervalMin = n; });
    bind("windowH", (v) => { const n = parseFloat(v); if (n > 0) st.windowH = n; });
    $("#first").onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      st.first = b.dataset.v === "1";
      if (st.first) { st.intervalMin = 5; st.windowH = 2; } else { st.intervalMin = 10; st.windowH = 1; }
      save(); go(renderMat);
    };
    $("#partner").onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      st.partner = b.dataset.v; save(); applyGender(); go(renderMat);
    };
    $("#red").onclick = () => { st.red = !st.red; save(); applyPrefs(); go(renderMat); };
    $("#large").onclick = () => { st.large = !st.large; save(); applyPrefs(); go(renderMat); };
    $("#export").onclick = () => {
      const blob = new Blob([JSON.stringify({ app: "je-suis-la", v: 1, at: Date.now(), state: S })], { type: "application/json" });
      const d = new Date();
      shareFile(blob, `je-suis-la-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`);
    };
    $("#import").addEventListener("change", async (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      try {
        const d = JSON.parse(await f.text());
        if (d.app !== "je-suis-la" || !d.state || !Array.isArray(d.state.contractions) || !Array.isArray(d.state.events)) throw new Error("format");
        toast(`Sauvegarde du ${new Date(d.at).toLocaleDateString("fr-FR")} : remplacer les données actuelles ?`, "Restaurer", () => {
          try { localStorage.setItem(KEY, JSON.stringify(d.state)); } catch (err) {}
          location.hash = "#/"; location.reload();
        });
      } catch (err) { toast("Ce fichier n'est pas une sauvegarde de l'app."); }
      e.target.value = "";
    });
    const wipe = $("#wipe");
    let armed = false;
    wipe.onclick = () => {
      if (!armed) { armed = true; wipe.textContent = "Appuie encore pour tout effacer"; setTimeout(() => { armed = false; if (wipe.isConnected) wipe.textContent = "Effacer toutes les données"; }, 3000); return; }
      try { localStorage.removeItem(KEY); } catch (e) {}
      location.hash = "#/"; location.reload();
    };
  }

  // ---------- Avertissement au premier lancement ----------
  function showDisclaimer() {
    if (S.accepted) return;
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<div class="card">
      <h2 style="margin-top:0">Avant de commencer</h2>
      <p>${esc(C.disclaimer)}</p>
      <p class="muted small">Contenu en cours de relecture par une sage-femme.</p>
      <button class="btn primary block" style="margin-top:12px">J'ai compris</button>
    </div>`;
    m.querySelector("button").onclick = () => { S.accepted = true; save(); m.remove(); showOnboarding(); };
    document.body.appendChild(m);
  }

  // ---------- Premier lancement : trois infos, et l'app est prête ----------
  function showOnboarding() {
    if (S.onboarded || !S.accepted) return;
    if (telOf() || S.settings.dueDate || S.contractions.length) { S.onboarded = true; save(); return; }
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<div class="card">
      <h2 style="margin-top:0">Quatre infos, et c'est prêt</h2>
      <p class="muted small">Tout reste sur ce téléphone. Tu pourras les changer dans l'onglet Maternité.</p>
      <span class="muted small">Tu es…</span>
      <div class="seg" id="obPartner"><button data-v="m" aria-pressed="true">Son compagnon</button><button data-v="f" aria-pressed="false">Sa compagne</button></div>
      <label class="field"><span>Terme prévu</span><input type="date" id="obDue"></label>
      <label class="field"><span>Numéro de la maternité (salle de naissance)</span><input type="tel" id="obTel" placeholder="01 23 45 67 89"></label>
      <span class="muted small">C'est votre…</span>
      <div class="seg" id="obFirst"><button data-v="1" aria-pressed="true">1er bébé</button><button data-v="0" aria-pressed="false">Bébé suivant</button></div>
      <button class="btn primary block" id="obOk" style="margin-top:14px">C'est parti</button>
      <button class="btn block" id="obSkip" style="margin-top:8px;min-height:44px">Plus tard</button>
    </div>`;
    let first = true;
    const seg = m.querySelector("#obFirst");
    seg.onclick = (e) => { const b = e.target.closest("button"); if (!b) return; first = b.dataset.v === "1"; [...seg.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b))); };
    let partner = "m";
    const pseg = m.querySelector("#obPartner");
    pseg.onclick = (e) => { const b = e.target.closest("button"); if (!b) return; partner = b.dataset.v; [...pseg.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b))); };
    const done = () => { S.onboarded = true; save(); applyGender(); m.remove(); router(); };
    m.querySelector("#obOk").onclick = () => {
      const st = S.settings;
      st.dueDate = m.querySelector("#obDue").value || ""; st.phone = m.querySelector("#obTel").value.trim();
      st.first = first; st.partner = partner;
      if (first) { st.intervalMin = 5; st.windowH = 2; } else { st.intervalMin = 10; st.windowH = 1; }
      done();
    };
    m.querySelector("#obSkip").onclick = done;
    document.body.appendChild(m);
  }

  // ---------- Routeur ----------
  function updateTabbar(tab) {
    if (tab) document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
    const last = S.contractions[S.contractions.length - 1];
    document.querySelectorAll('.tabbar a[data-tab="timer"], .tabbar a[data-tab="coach"]').forEach((a) => a.classList.toggle("recording", !!(last && last.e === null)));
  }

  function applyPrefs() {
    document.body.classList.toggle("large", !!S.settings.large);
    document.body.classList.toggle("red", !!S.settings.red);
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = S.settings.red ? "#000000" : "#14111a";
  }

  function router() {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    try { route(); } catch (e) { safeScreen(e); }
    tick();
  }
  function route() {
    const parts = (location.hash.slice(1) || "/").split("/").filter(Boolean);
    let tab = "home";
    if (parts[0] === "phase" && parts[2] === "pos") renderPos(parts[1], parts[3]);
    else if (parts[0] === "phase") renderPhase(parts[1]);
    else if (parts[0] === "timer") { tab = "timer"; renderTimer(); }
    else if (parts[0] === "breathe") { tab = "breathe"; renderBreathe(); }
    else if (parts[0] === "words") { tab = "words"; renderWords(); }
    else if (parts[0] === "calme") renderCalm(parts[1]);
    else if (parts[0] === "mat") { tab = "mat"; renderMat(); }
    else if (parts[0] === "pro") renderPro();
    else if (parts[0] === "coach") { tab = "coach"; renderCoach(); }
    else if (parts[0] === "show") { tab = "show"; renderShow(); }
    else if (parts[0] === "prefs") renderPrefs();
    else if (parts[0] === "bag") renderBag();
    else if (parts[0] === "msg") renderMsg();
    else if (parts[0] === "train" && parts[1] === "session") renderTrainSession();
    else if (parts[0] === "train" && parts[1] === "quiz") renderTrainQuiz();
    else if (parts[0] === "train") renderTrainHome();
    else if (parts[0] === "birth") renderBirth();
    else if (parts[0] === "after") renderAfter();
    else if (parts[0] === "ready") renderReady();
    else if (parts[0] === "imprevus") renderUnexpected(parts[1]);
    else if (parts[0] === "card") renderCard();
    else if (parts[0] === "todo") renderTodo();
    else if (parts[0] === "log") renderLog();
    else if (parts[0] === "depart") renderList("depart", "#/timer");
    else if (parts[0] === "questions") renderList("questions", "#/ready");
    else if (parts[0] === "photos") renderList("photos", lastEvent("naissance") ? "#/birth" : "#/");
    else renderHome();
    if (parts[0] !== "phase" || parts[2] !== "pos") window.scrollTo(0, 0);
    updateTabbar(tab);
    tick();
  }

  // Met à jour les compteurs [data-since] chaque seconde
  function tick() {
    const now = Date.now();
    document.querySelectorAll("[data-since]").forEach((el) => {
      const s = +el.dataset.since;
      el.textContent = s ? " " + dur(now - s) : "";
    });
    document.querySelectorAll("[data-nudge]").forEach((el) => {
      const late = now - +el.dataset.nudge > 45 * MIN;
      el.classList.toggle("warn", late);
      const n = el.querySelector(".nudge"); if (n) n.hidden = !late;
    });
  }

  window.addEventListener("hashchange", router);
  setInterval(tick, 1000);
  applyPrefs();
  router();
  showDisclaimer();
  showOnboarding();

  // Demande au navigateur de ne pas purger les données (récit, journal) s'il manque de place
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register("sw.js").catch(() => {});
    // Nouvelle version installée : on propose de recharger, sans jamais interrompre de force
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hadController) toast("Mise à jour installée.", "Recharger", () => location.reload());
    });
  }
})();
