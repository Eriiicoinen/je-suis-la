// Génère les pictogrammes SVG des positions dans app/img/ :
//   <id>.svg        version animée (fiches détaillées, page d'accueil)
//   <id>-still.svg  version fixe (vignettes des listes, mode « animations réduites »)
// Usage : node tools/gen-pictos.js
//
// Chaque pose est décrite par les articulations (tête, cou, bassin, coudes, mains, genoux, pieds).
// L'animation = une suite d'images clés exprimées en décalages (dx, dy) par articulation :
//   head, neck, hip, a0e/a0h (bras proche : coude/main), a1e/a1h (bras éloigné),
//   l0k/l0f (jambe proche : genou/pied), l1k/l1f (jambe éloignée), bellyK (taille du ventre).
// Elle = corail (avec ventre), partenaire = bleu, objets = gris, indications = jaune.
// Deux jeux : img/ (partenaire cheveux courts) et img/f/ (partenaire cheveux longs, réglage « Sa compagne »).

const fs = require("fs");
const path = require("path");

const W = "#f0a58a", P = "#9ec3dc", PROP = "#8d81a3", PROP_FILL = "#3a3048", MARK = "#f2c46d";
const OUT = path.join(__dirname, "..", "img");
fs.mkdirSync(OUT, { recursive: true });

const f = (n) => Math.round(n * 10) / 10;
const pt = (p) => `${f(p[0])},${f(p[1])}`;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const SPLINE = "0.45 0 0.55 1";

// ---------- Géométrie d'un personnage ----------
// Silhouette pleine : buste en capsule, membres épais, membres « du fond » dans une teinte
// plus sombre (opaque, pour éviter les superpositions marron), cheveux pour donner le sens du visage.
const SHADE = { [W]: "#b9735d", [P]: "#6f93ad" };
const HAIR = { [W]: "#7d4536", [P]: "#3f5d75" };
// Repère du corps : « up » = du bassin vers la tête, « n » = vers l'avant (côté ventre / mains)
function bodyFrame(d, hint) {
  const t = [d.hip[0] - d.neck[0], d.hip[1] - d.neck[1]];
  const len = Math.hypot(t[0], t[1]) || 1;
  let n = [-t[1] / len, t[0] / len];
  if (n[0] * hint[0] + n[1] * hint[1] < 0) n = [-n[0], -n[1]];
  return { up: [-t[0] / len, -t[1] / len], n, len };
}
const handsHint = (d) => {
  const h = [d.arms[0][1][0] + d.arms[1][1][0] - 2 * d.neck[0], d.arms[0][1][1] + d.arms[1][1][1] - 2 * d.neck[1]];
  return Math.hypot(h[0], h[1]) > 1 ? h : [1, 0];
};
let LONG_HAIR = false; // partenaire aux cheveux longs (jeu img/f/)
function figureEls(d, color, belly, hint) {
  const els = [];
  const { up, n, len } = bodyFrame(d, hint);
  const limb = (a, b, c, w, far) => els.push({ tag: "polyline", a: { points: `${pt(a)} ${pt(b)} ${pt(c)}`, fill: "none", stroke: far ? SHADE[color] : color, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round" } });
  limb(d.neck, d.arms[1][0], d.arms[1][1], 6.5, true);
  limb(d.hip, d.legs[1][0], d.legs[1][1], 8.5, true);
  els.push({ tag: "line", a: { x1: f(d.neck[0]), y1: f(d.neck[1]), x2: f(d.hip[0]), y2: f(d.hip[1]), stroke: color, "stroke-width": 14, "stroke-linecap": "round" } });
  if (belly) {
    const k = d.bellyK || 0.62;
    const A = lerp(d.neck, d.hip, 0.3), B = lerp(d.neck, d.hip, 0.98), M = lerp(d.neck, d.hip, 0.64);
    const Cp = [M[0] + n[0] * (len * k + 5), M[1] + n[1] * (len * k + 5)];
    els.push({ tag: "path", a: { d: `M${pt(A)} Q${pt(Cp)} ${pt(B)}`, fill: color, stroke: color, "stroke-width": 5, "stroke-linejoin": "round" } });
  }
  limb(d.hip, d.legs[0][0], d.legs[0][1], 8.5);
  limb(d.neck, d.arms[0][0], d.arms[0][1], 6.5);
  const H = d.head;
  if (!belly && LONG_HAIR) {
    // Cheveux mi-longs : une mèche qui tombe de l'arrière de la tête vers les épaules
    const a = [H[0] - n[0] * 7.5 + up[0] * 3, H[1] - n[1] * 7.5 + up[1] * 3], b = [H[0] - n[0] * 9.5 - up[0] * 13, H[1] - n[1] * 9.5 - up[1] * 13];
    els.push({ tag: "line", a: { x1: f(a[0]), y1: f(a[1]), x2: f(b[0]), y2: f(b[1]), stroke: HAIR[color], "stroke-width": 9, "stroke-linecap": "round" } });
  }
  if (belly) els.push({ tag: "circle", a: { cx: f(H[0] - n[0] * 10.5 + up[0] * 2), cy: f(H[1] - n[1] * 10.5 + up[1] * 2), r: 5.2, fill: HAIR[color] } });
  els.push({ tag: "circle", a: { cx: f(H[0] - n[0] * 2.6 + up[0] * 1.8), cy: f(H[1] - n[1] * 2.6 + up[1] * 1.8), r: belly || LONG_HAIR ? 11.2 : 10.6, fill: HAIR[color] } });
  els.push({ tag: "circle", a: { cx: f(H[0] + n[0] * 0.8 - up[0] * 0.6), cy: f(H[1] + n[1] * 0.8 - up[1] * 0.6), r: 9.8, fill: color } });
  return els;
}

// Applique des décalages à une pose
function move(b, dl) {
  const add = (p, k) => (dl[k] ? [p[0] + dl[k][0], p[1] + dl[k][1]] : p);
  return {
    ...b,
    head: add(b.head, "head"), neck: add(b.neck, "neck"), hip: add(b.hip, "hip"),
    arms: [[add(b.arms[0][0], "a0e"), add(b.arms[0][1], "a0h")], [add(b.arms[1][0], "a1e"), add(b.arms[1][1], "a1h")]],
    legs: [[add(b.legs[0][0], "l0k"), add(b.legs[0][1], "l0f")], [add(b.legs[1][0], "l1k"), add(b.legs[1][1], "l1f")]],
    bellyK: dl.bellyK ?? b.bellyK
  };
}

const attrs = (a) => Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(" ");
function anim(attr, values, dur, extra = "") {
  const n = values.length - 1;
  const keyTimes = values.map((_, i) => f(i / n * 1000) / 1000).join(";");
  return `<animate attributeName="${attr}" values="${values.join(";")}" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="${keyTimes}" keySplines="${Array(n).fill(SPLINE).join(";")}"${extra}/>`;
}

// Personnage animé : frames = liste de décalages ; opts.noBase = la boucle n'inclut pas la pose de base
function figure(color, belly) {
  return (base, frames = [], dur = 2, opts = {}) => (animated) => {
    const poses = !animated || !frames.length ? [base]
      : opts.noBase ? frames.map((d) => move(base, d)) : [base, ...frames.map((d) => move(base, d))];
    const hint = belly ? (base.belly || belly) : handsHint(base);
    const geo = poses.map((p) => figureEls(p, color, !!belly, hint));
    return geo[0].map((el, i) => {
      if (geo.length === 1) return `<${el.tag} ${attrs(el.a)}/>`;
      const anims = Object.keys(el.a)
        .filter((k) => geo.some((g) => String(g[i].a[k]) !== String(el.a[k])))
        .map((k) => anim(k, [...geo.map((g) => g[i].a[k]), el.a[k]], dur))
        .join("");
      return anims ? `<${el.tag} ${attrs(el.a)}>${anims}</${el.tag}>` : `<${el.tag} ${attrs(el.a)}/>`;
    }).join("\n");
  };
}
const Wf = figure(W, [1, 0]);
const Pf = figure(P, null);

// ---------- Objets ----------
const floor = (y = 146) => `<line x1="8" y1="${y}" x2="192" y2="${y}" stroke="#4d425c" stroke-width="3" stroke-linecap="round"/>`;
const ball = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${PROP_FILL}" stroke="${PROP}" stroke-width="3"/><path d="M${cx - r * 0.6},${cy - r * 0.3} Q${cx},${cy - r * 0.75} ${cx + r * 0.6},${cy - r * 0.3}" fill="none" stroke="${PROP}" stroke-width="2" opacity=".6"/>`;
const pillow = (cx, cy, rx, ry, rot = 0) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="${PROP_FILL}" stroke="${PROP}" stroke-width="3"/>`;
function chair(x1, x2, seatY, backX, backTop) {
  const g = `stroke="${PROP}" stroke-width="4" stroke-linecap="round"`;
  return `<line x1="${x1}" y1="${seatY}" x2="${x2}" y2="${seatY}" ${g}/>` +
    `<line x1="${x1 + 2}" y1="${seatY}" x2="${x1 + 2}" y2="146" ${g}/>` +
    `<line x1="${x2 - 2}" y1="${seatY}" x2="${x2 - 2}" y2="146" ${g}/>` +
    (backX != null ? `<line x1="${backX}" y1="${seatY}" x2="${backX}" y2="${backTop}" ${g}/>` : "");
}
function bed(x1, x2, y, h = 12, back = null) {
  const g = `stroke="${PROP}" stroke-width="4" stroke-linecap="round"`;
  let s = `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="${h}" rx="4" fill="${PROP_FILL}" stroke="${PROP}" stroke-width="3"/>` +
    `<line x1="${x1 + 6}" y1="${y + h}" x2="${x1 + 6}" y2="146" ${g}/><line x1="${x2 - 6}" y1="${y + h}" x2="${x2 - 6}" y2="146" ${g}/>`;
  if (back) s += `<line x1="${back[0]}" y1="${back[1]}" x2="${back[2]}" y2="${back[3]}" stroke="${PROP}" stroke-width="7" stroke-linecap="round"/>`;
  return s;
}
const wall = (x) => `<line x1="${x}" y1="14" x2="${x}" y2="146" stroke="${PROP}" stroke-width="5" stroke-linecap="round"/>`;
const curve = (x1, y1, cx, cy, x2, y2) => `<path d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}" fill="none" stroke="${MARK}" stroke-width="3.5" stroke-linecap="round" marker-end="url(#ah)"/>`;

// ---------- Indications (animées ou non) ----------
// Flèche qui « pousse » : apparaît et avance au rythme du geste
const arrow = (x1, y1, x2, y2, dur = 0) => (animated) => {
  const line = `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${MARK}" stroke-width="3.5" stroke-linecap="round" marker-end="url(#ah)"`;
  if (!animated || !dur) return `<line ${line}/>`;
  const len = Math.hypot(x2 - x1, y2 - y1), dx = f((x2 - x1) / len * 4), dy = f((y2 - y1) / len * 4);
  return `<g><line ${line}>${anim("opacity", [0.25, 1, 0.25], dur)}</line>` +
    `<animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy};0 0" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="${SPLINE};${SPLINE}"/></g>`;
};
// Spirale de mouvement circulaire
const swirl = (cx, cy, r, dur = 0) => (animated) => {
  const p = `<path d="M${cx + r},${cy} A${r},${r} 0 1 1 ${cx},${cy - r}" fill="none" stroke="${MARK}" stroke-width="3" stroke-linecap="round" marker-end="url(#ah)"/>`;
  if (!animated || !dur) return p;
  return `<g>${p}<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="${dur}s" repeatCount="indefinite"/></g>`;
};
// Balancement d'un groupe autour d'un point
const sway = (cx, cy, deg, dur, parts) => (animated) => {
  const inner = parts.map((p) => (typeof p === "function" ? p(animated) : p)).join("\n");
  if (!animated) return `<g>${inner}</g>`;
  return `<g>${inner}<animateTransform attributeName="transform" type="rotate" values="${-deg} ${cx} ${cy};${deg} ${cx} ${cy};${-deg} ${cx} ${cy}" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="${SPLINE};${SPLINE}"/></g>`;
};
// Petit cœur qui bat
const heart = (cx, cy, dur = 0) => (animated) => {
  const p = `<path d="M0,-6 c-4,-6 -12,-2 -8,4 l8,8 l8,-8 c4,-6 -4,-10 -8,-4z" fill="${MARK}"/>`;
  const a = animated && dur ? `<animateTransform attributeName="transform" type="scale" values="1;1.25;1;1.15;1" keyTimes="0;0.15;0.3;0.45;1" dur="${dur}s" repeatCount="indefinite"/>` : "";
  return `<g transform="translate(${cx} ${cy})"><g>${p}${a}</g></g>`;
};
// Jet d'eau qui coule
const water = (lines, dur = 0) => (animated) => {
  const a = animated && dur ? `<animate attributeName="stroke-dashoffset" values="14;0" dur="${dur}s" repeatCount="indefinite"/>` : "";
  return `<g stroke="${P}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="2 5">${lines.map(([a1, b1, a2, b2]) => `<line x1="${a1}" y1="${b1}" x2="${a2}" y2="${b2}">${a}</line>`).join("")}</g>`;
};

function svg(title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" role="img" aria-label="${title}">
<defs><radialGradient id="bg"><stop offset="0" stop-color="#3a2f48"/><stop offset="1" stop-color="#3a2f48" stop-opacity="0"/></radialGradient><marker id="ah" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${MARK}"/></marker></defs>
<circle cx="100" cy="84" r="86" fill="url(#bg)"/>
${body}
</svg>
`;
}

// ---------- Poses ----------
const POSES = {
  // Marche : les jambes alternent, on marche main dans la main
  marcher: ["Marcher", [
    floor(),
    Pf({ head: [124, 28], neck: [124, 40], hip: [124, 87], arms: [[[112, 62], [104, 70]], [[132, 62], [134, 84]]], legs: [[[128, 116], [134, 146]], [[118, 116], [114, 146]]] },
      [{ l0k: [-10, 0], l0f: [-20, 0], l1k: [10, 0], l1f: [20, 0], hip: [0, -2], neck: [0, -2], head: [0, -2], a1h: [-6, 0] }], 1.6),
    Wf({ head: [82, 32], neck: [80, 44], hip: [78, 88], arms: [[[92, 64], [102, 70]], [[70, 64], [68, 84]]], legs: [[[88, 116], [96, 146]], [[72, 117], [62, 146]]] },
      [{ l0k: [-16, 1], l0f: [-34, 0], l1k: [16, -1], l1f: [34, 0], hip: [0, -2], neck: [0, -2], head: [0, -2], a1h: [8, 0] }], 1.6),
    arrow(40, 128, 60, 128, 1.6)
  ]],
  // Ballon : le bassin bascule d'avant en arrière, le partenaire suit le dos
  ballon: ["Ballon", [
    floor(), ball(92, 124, 21),
    Pf({ head: [44, 58], neck: [46, 70], hip: [50, 110], arms: [[[64, 88], [80, 96]], [[62, 92], [78, 102]]], legs: [[[60, 143], [30, 145]], [[56, 143], [26, 145]]] },
      [{ a0h: [-4, 0], a1h: [-4, 0], a0e: [-2, 0], a1e: [-2, 0] }, { a0h: [3, 0], a1h: [3, 0], a0e: [1, 0], a1e: [1, 0] }], 3),
    Wf({ head: [94, 46], neck: [92, 58], hip: [92, 102], arms: [[[104, 80], [116, 100]], [[100, 82], [112, 102]]], legs: [[[118, 108], [120, 146]], [[114, 110], [112, 146]]] },
      [{ hip: [-6, 0], neck: [-2, 1], head: [-2, 1], a0e: [-2, 0], a1e: [-2, 0] }, { hip: [5, 0], neck: [2, 0], head: [2, 0], a0e: [1, 0], a1e: [1, 0] }], 3),
    swirl(150, 112, 12, 3)
  ]],
  // Douche : l'eau coule sur le bas du dos, elle se balance doucement
  "eau-chaude": ["Douche chaude", [
    floor(), wall(156),
    Pf({ head: [52, 30], neck: [52, 42], hip: [52, 87], arms: [[[68, 56], [80, 62]], [[46, 64], [44, 84]]], legs: [[[54, 116], [56, 146]], [[48, 116], [46, 146]]] }),
    `<rect x="78" y="56" width="12" height="9" rx="3" fill="${PROP}" transform="rotate(25 84 60)"/>`,
    water([[92, 66, 106, 76], [90, 70, 104, 84], [94, 62, 110, 70]], 0.6),
    Wf({ head: [128, 38], neck: [120, 48], hip: [108, 90], belly: [1, 0.3], arms: [[[136, 58], [152, 54]], [[134, 64], [152, 68]]], legs: [[[110, 118], [112, 146]], [[102, 118], [100, 146]]] },
      [{ hip: [3, 0], neck: [1, 0], head: [1, 0] }, { hip: [-2, 0] }], 3.2)
  ]],
  // Chaise à l'envers : les mains du partenaire montent et descendent le long du dos
  "chaise-envers": ["Assise à l'envers sur une chaise", [
    floor(), chair(66, 100, 110, 68, 74),
    Pf({ head: [128, 30], neck: [128, 42], hip: [130, 87], arms: [[[112, 56], [96, 62]], [[114, 62], [96, 74]]], legs: [[[130, 116], [132, 146]], [[124, 116], [122, 146]]] },
      [{ a0h: [4, 12], a1h: [4, 12], a0e: [2, 6], a1e: [2, 6], neck: [-1, 1], head: [-1, 1] }], 2),
    Wf({ head: [66, 58], neck: [76, 68], hip: [92, 104], belly: [-1, 0.3], arms: [[[58, 80], [72, 76]], [[60, 82], [76, 80]]], legs: [[[64, 114], [62, 146]], [[70, 116], [72, 146]]] },
      [{ bellyK: 0.68 }], 4)
  ]],
  // Slow dance : le couple se balance ensemble
  "slow-dance": ["Slow dance", [
    floor(),
    sway(100, 146, 3, 3.2, [
      Pf({ head: [124, 26], neck: [122, 40], hip: [124, 88], arms: [[[106, 70], [88, 82]], [[108, 76], [90, 90]]], legs: [[[124, 116], [126, 146]], [[130, 116], [134, 146]]] }),
      Wf({ head: [84, 36], neck: [80, 48], hip: [74, 92], arms: [[[100, 40], [114, 40]], [[98, 44], [112, 46]]], legs: [[[76, 118], [74, 146]], [[70, 118], [66, 146]]] })
    ]),
    curve(60, 152, 102, 160, 144, 152)
  ]],
  // Quatre pattes : le partenaire se penche et appuie sur le sacrum, au rythme de la flèche
  "quatre-pattes": ["À quatre pattes, pression sur le sacrum", [
    floor(),
    Wf({ head: [60, 86], neck: [74, 92], hip: [120, 94], belly: [0, 1], arms: [[[74, 119], [74, 146]], [[80, 119], [82, 146]]], legs: [[[122, 140], [156, 143]], [[116, 140], [150, 143]]] },
      [{ bellyK: 0.68 }], 2),
    Pf({ head: [150, 56], neck: [156, 68], hip: [170, 108], arms: [[[140, 84], [122, 90]], [[144, 88], [126, 94]]], legs: [[[174, 143], [196, 145]], [[168, 143], [190, 145]]] },
      [{ head: [-6, 7], neck: [-4, 6], a0e: [-2, 4], a1e: [-2, 4], a0h: [0, 2], a1h: [0, 2] }], 2),
    arrow(116, 64, 120, 80, 2)
  ]],
  // Compression des hanches : le partenaire pousse vers le centre
  hanches: ["Compression des hanches", [
    floor(), bed(10, 58, 92, 12),
    Pf({ head: [152, 32], neck: [150, 44], hip: [152, 88], arms: [[[134, 62], [118, 80]], [[136, 66], [120, 86]]], legs: [[[152, 117], [154, 146]], [[146, 117], [144, 146]]] },
      [{ head: [-5, 2], neck: [-4, 2], a0e: [-3, 1], a1e: [-3, 1], a0h: [-2, 0], a1h: [-2, 0] }], 2),
    Wf({ head: [58, 66], neck: [72, 70], hip: [110, 88], belly: [0.2, 1], arms: [[[56, 90], [42, 88]], [[60, 90], [46, 90]]], legs: [[[108, 117], [106, 146]], [[114, 117], [116, 146]]] }),
    arrow(130, 98, 116, 92, 2), arrow(98, 70, 106, 80, 2)
  ]],
  // À genoux contre le dossier : elle balance le bassin, il masse le dos
  "genoux-lit": ["À genoux contre le dossier du lit", [
    floor(),
    Pf({ head: [140, 32], neck: [140, 44], hip: [144, 88], arms: [[[120, 58], [98, 62]], [[122, 62], [100, 68]]], legs: [[[144, 117], [144, 146]], [[138, 117], [136, 146]]] },
      [{ a0h: [3, 6], a1h: [3, 6], a0e: [2, 3], a1e: [2, 3] }, { a0h: [-2, -2], a1h: [-2, -2] }], 3),
    bed(30, 124, 110, 12, [42, 112, 52, 50]),
    Wf({ head: [58, 34], neck: [64, 46], hip: [82, 76], belly: [-1, 0.4], arms: [[[50, 54], [62, 48]], [[52, 56], [66, 52]]], legs: [[[82, 108], [114, 108]], [[78, 108], [108, 106]]] },
      [{ hip: [5, 1], neck: [1, 0] }, { hip: [-4, 0], neck: [-1, 0] }], 3)
  ]],
  // Fente : elle se penche vers la jambe levée, puis revient
  fente: ["Fente asymétrique", [
    floor(), chair(110, 140, 110, 140, 80),
    Pf({ head: [50, 30], neck: [50, 42], hip: [50, 87], arms: [[[66, 58], [82, 64]], [[44, 64], [42, 84]]], legs: [[[52, 116], [54, 146]], [[46, 116], [44, 146]]] },
      [{ a0h: [8, 0], a0e: [5, 0], neck: [1, 0], head: [1, 0] }], 2.8),
    Wf({ head: [102, 32], neck: [98, 44], hip: [90, 88], arms: [[[110, 62], [116, 78]], [[94, 66], [96, 86]]], legs: [[[116, 80], [124, 108]], [[84, 117], [78, 146]]] },
      [{ hip: [7, -1], neck: [9, 2], head: [10, 3], a0e: [4, 2], a1e: [7, 1], a1h: [7, 0], l1k: [4, 0] }], 2.8)
  ]],
  // Suspension : elle se laisse descendre, il plie les genoux
  suspension: ["Suspension", [
    floor(),
    Pf({ head: [128, 24], neck: [126, 36], hip: [130, 84], arms: [[[112, 58], [100, 72]], [[114, 62], [102, 76]]], legs: [[[124, 112], [132, 146]], [[136, 112], [142, 146]]] },
      [{ head: [0, 4], neck: [0, 4], hip: [0, 5], l0k: [-2, 2], l1k: [-2, 2], a0e: [0, 6], a1e: [0, 6], a0h: [0, 9], a1h: [0, 9] }], 3.2),
    Wf({ head: [90, 46], neck: [90, 58], hip: [82, 100], arms: [[[106, 46], [120, 36]], [[104, 50], [118, 42]]], legs: [[[100, 120], [88, 146]], [[94, 122], [80, 146]]] },
      [{ head: [0, 9], neck: [0, 9], hip: [-1, 12], l0k: [3, 5], l1k: [3, 5], a0e: [0, 7], a1e: [0, 7], a0h: [0, 4], a1h: [0, 4] }], 3.2),
    arrow(62, 88, 62, 124, 3.2)
  ]],
  // Accroupie : elle descend en douceur, il la soutient sous les bras
  accroupie: ["Accroupie soutenue", [
    floor(), chair(38, 70, 106, 40, 70),
    Pf({ head: [60, 46], neck: [60, 58], hip: [58, 100], arms: [[[76, 74], [90, 82]], [[74, 78], [88, 86]]], legs: [[[84, 104], [84, 146]], [[80, 106], [78, 146]]] },
      [{ a0e: [1, 4], a1e: [1, 4], a0h: [0, 6], a1h: [0, 6], neck: [1, 1], head: [1, 1] }], 3),
    Wf({ head: [100, 66], neck: [98, 78], hip: [98, 122], arms: [[[110, 98], [120, 108]], [[106, 100], [116, 110]]], legs: [[[122, 112], [114, 146]], [[118, 114], [108, 146]]] },
      [{ head: [0, 6], neck: [0, 6], hip: [0, 6], a0e: [0, 4], a1e: [0, 4], a0h: [1, 3], a1h: [1, 3], l0k: [2, 2], l1k: [2, 2] }], 3),
    arrow(150, 100, 150, 132, 3)
  ]],
  // Sur le côté : elle respire calmement, la jambe du dessus bien soutenue
  "cote-coussin": ["Sur le côté, coussin entre les jambes", [
    floor(), bed(16, 184, 108, 12), pillow(38, 102, 16, 6),
    pillow(130, 92, 16, 9, -10),
    Wf({ head: [40, 88], neck: [54, 96], hip: [102, 98], belly: [0, -1], arms: [[[70, 82], [56, 78]], [[74, 86], [60, 84]]], legs: [[[130, 78], [156, 88]], [[132, 102], [162, 104]]] },
      [{ bellyK: 0.72, a0e: [0, -2], a0h: [0, -2] }], 4.5)
  ]],
  // Semi-assise : le genou s'ouvre, le partenaire le soutient
  "semi-assise": ["Semi-assise asymétrique", [
    floor(),
    Pf({ head: [162, 30], neck: [162, 42], hip: [162, 88], arms: [[[148, 64], [130, 82]], [[168, 64], [170, 84]]], legs: [[[162, 117], [164, 146]], [[156, 117], [154, 146]]] },
      [{ a0h: [5, -3], a0e: [3, -2], head: [-1, 0], neck: [-1, 0] }], 3),
    bed(26, 174, 118, 12, [38, 116, 66, 58]),
    pillow(90, 114, 10, 5),
    Wf({ head: [58, 60], neck: [64, 72], hip: [86, 110], belly: [1, -0.5], arms: [[[78, 94], [94, 100]], [[74, 96], [88, 104]]], legs: [[[112, 84], [128, 112]], [[116, 112], [146, 112]]] },
      [{ l0k: [5, -3], bellyK: 0.66 }], 3)
  ]],
  // Tailleur : respiration lente
  tailleur: ["Demi-assise en tailleur", [
    floor(), bed(26, 174, 118, 12, [38, 116, 66, 58]),
    pillow(118, 108, 12, 6),
    Wf({ head: [58, 60], neck: [64, 72], hip: [86, 110], belly: [1, -0.5], arms: [[[80, 96], [98, 98]], [[76, 98], [94, 102]]], legs: [[[116, 98], [98, 114]], [[112, 102], [94, 116]]] },
      [{ bellyK: 0.72, head: [-1, -1], a0h: [0, -2], a1h: [0, -2] }], 4.5)
  ]],
  // Massage : les mains du partenaire tracent des cercles dans le dos
  massage: ["Massage et toucher", [
    floor(), chair(82, 110, 112, null, null),
    Pf({ head: [44, 56], neck: [46, 68], hip: [50, 108], arms: [[[66, 80], [82, 84]], [[64, 88], [80, 96]]], legs: [[[60, 143], [30, 145]], [[56, 143], [26, 145]]] },
      [{ a0h: [0, -8], a0e: [0, -4], a1h: [0, 8], a1e: [0, 4] },
       { a0h: [6, 0], a0e: [3, 0], a1h: [-5, 0], a1e: [-2, 0] },
       { a0h: [0, 8], a0e: [0, 4], a1h: [0, -8], a1e: [0, -4] },
       { a0h: [-5, 0], a0e: [-2, 0], a1h: [6, 0], a1e: [3, 0] }], 2.4, { noBase: true }),
    Wf({ head: [102, 44], neck: [98, 56], hip: [94, 104], arms: [[[110, 80], [122, 102]], [[106, 82], [118, 104]]], legs: [[[122, 110], [124, 146]], [[118, 112], [116, 146]]] },
      [{ bellyK: 0.67, head: [1, 1] }], 4),
    swirl(70, 64, 7, 2.4), swirl(72, 104, 7, 2.4)
  ]],
  // Accueil : un câlin qui se balance, un cœur qui bat
  accueil: ["Je suis là", [
    floor(),
    sway(100, 146, 2, 4, [
      Pf({ head: [118, 30], neck: [116, 42], hip: [118, 88], arms: [[[102, 62], [88, 74]], [[108, 58], [92, 52]]], legs: [[[118, 116], [120, 146]], [[124, 116], [128, 146]]] }),
      Wf({ head: [84, 34], neck: [82, 46], hip: [80, 90], arms: [[[94, 64], [104, 72]], [[74, 66], [72, 86]]], legs: [[[84, 118], [84, 146]], [[76, 118], [72, 146]]] })
    ]),
    heart(100, 20, 1.6)
  ]]
};

const render = (parts, animated) => parts.map((p) => (typeof p === "function" ? p(animated) : p)).join("\n");
for (const [dir, long] of [[OUT, false], [path.join(OUT, "f"), true]]) {
  LONG_HAIR = long;
  fs.mkdirSync(dir, { recursive: true });
  for (const [id, [title, parts]] of Object.entries(POSES)) {
    fs.writeFileSync(path.join(dir, id + ".svg"), svg(title, render(parts, true)));
    fs.writeFileSync(path.join(dir, id + "-still.svg"), svg(title, render(parts, false)));
  }
}
console.log("Généré :", Object.keys(POSES).length, "pictogrammes (animés + fixes) × 2 jeux dans", OUT);
