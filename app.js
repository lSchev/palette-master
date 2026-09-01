// app.js — Pontinhos & Bigodinhos v2.4 — PARTE 1/2
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* =========================================
   ÍCONES DOS NINHOS (edite fácil aqui)
   Ex: "id_do_ninho": "star"
   ========================================= */
const NINHO_ICONES = {};

/* =========================================
   UTILITÁRIOS DE COR
   ========================================= */
function clampNumber(n, min, max) { return Math.max(min, Math.min(max, n)); }
function safeArray(v) { return Array.isArray(v) ? v : []; }

function hexToRgb(hex) {
  try {
    let h = String(hex || "").trim().replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6) return [0, 0, 0];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  } catch (e) { return [0, 0, 0]; }
}

function rgbToHex(r, g, b) {
  const toHex = (n) => clampNumber(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = clampNumber(s, 0, 100) / 100;
  l = clampNumber(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function hslToHex(h, s, l) { const rgb = hslToRgb(h, s, l); return rgbToHex(rgb[0], rgb[1], rgb[2]); }
function hexToHsl(hex) { const rgb = hexToRgb(hex); return rgbToHsl(rgb[0], rgb[1], rgb[2]); }

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, v };
}

function hexToHsv(hex) { const rgb = hexToRgb(hex); return rgbToHsv(rgb[0], rgb[1], rgb[2]); }

function adjustHsl(hex, delta) {
  const rgb = hexToRgb(hex);
  let [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  if (delta && typeof delta.h !== "undefined") h = ((h + delta.h) % 360 + 360) % 360;
  if (delta && typeof delta.s !== "undefined") s = clampNumber(s + delta.s, 0, 100);
  if (delta && typeof delta.l !== "undefined") l = clampNumber(l + delta.l, 0, 100);
  return hslToHex(h, s, l);
}

function applyPastel(hex, strength) {
  const t = clampNumber(strength, 0, 100) / 100;
  const rgb = hexToRgb(hex);
  let [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  const ns = Math.max(10, s * (1 - 0.75 * t));
  const nl = Math.min(90, l + t * (84 - l));
  return hslToHex(h, ns, nl);
}

function classifyFamily(hex) {
  const hsv = hexToHsv(hex);
  const h = hsv.h, s = hsv.s, v = hsv.v;
  if (s < 0.15 || v < 0.15) return "neutros";
  if (h >= 15 && h < 45 && v < 0.65) return "marrom";
  if (h < 15 || h >= 345) return "vermelhos";
  if (h >= 15 && h < 40) return "laranjas";
  if (h >= 40 && h < 70) return "amarelos";
  if (h >= 70 && h < 170) return "verdes";
  if (h >= 170 && h < 260) return "azuis";
  if (h >= 260 && h < 310) return "roxos";
  if (h >= 310 && h < 345) return "rosas";
  return "neutros";
}

function colorHex(c) {
  if (!c) return "#CCCCCC";
  if (typeof c === "string") return c.startsWith("#") ? c : "#" + c;
  if (c.hex) return c.hex;
  if (Array.isArray(c.rgb) && c.rgb.length >= 3) return rgbToHex(c.rgb[0], c.rgb[1], c.rgb[2]);
  return "#CCCCCC";
}

/* =========================================
   EXTRAÇÃO K-MEANS (com área opcional)
   ========================================= */
function extractColorsFromCanvas(ctx, w, h, k, step, rect) {
  const region = rect && rect.w > 8 && rect.h > 8
    ? rect
    : { x: 0, y: 0, w: w, h: h };

  const x0 = Math.max(0, Math.floor(region.x));
  const y0 = Math.max(0, Math.floor(region.y));
  const x1 = Math.min(w, Math.ceil(region.x + region.w));
  const y1 = Math.min(h, Math.ceil(region.y + region.h));
  const rw = Math.max(1, x1 - x0);
  const rh = Math.max(1, y1 - y0);

  const data = ctx.getImageData(x0, y0, rw, rh).data;
  const pixels = [];

  for (let y = 0; y < rh; y += step) {
    for (let x = 0; x < rw; x += step) {
      const i = (y * rw + x) * 4;
      if (data[i + 3] < 128) continue;
      pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }
  }

  if (!pixels.length) return [];

  if (pixels.length <= k) {
    const seen = {}; const out = [];
    pixels.forEach((p) => {
      const hx = rgbToHex(p.r, p.g, p.b);
      if (!seen[hx]) { seen[hx] = true; out.push(hx); }
    });
    return out.slice(0, k);
  }

  const st = Math.max(1, Math.floor(pixels.length / k));
  let centroids = [];
  for (let i = 0; i < k; i++) {
    const p = pixels[Math.min(i * st, pixels.length - 1)];
    centroids.push({ r: p.r, g: p.g, b: p.b });
  }

  for (let iter = 0; iter < 10; iter++) {
    const clusters = Array.from({ length: k }, () => []);
    for (const p of pixels) {
      let best = 0, bestD = Infinity;
      for (let ci = 0; ci < centroids.length; ci++) {
        const c = centroids[ci];
        const d = (p.r - c.r) ** 2 + (p.g - c.g) ** 2 + (p.b - c.b) ** 2;
        if (d < bestD) { bestD = d; best = ci; }
      }
      clusters[best].push(p);
    }
    centroids = centroids.map((c, ci) => {
      const cl = clusters[ci];
      if (!cl.length) return c;
      return {
        r: Math.round(cl.reduce((s, p) => s + p.r, 0) / cl.length),
        g: Math.round(cl.reduce((s, p) => s + p.g, 0) / cl.length),
        b: Math.round(cl.reduce((s, p) => s + p.b, 0) / cl.length),
      };
    });
  }

  const counts = Array(k).fill(0);
  for (const p of pixels) {
    let best = 0, bestD = Infinity;
    for (let ci = 0; ci < centroids.length; ci++) {
      const c = centroids[ci];
      const d = (p.r - c.r) ** 2 + (p.g - c.g) ** 2 + (p.b - c.b) ** 2;
      if (d < bestD) { bestD = d; best = ci; }
    }
    counts[best]++;
  }

  const result = centroids
    .map((c, i) => ({ hex: rgbToHex(c.r, c.g, c.b), count: counts[i] || 0 }))
    .sort((a, b) => b.count - a.count);

  const seen = {}; const out = [];
  for (const item of result) {
    if (!seen[item.hex]) { seen[item.hex] = true; out.push(item.hex); }
  }
  return out.slice(0, k);
}

function nearestColors(hex, list, limit) {
  const target = hexToRgb(hex);
  const maxDist = Math.sqrt(3 * 255 * 255);
  return safeArray(list).map((item) => {
    const itemRgb = Array.isArray(item.rgb) ? item.rgb : hexToRgb(item.hex);
    const dist = Math.sqrt(
      (target[0] - itemRgb[0]) ** 2 +
      (target[1] - itemRgb[1]) ** 2 +
      (target[2] - itemRgb[2]) ** 2
    );
    const percent = Math.round((100 - (dist / maxDist) * 100) * 10) / 10;
    return { ...item, distance: dist, percent: clampNumber(percent, 0, 100) };
  }).sort((a, b) => a.distance - b.distance).slice(0, limit);
}

/* =========================================
   CATÁLOGO / DATA BRIDGE
   ========================================= */
function getDmcSource() {
  if (typeof DMC_BANK !== "undefined" && Array.isArray(DMC_BANK)) return DMC_BANK;
  if (typeof DMC_REAL !== "undefined") {
    if (Array.isArray(DMC_REAL)) return DMC_REAL;
    if (DMC_REAL && Array.isArray(DMC_REAL.colors)) return DMC_REAL.colors;
    if (DMC_REAL && Array.isArray(DMC_REAL.data)) return DMC_REAL.data;
  }
  return [];
}

function getFofinhoSource() {
  if (typeof FOFINHO !== "undefined") {
    if (Array.isArray(FOFINHO)) return FOFINHO;
    if (FOFINHO && Array.isArray(FOFINHO.colors)) return FOFINHO.colors;
  }
  return [];
}

function buildCatalogBank() {
  const fofinhoMap = {};
  safeArray(getFofinhoSource()).forEach((item) => {
    if (item && item.code != null) fofinhoMap[String(item.code)] = item.cuteName || item.name || "";
  });
  const bank = safeArray(getDmcSource()).map((item, idx) => {
    const hex = colorHex(item);
    const rgb = Array.isArray(item.rgb) ? item.rgb : hexToRgb(hex);
    const code = item.code != null ? String(item.code) : String(idx + 1);
    const name = item.name || "";
    const cuteName = item.cuteName || fofinhoMap[code] || name || code;
    const family = item.family || classifyFamily(hex);
    return { code, name, cuteName, hex, rgb, family };
  });
  if (!bank.length) {
    return [
      { code: "B5200", name: "Snow White", cuteName: "Nevinho Fofo", hex: "#FFFFFF", rgb: [255, 255, 255], family: "neutros" },
      { code: "310", name: "Black", cuteName: "Noite Estrelada", hex: "#000000", rgb: [0, 0, 0], family: "neutros" },
    ];
  }
  return bank;
}

const CATALOG_BANK = buildCatalogBank();
const CATALOG_FAMILIES = ["todas"].concat(Array.from(new Set(CATALOG_BANK.map((i) => i.family))).sort());

function translateSearch(text) {
  const norm = String(text || "").toLowerCase().trim();
  if (typeof ALIASES !== "undefined" && ALIASES && ALIASES[norm]) return String(ALIASES[norm]).toLowerCase();
  return norm;
}

/* =========================================
   STORAGE / HELPERS
   ========================================= */
function loadGroups() {
  try {
    const raw = localStorage.getItem("pb_groups");
    if (raw != null && raw !== "") return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function loadPalettes() {
  try {
    const raw = localStorage.getItem("pb_palettes");
    if (raw != null && raw !== "") return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function paletteColors(p) {
  if (!p || !p.colors) return [];
  return safeArray(p.colors).map(colorHex);
}

function getMascotPhrase(tab, tool) {
  const defaults = {
    extrator: "Solta sua foto que eu farejo as cores!",
    arrastar: "Clique e arraste na foto para desenhar a área de captura.",
    gotas: "Clique na foto para sugar a cor; use a rodinha para mudar a área (4 a 30px).",
    atelie: "Suas paletinhas salvas nesta sessão!",
    ninhos: "Esses ninhos já estão quentinhos pra bordar!",
    catalogo: "Achei a linha perfeita pro seu bordado!",
  };
  if (tab === "extrator") {
    const key = tool === "drag" ? "arrastar" : "gotas";
    if (typeof FRASES_MASCOTE !== "undefined" && FRASES_MASCOTE && FRASES_MASCOTE[key]) return FRASES_MASCOTE[key];
    return defaults[key];
  }
  if (typeof FRASES_MASCOTE !== "undefined" && FRASES_MASCOTE && FRASES_MASCOTE[tab]) return FRASES_MASCOTE[tab];
  return defaults[tab] || "";
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
  return new Promise((resolve, reject) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); resolve(); } catch (e) { reject(e); } finally { ta.remove(); }
  });
}

function downloadCanvas(cv, filename) {
  const link = document.createElement("a");
  link.download = filename.toLowerCase().replace(/\s+/g, "-") + ".png";
  link.href = cv.toDataURL("image/png");
  link.click();
}

function downloadTxt(lines, filename) {
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = String(text || "").split(/\s+/);
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lh;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy + lh;
}

/* =========================================
   ÍCONES SVG (React nativo)
   ========================================= */
function Icon({ name, className }) {
  const cls = className || "w-4 h-4";
  const p = {
    fill: "none", stroke: "currentColor", strokeWidth: 2,
    strokeLinecap: "round", strokeLinejoin: "round",
    className: cls, viewBox: "0 0 24 24",
  };
  if (name === "sun") return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>;
  if (name === "moon") return <svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
  if (name === "pipette") return <svg {...p}><path d="M12 2s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>;
  if (name === "palette") return <svg {...p}><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>;
  if (name === "archive") return <svg {...p}><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8"/><path d="M10 12h4"/></svg>;
  if (name === "library") return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
  if (name === "image") return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4.35-4.35a2 2 0 0 0-2.83 0L3 21"/></svg>;
  if (name === "upload") return <svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></svg>;
  if (name === "refresh-cw") return <svg {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>;
  if (name === "download") return <svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>;
  if (name === "save") return <svg {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>;
  if (name === "copy") return <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
  if (name === "plus") return <svg {...p}><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
  if (name === "heart") return <svg {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
  if (name === "paw-print") return <svg {...p}><circle cx="6" cy="8" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="18" cy="8" r="2"/><ellipse cx="12" cy="14" rx="5" ry="4"/></svg>;
  if (name === "x") return <svg {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
  if (name === "trash") return <svg {...p}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
  if (name === "move") return <svg {...p}><path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/><path d="M2 12h20"/><path d="M12 2v20"/></svg>;
  if (name === "zoom-in") return <svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>;
  if (name === "list") return <svg {...p}><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>;
  if (name === "ruler") return <svg {...p}><path d="M21.3 8.7 15.3 2.7a1 1 0 0 0-1.4 0l-11.2 11.2a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.4 0l11.2-11.2a1 1 0 0 0 0-1.4z"/><path d="m7.5 10.5 2 2"/><path d="m10.5 7.5 2 2"/><path d="m13.5 4.5 2 2"/></svg>;
  if (name === "notebook") return <svg {...p}><path d="M2 6h4"/><path d="M2 12h4"/><path d="M2 18h4"/><rect x="6" y="2" width="16" height="20" rx="2"/></svg>;
  if (name === "star") return <svg {...p}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>;
  if (name === "home") return <svg {...p}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>;
  if (name === "leaf") return <svg {...p}><path d="M11 20A7 7 0 0 1 4 13c0-4 3-9 8-11 5 2 8 7 8 11a7 7 0 0 1-7 7z"/><path d="M12 22V10"/></svg>;
  if (name === "cookie") return <svg {...p}><circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1"/><circle cx="14" cy="13" r="1"/><circle cx="10" cy="15" r="1"/></svg>;
  if (name === "cup-soda") return <svg {...p}><path d="M6 3h12l-2 18H8z"/><path d="M6 8h12"/><path d="M12 3V1"/></svg>;
  if (name === "baby") return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M9 15c1 .8 2 1 3 1s2-.2 3-1"/></svg>;
  if (name === "moon-star") return <svg {...p}><path d="M18 11.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 7.5 7.5z"/><path d="M17 2l1 2.5L20.5 5.5 18 6.5 17 9l-1-2.5L13.5 5.5 16 4.5z"/></svg>;
  if (name === "candy") return <svg {...p}><circle cx="12" cy="12" r="6"/><path d="M18 12c0-1 .5-2 1.5-2.5S21 8 20.5 7"/><path d="M6 12c0 1-.5 2-1.5 2.5S3 16 3.5 17"/></svg>;
  if (name === "edit") return <svg {...p}><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>;
  if (name === "folder-open") return <svg {...p}><path d="M6 14l3 3h11l2-8H9z"/><path d="M4 20V6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v1"/></svg>;
  return null;
}

/* =========================================
   APP
   ========================================= */
function App() {
  const [dark, setDark] = useState(() => {
    try { return (localStorage.getItem("pm_theme") || "theme-pastel") === "theme-dark"; } catch (e) { return false; }
  });
  const [tab, setTab] = useState("extrator");
  const [tool, setTool] = useState("pipette");
  const [colors, setColors] = useState([]);
  const [k, setK] = useState(5);
  const [sample, setSample] = useState(8);
  const [zoom, setZoom] = useState(6);
  const [harmony, setHarmony] = useState("pastel");
  const [pasteMix, setPasteMix] = useState(60);
  const [picked, setPicked] = useState("#E2D6FF");

  const [imgSrc, setImgSrc] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [selRect, setSelRect] = useState(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);

  const [toast, setToast] = useState(null);
  const [lens, setLens] = useState({ x: 0, y: 0, cx: 0, cy: 0, visible: false, hex: "#000000", area: 8 });

  const [groups, setGroups] = useState(loadGroups);
  const [palettes, setPalettes] = useState(loadPalettes);
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("todas");

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalKind, setSaveModalKind] = useState("palette");
  const [saveModalName, setSaveModalName] = useState("");
  const [saveModalGroup, setSaveModalGroup] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [pendingProject, setPendingProject] = useState(null);

  const [shopPaletteId, setShopPaletteId] = useState("");
  const [shopSize, setShopSize] = useState("M");
  const [simW, setSimW] = useState("100");
  const [simH, setSimH] = useState("100");
  const [simCount, setSimCount] = useState("14");
  const [moodPaletteId, setMoodPaletteId] = useState("");
  const [moodImg, setMoodImg] = useState(null);
  const [moodNote, setMoodNote] = useState("");

  const imgCanvasRef = useRef(null);
  const loupeCanvasRef = useRef(null);
  const fileRef = useRef(null);
  const moodFileRef = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    document.body.className = dark ? "theme-dark" : "theme-pastel";
    try { localStorage.setItem("pm_theme", dark ? "theme-dark" : "theme-pastel"); } catch (e) {}
  }, [dark]);

  useEffect(() => { try { localStorage.setItem("pb_groups", JSON.stringify(groups)); } catch (e) {} }, [groups]);
  useEffect(() => { try { localStorage.setItem("pb_palettes", JSON.stringify(palettes)); } catch (e) {} }, [palettes]);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const copyRaw = useCallback((text, msg) => {
    copyToClipboard(text)
      .then(() => showToast(msg || "Copiado!"))
      .catch(() => showToast("Não consegui copiar."));
  }, [showToast]);

  const copy = useCallback((hex, msg) => { copyRaw(hex, (msg || "Copiado") + " " + hex); }, [copyRaw]);

  const reExtract = useCallback(() => {
    const c = imgCanvasRef.current;
    if (!c || !c.width || !c.height) return;
    const ctx = c.getContext("2d");
    setColors(extractColorsFromCanvas(ctx, c.width, c.height, k, 3, selRect));
  }, [k, selRect]);

  useEffect(() => {
    if (!imgSrc) return;
    const c = imgCanvasRef.current;
    if (!c) return;
    const img = new Image();
    img.onload = () => {
      const maxW = 800;
      const scale = Math.min(1, maxW / img.width);
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      setImgLoaded(true);
    };
    img.src = imgSrc;
  }, [imgSrc]);

  useEffect(() => { if (imgLoaded) reExtract(); }, [imgLoaded, reExtract]);

  useEffect(() => {
    const c = imgCanvasRef.current;
    if (!c) return;
    const onWheel = (e) => {
      e.preventDefault();
      setSample((s) => clampNumber(s + (e.deltaY > 0 ? -2 : 2), 4, 30));
    };
    c.addEventListener("wheel", onWheel, { passive: false });
    return () => c.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const lc = loupeCanvasRef.current;
    const c = imgCanvasRef.current;
    if (!lc || !c || !lens.visible) return;
    const ctx = lc.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const size = 140;
    const srcSize = Math.max(4, size / zoom);
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(c, lens.cx - srcSize / 2, lens.cy - srcSize / 2, srcSize, srcSize, 0, 0, size, size);
  }, [lens, zoom]);

  const handleImage = useCallback((file) => {
    if (!file) return;
    if (!/image\/(jpeg|png|webp)/.test(file.type)) { showToast("Envie JPG, PNG ou WEBP."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgSrc(ev.target.result);
      setSelRect(null);
    };
    reader.readAsDataURL(file);
  }, [showToast]);

  const clearImage = () => {
    setImgSrc(null);
    setImgLoaded(false);
    setColors([]);
    setSelRect(null);
    setLens((s) => ({ ...s, visible: false }));
    if (fileRef.current) fileRef.current.value = "";
  };

  /* trocar de ferramenta: conta-gotas limpa a área desenhada */
  const selectTool = (t) => {
    setTool(t);
    if (t === "pipette") setSelRect(null);
  };

  const canvasCoords = (e) => {
    const c = imgCanvasRef.current;
    const rect = c.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (c.width / rect.width),
      y: (e.clientY - rect.top) * (c.height / rect.height),
    };
  };

  const handleMouseDown = (e) => {
    if (!imgLoaded || tool !== "drag") return;
    const p = canvasCoords(e);
    dragRef.current = p;
    setDragging(true);
    setSelRect({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e) => {
    const c = imgCanvasRef.current;
    if (!c || !imgLoaded) return;
    const p = canvasCoords(e);

    if (tool === "drag" && dragging && dragRef.current) {
      const s = dragRef.current;
      setSelRect({
        x: Math.min(s.x, p.x),
        y: Math.min(s.y, p.y),
        w: Math.abs(p.x - s.x),
        h: Math.abs(p.y - s.y),
      });
      return;
    }

    if (tool !== "pipette") return;

    const requestedSize = clampNumber(sample, 4, 30);
    const safeSize = Math.max(1, Math.min(requestedSize, c.width, c.height));
    const sx = clampNumber(Math.floor(p.x) - Math.floor(safeSize / 2), 0, Math.max(0, c.width - safeSize));
    const sy = clampNumber(Math.floor(p.y) - Math.floor(safeSize / 2), 0, Math.max(0, c.height - safeSize));
    const ctx = c.getContext("2d");

    try {
      const data = ctx.getImageData(sx, sy, safeSize, safeSize).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; count++; }
      if (!count) return;
      const hex = rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count));
      setLens({ x: e.clientX, y: e.clientY, cx: p.x, cy: p.y, visible: true, hex, area: safeSize });
      setPicked(hex);
    } catch (err) {}
  };

  const handleMouseUp = () => {
    if (tool === "drag" && dragging) {
      setDragging(false);
      dragRef.current = null;
      setSelRect((r) => (r && r.w > 8 && r.h > 8 ? r : null));
    }
  };

  const handleMouseLeave = () => {
    setLens((s) => ({ ...s, visible: false }));
    if (dragging) {
      setDragging(false);
      dragRef.current = null;
      setSelRect((r) => (r && r.w > 8 && r.h > 8 ? r : null));
    }
  };

  const addPicked = () => {
    if (!picked) return;
    if (colors.indexOf(picked) === -1) { setColors([...colors, picked]); showToast("Cor adicionada!"); }
  };

  const harmonies = useMemo(() => {
    const source = colors.length ? colors : [picked];
    if (!source.length) return [];
    const base = source[0];
    if (harmony === "pastel") return source.map((c) => applyPastel(c, pasteMix));
    if (harmony === "analoga") return [-30, 0, 30].map((d) => adjustHsl(base, { h: d }));
    if (harmony === "triade") return [0, 120, 240].map((d) => adjustHsl(base, { h: d }));
    if (harmony === "monocrom") return [20, 0, -15, -30].map((d) => adjustHsl(base, { l: d }));
    return [];
  }, [colors, picked, harmony, pasteMix]);

  const closestDMC = useMemo(() => { if (!picked) return []; return nearestColors(picked, CATALOG_BANK, 6); }, [picked]);

  const filteredCatalog = useMemo(() => {
    const raw = search.toLowerCase().trim();
    const translated = translateSearch(raw);
    return CATALOG_BANK.filter((item) => {
      if (family !== "todas" && item.family !== family) return false;
      if (raw) {
        const hay = (item.code + " " + item.name + " " + item.cuteName + " " + item.hex).toLowerCase();
        if (hay.indexOf(raw) === -1 && hay.indexOf(translated) === -1) return false;
      }
      return true;
    });
  }, [search, family]);

  /* ---------- salvar paleta / harmonia / projeto ---------- */
  const openSaveModal = (kind) => {
    const list = kind === "harmony" ? harmonies : colors;
    if (!list.length) { showToast("Extraia cores primeiro."); return; }
    setSaveModalKind(kind);
    setSaveModalName((kind === "harmony" ? harmony + " " : "Paleta ") + (palettes.length + 1));
    setSaveModalGroup("");
    setNewGroupName("");
    setPendingProject(null);
    setSaveModalOpen(true);
  };

  const openProjectSave = (project) => {
    setPendingProject(project);
    setSaveModalKind("project");
    setSaveModalName(project.name || "Projeto");
    setSaveModalGroup("");
    setNewGroupName("");
    setSaveModalOpen(true);
  };

  const confirmSaveModal = () => {
    if (!saveModalName.trim()) { showToast("Dê um nome."); return; }

    if (saveModalKind === "project") {
      if (!pendingProject) { setSaveModalOpen(false); return; }
      if (!saveModalGroup) { showToast("Escolha um ninho pro projeto."); return; }

      const entry = { ...pendingProject, id: String(Date.now()), name: saveModalName.trim() };
      let groupId = saveModalGroup;

      if (groupId === "__new__") {
        if (!newGroupName.trim()) { showToast("Dê um nome pro ninho novo."); return; }
        groupId = String(Date.now() + 1);
        setGroups([...groups, { id: groupId, name: newGroupName.trim(), palettes: [], projects: [entry] }]);
      } else {
        setGroups(groups.map((g) =>
          g.id === groupId
            ? { ...g, projects: [...(g.projects || []), entry] }
            : g
        ));
      }
      setSaveModalOpen(false);
      showToast("Projeto salvo no ninho!");
      return;
    }

    const list = saveModalKind === "harmony" ? harmonies : colors;
    if (!list.length) { showToast("Sem cores pra salvar."); return; }

    let groupId = saveModalGroup || undefined;
    if (saveModalGroup === "__new__") {
      if (!newGroupName.trim()) { showToast("Dê um nome pro ninho novo."); return; }
      groupId = String(Date.now());
      setGroups([...groups, { id: groupId, name: newGroupName.trim(), palettes: [], projects: [] }]);
    }

    setPalettes([
      ...palettes,
      {
        id: Date.now() + 1,
        name: saveModalName.trim(),
        colors: list,
        groupId: groupId,
        created: new Date().toISOString(),
      },
    ]);
    setSaveModalOpen(false);
    showToast(groupId ? "Salvo no ninho!" : "Paleta salva no Ateliê!");
  };

  const deletePalette = (id) => { setPalettes(palettes.filter((p) => p.id !== id)); showToast("Paleta removida."); };
  const clearAllPalettes = () => { if (window.confirm("Apagar todas as paletas?")) { setPalettes([]); showToast("Ateliê limpo."); } };

  const createGroup = () => {
    const name = window.prompt("Nome do novo ninho:");
    if (!name) return;
    setGroups([...groups, { id: String(Date.now()), name: name.trim(), palettes: [], projects: [] }]);
    showToast("Ninho criado!");
  };

  const deleteGroup = (id) => {
    setGroups(groups.filter((g) => g.id !== id));
    setPalettes(palettes.map((p) => (p.groupId === id ? { ...p, groupId: undefined } : p)));
    showToast("Ninho removido.");
  };

  /* carrega paleta do ninho no Extrator pra continuar o trabalho */
  const continuePalette = (list, name) => {
    const hexes = safeArray(list).map(colorHex);
    if (!hexes.length) { showToast("Paleta vazia."); return; }
    setColors(hexes);
    setTab("extrator");
    showToast("Paleta '" + name + "' carregada no Extrator!");
  };

  /* abre projeto salvo de volta na bancada */
  const loadProject = (proj) => {
    if (!proj || !proj.data) return;
    const d = proj.data;
    if (proj.kind === "lista") {
      if (d.paletteId) setShopPaletteId(d.paletteId);
      if (d.size) setShopSize(d.size);
    }
    if (proj.kind === "sim") {
      if (d.w != null) setSimW(String(d.w));
      if (d.h != null) setSimH(String(d.h));
      if (d.count != null) setSimCount(String(d.count));
    }
    if (proj.kind === "mood") {
      if (d.paletteId) setMoodPaletteId(d.paletteId);
      if (typeof d.img !== "undefined") setMoodImg(d.img);
      if (typeof d.note !== "undefined") setMoodNote(d.note);
    }
    setTab("atelie");
    showToast("Projeto aberto na bancada!");
  };

  /* ---------- exports ---------- */
  const exportPngColors = (colorList, name) => {
    const list = safeArray(colorList).map(colorHex);
    if (!list.length) { showToast("Sem cores."); return; }
    const cv = document.createElement("canvas");
    cv.width = 800; cv.height = 400;
    const ctx = cv.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 400);
    g.addColorStop(0, "#FFF7FB"); g.addColorStop(1, "#FFF0F6");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 800, 400);
    ctx.fillStyle = "#6B5B7B";
    ctx.font = "bold 28px Quicksand, sans-serif";
    ctx.fillText("Pontinhos & Bigodinhos", 40, 60);
    ctx.font = "16px Nunito, sans-serif";
    ctx.fillText((name || "Paleta") + " • " + list.length + " cores", 40, 90);
    let x = 40, y = 130;
    const size = 64, gap = 24;
    list.forEach((hex) => {
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = hex; ctx.fill();
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 6; ctx.stroke();
      ctx.fillStyle = "#9A8C98";
      ctx.font = "12px monospace";
      ctx.fillText(hex, x, y + size + 18);
      x += size + gap;
      if (x > 800 - size - 40) { x = 40; y += size + 46; }
    });
    downloadCanvas(cv, name || "paleta");
    showToast("PNG exportado!");
  };

  const exportCurrentPng = () => exportPngColors(colors, "paleta-extraida");

  const copyPaletteCss = (p) => {
    const list = paletteColors(p);
    if (!list.length) return;
    const css = ":root {\n" + list.map((h, i) => "  --cor-" + (i + 1) + ": " + h + ";").join("\n") + "\n}";
    copyRaw(css, "CSS copiado!");
  };

  /* ---------- BANCADA: lista de compras DMC ---------- */
  const shopPalette = palettes.find((p) => p.id === shopPaletteId) || palettes[0];

  const shoppingList = useMemo(() => {
    if (!shopPalette) return [];
    const list = paletteColors(shopPalette);
    if (!list.length) return [];
    const sizeCm = shopSize === "P" ? 10 : shopSize === "M" ? 20 : 30;
    const ptsPerCm = 14 / 2.54;
    const side = Math.round(sizeCm * ptsPerCm);
    const total = side * side;
    const per = total / list.length;
    return list.map((hx) => {
      const m = nearestColors(hx, CATALOG_BANK, 1)[0];
      return {
        hex: hx,
        code: m ? m.code : "?",
        name: m ? m.cuteName : "",
        skeins: Math.max(1, Math.ceil(per / 800)),
      };
    });
  }, [shopPalette, shopSize]);

  const downloadShoppingTxt = (rows, title, sizeCm) => {
    const lines = [
      "PONTINHOS & BIGODINHOS - Lista de compras DMC",
      "Paleta: " + title,
      "Tamanho: " + sizeCm + "x" + sizeCm + " cm (aida 14)",
      "----------------------------------------",
    ];
    rows.forEach((r) => lines.push("DMC " + r.code + " | " + r.name + " | " + r.skeins + " meada(s)"));
    downloadTxt(lines, "lista-compras-dmc.txt");
    showToast("Lista exportada!");
  };

  const exportShoppingTxt = () => {
    if (!shopPalette || !shoppingList.length) { showToast("Salve uma paleta primeiro."); return; }
    const sizeCm = shopSize === "P" ? 10 : shopSize === "M" ? 20 : 30;
    downloadShoppingTxt(shoppingList, shopPalette.name, sizeCm);
  };

  /* ---------- BANCADA: simulador de pontos ---------- */
  const simPtsW = parseInt(simW, 10) || 0;
  const simPtsH = parseInt(simH, 10) || 0;
  const simCountNum = Number(simCount) || 14;
  const simCmW = simPtsW ? (simPtsW / (simCountNum / 2.54)).toFixed(1) : "0";
  const simCmH = simPtsH ? (simPtsH / (simCountNum / 2.54)).toFixed(1) : "0";
  const simTotal = simPtsW * simPtsH;

  /* ---------- BANCADA: moodboard ---------- */
  const moodPalette = palettes.find((p) => p.id === moodPaletteId) || palettes[0];

  const handleMoodImage = (file) => {
    if (!file) return;
    if (!/image\/(jpeg|png|webp)/.test(file.type)) { showToast("Envie JPG, PNG ou WEBP."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setMoodImg(ev.target.result);
    reader.readAsDataURL(file);
  };

  const exportMoodboardCore = (palette, imgSrcData, note, filename) => {
    const cv = document.createElement("canvas");
    cv.width = 800; cv.height = 600;
    const ctx = cv.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 600);
    g.addColorStop(0, "#FFF7FB"); g.addColorStop(1, "#FFF0F6");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 800, 600);

    const finish = (img) => {
      ctx.fillStyle = "#6B5B7B";
      ctx.font = "bold 28px Quicksand, sans-serif";
      ctx.fillText("Moodboard - " + (palette ? palette.name : filename), 40, 60);

      if (img) {
        const boxW = 720, boxH = 300, bx = 40, by = 90;
        const scale = Math.min(boxW / img.width, boxH / img.height);
        const dw = img.width * scale, dh = img.height * scale;
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, boxW, boxH, 18); else ctx.rect(bx, by, boxW, boxH);
        ctx.clip();
        ctx.drawImage(img, bx + (boxW - dw) / 2, by + (boxH - dh) / 2, dw, dh);
        ctx.restore();
      }

      const list = palette ? paletteColors(palette) : [];
      let x = 40;
      list.slice(0, 10).forEach((hx) => {
        ctx.beginPath();
        ctx.arc(x + 28, 460, 28, 0, Math.PI * 2);
        ctx.fillStyle = hx; ctx.fill();
        ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 4; ctx.stroke();
        x += 68;
      });

      ctx.fillStyle = "#9A8C98";
      ctx.font = "16px Nunito, sans-serif";
      wrapText(ctx, note || "Sem notas ainda.", 40, 530, 720, 22);

      downloadCanvas(cv, filename);
      showToast("Moodboard exportado!");
    };

    if (imgSrcData) {
      const img = new Image();
      img.onload = () => finish(img);
      img.src = imgSrcData;
    } else {
      finish(null);
    }
  };

  const exportMoodboardPng = () => {
    if (!moodPalette) { showToast("Salve uma paleta primeiro."); return; }
    exportMoodboardCore(moodPalette, moodImg, moodNote, "moodboard-" + moodPalette.name);
  };

  /* exporta projeto salvo direto do ninho */
  const exportProject = (proj) => {
    const d = proj.data || {};
    if (proj.kind === "lista") {
      const rows = d.rows && d.rows.length ? d.rows : shoppingList;
      const sizeCm = d.size === "P" ? 10 : d.size === "M" ? 20 : 30;
      downloadShoppingTxt(rows, proj.name, sizeCm);
      return;
    }
    if (proj.kind === "sim") {
      const lines = [
        "PONTINHOS & BIGODINHOS - Simulação de pontos",
        "Projeto: " + proj.name,
        "Pontos: " + (d.w || 0) + " x " + (d.h || 0),
        "Tecido: aida " + (d.count || 14),
        "Tamanho final: " + (d.cmW || 0) + " x " + (d.cmH || 0) + " cm",
        "Total de pontos: " + ((d.w || 0) * (d.h || 0)),
      ];
      downloadTxt(lines, "simulacao-pontos.txt");
      showToast("Simulação exportada!");
      return;
    }
    if (proj.kind === "mood") {
      const pal = palettes.find((p) => p.id === d.paletteId) || { name: proj.name, colors: d.colors || [] };
      exportMoodboardCore(pal, d.img || null, d.note || "", "moodboard-" + proj.name);
    }
  };

  const onDrop = (e) => { e.preventDefault(); const file = e.dataTransfer.files && e.dataTransfer.files[0]; handleImage(file); };

  window.__PB_DARK = dark;

  const TABS = [
    { id: "extrator", label: "Extrator", icon: "pipette" },
    { id: "atelie", label: "Ateliê", icon: "palette" },
    { id: "ninhos", label: "Ninhos", icon: "archive" },
    { id: "catalogo", label: "Catálogo", icon: "library" },
  ];

    return (
    <div className="min-h-screen flex flex-col">
      <div className="wallpaper"></div>

      <header className="app-header">
        <div className="max-w-[1120px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="avatar-hamster">
                <img
                  src={window.__PB_DARK ? "assets/mascotes/mascote-avatar-dark.png" : "assets/mascotes/mascote-avatar.webp"}
                  alt="Mascote"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </div>
              <div>
                <h1 className="text-base font-bold leading-none">Pontinhos e Bigodinhos</h1>
                <p className="text-[11px] opacity-60 mt-1">
                  Ateliê Florido v2.4 • {colors.length} cores • {CATALOG_BANK.length} DMC
                </p>
              </div>
            </div>
            <button
              onClick={() => setDark(!dark)}
              className="btn btn-ghost btn-icon"
              title="Alternar tema"
            >
              <Icon name={dark ? "sun" : "moon"} className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`tab-button ${tab === t.id ? "active" : ""}`}
              >
                <Icon name={t.icon} className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="app-main flex-1">

        {/* ============ ABA EXTRATOR (sempre montada) ============ */}
        <div style={{ display: tab === "extrator" ? "block" : "none" }}>
          <section className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start">

            <div className="card p-6">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div>
                  <h2 className="font-bold text-lg">Extrator de Cores</h2>
                  <p className="text-xs opacity-60 mt-1">K-means + conta-gotas com lupa</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    className={`btn btn-ghost btn-tool ${tool === "pipette" ? "active" : ""}`}
                    onClick={() => selectTool("pipette")}
                    title="Sugar cor com clique"
                  >
                    <Icon name="pipette" className="w-4 h-4" /> Conta-gotas
                  </button>
                  <button
                    className={`btn btn-ghost btn-tool ${tool === "drag" ? "active" : ""}`}
                    onClick={() => selectTool("drag")}
                    title="Desenhar área de captura"
                  >
                    <Icon name="move" className="w-4 h-4" /> Arrastar
                  </button>
                  {selRect && (
                    <button className="btn btn-ghost text-xs" onClick={() => setSelRect(null)}>
                      <Icon name="x" className="w-3.5 h-3.5" /> limpar área
                    </button>
                  )}
                  {imgLoaded && (
                    <button onClick={clearImage} className="btn btn-ghost text-xs">
                      <Icon name="refresh-cw" className="w-3.5 h-3.5" /> Trocar imagem
                    </button>
                  )}
                </div>
              </div>

              <div className="canvas-wrap">
                <canvas
                  ref={imgCanvasRef}
                  className="main-canvas"
                  style={{ display: imgLoaded ? "block" : "none" }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  onClick={tool === "pipette" ? addPicked : undefined}
                />

                {imgLoaded && selRect && imgCanvasRef.current && imgCanvasRef.current.width > 0 && (
                  <div
                    className="selection-box"
                    style={{
                      left: (selRect.x / imgCanvasRef.current.width) * 100 + "%",
                      top: (selRect.y / imgCanvasRef.current.height) * 100 + "%",
                      width: (selRect.w / imgCanvasRef.current.width) * 100 + "%",
                      height: (selRect.h / imgCanvasRef.current.height) * 100 + "%",
                    }}
                  >
                    <span className="sel-flower tl"></span>
                    <span className="sel-flower tr"></span>
                    <span className="sel-flower bl"></span>
                    <span className="sel-flower br"></span>
                  </div>
                )}
              </div>

              {!imgLoaded && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  onClick={() => fileRef.current && fileRef.current.click()}
                  className="border-2 border-dashed rounded-[1.5rem] p-10 text-center cursor-pointer"
                  style={{ borderColor: "var(--card-border)", background: "var(--bg-soft)" }}
                >
                  <Icon name="image" className="w-10 h-10 mx-auto opacity-50" />
                  <p className="font-bold mt-3">Solte sua inspiração aqui!</p>
                  <p className="text-xs opacity-60 mt-1">JPG, PNG ou WEBP</p>
                  <span className="btn btn-primary mt-4 inline-flex">
                    <Icon name="upload" className="w-4 h-4" /> Escolher imagem
                  </span>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files && e.target.files[0];
                  handleImage(f);
                  e.target.value = "";
                }}
              />

              {imgLoaded && (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <label className="text-xs font-bold">
                    <span className="flex justify-between mb-1">
                      <span>Número de cores</span>
                      <span>{k}</span>
                    </span>
                    <input
                      type="range" min="2" max="12" value={k}
                      onChange={(e) => setK(Number(e.target.value))}
                      onMouseUp={reExtract}
                    />
                  </label>
                  <label className="text-xs font-bold">
                    <span className="flex justify-between mb-1">
                      <span>Zoom da lupa</span>
                      <span>{zoom}x</span>
                    </span>
                    <input
                      type="range" min="2" max="12" value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                    />
                  </label>
                </div>
              )}

              {imgLoaded && (
                <p className="text-[11px] opacity-60 mt-2">
                  <span className="chip">Área do conta-gotas: {sample}px (use a rodinha sobre a foto)</span>
                  {tool === "drag" ? " • Arraste na foto para desenhar a área de captura." : " • Clique na foto para sugar a cor."}
                </p>
              )}

              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm">Cores extraídas • {colors.length}</h3>
                  {colors.length > 0 && (
                    <button onClick={() => setColors([])} className="text-xs underline opacity-60">limpar</button>
                  )}
                </div>
                {colors.length === 0 ? (
                  <div
                    className="rounded-[1.2rem] p-4 text-center border-2 border-dashed"
                    style={{ borderColor: "var(--card-border)", background: "var(--bg-soft)" }}
                  >
                    <p className="text-sm font-bold">Nenhuma cor ainda.</p>
                    <p className="text-xs opacity-60 mt-1">Suba uma foto ou clique na imagem para sugar cores.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {colors.map((c) => <ColorBall key={c} hex={c} onCopy={copy} />)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-5">
                <button onClick={exportCurrentPng} className="btn btn-primary">
                  <Icon name="download" className="w-4 h-4" /> Exportar PNG
                </button>
                <button onClick={() => openSaveModal("palette")} className="btn btn-accent">
                  <Icon name="save" className="w-4 h-4" /> Salvar paleta
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="font-bold text-sm">Conta-gotas</h3>
                <div className="flex items-center gap-3 mt-3">
                  <div
                    className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                    style={{ background: picked }}
                  ></div>
                  <div>
                    <p className="font-mono text-sm">{picked}</p>
                    <button onClick={addPicked} className="btn btn-primary text-xs mt-2">
                      <Icon name="plus" className="w-3.5 h-3.5" /> Adicionar à paleta
                    </button>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-sm">Linha mais próxima</h3>
                {closestDMC.length === 0 ? (
                  <p className="text-xs opacity-60 mt-2">Escolha uma cor na imagem.</p>
                ) : (
                  <div className="space-y-2 mt-3">
                    {closestDMC.map((d, idx) => (
                      <div key={d.code + "-" + d.hex + "-" + idx} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-6 h-6 rounded-full border border-white shadow-sm shrink-0"
                          style={{ background: d.hex }}
                        ></span>
                        <span className="font-bold">{d.code}</span>
                        <span className="truncate opacity-80">{d.cuteName}</span>
                        <span className="ml-auto font-mono text-[10px]">{d.percent}%</span>
                        <button
                          onClick={() => copy(d.hex, d.code)}
                          className="btn btn-ghost text-[10px] px-2 py-1"
                        >
                          <Icon name="copy" className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-sm">Harmonia</h3>
                  <span className="chip capitalize">{harmony}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {["pastel", "analoga", "triade", "monocrom"].map((h) => (
                    <button
                      key={h}
                      onClick={() => setHarmony(h)}
                      className={`tab-button capitalize ${harmony === h ? "active" : ""}`}
                    >
                      {h}
                    </button>
                  ))}
                </div>

                {harmony === "pastel" && (
                  <label className="block mt-4 text-xs font-bold">
                    <span className="flex justify-between mb-1">
                      <span>Força pastel</span>
                      <span>{pasteMix}%</span>
                    </span>
                    <input
                      type="range" min="0" max="100" value={pasteMix}
                      onChange={(e) => setPasteMix(Number(e.target.value))}
                    />
                  </label>
                )}

                <div className="flex flex-wrap gap-4 mt-4">
                  {harmonies.map((c, i) => (
                    <ColorBall
                      key={c + "-" + i}
                      hex={c}
                      onCopy={copy}
                      onAdd={(hx) => {
                        if (colors.indexOf(hx) === -1) {
                          setColors([...colors, hx]);
                          showToast("Cor adicionada!");
                        }
                      }}
                    />
                  ))}
                </div>

                <button onClick={() => openSaveModal("harmony")} className="btn btn-primary mt-5">
                  <Icon name="save" className="w-4 h-4" /> Salvar harmonia
                </button>
              </div>

              <HamsterTip text={getMascotPhrase("extrator", tool)} />
            </div>
          </section>
        </div>

        {/* ============ ABA ATELIÊ ============ */}
        {tab === "atelie" && (
          <section className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-lg">Meu Ateliê</h2>
                <p className="text-xs opacity-60 mt-1">Paletas salvas + bancada de trabalho</p>
              </div>
              <button onClick={clearAllPalettes} className="btn btn-ghost text-xs">limpar tudo</button>
            </div>

            {palettes.length === 0 ? (
              <div
                className="rounded-[1.2rem] p-8 text-center border-2 border-dashed mt-4"
                style={{ borderColor: "var(--card-border)", background: "var(--bg-soft)" }}
              >
                <p className="font-bold">Nenhuma paleta salva ainda.</p>
                <p className="text-xs opacity-60 mt-1">Extraia cores ou salve uma harmonia.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {palettes.map((p) => {
                  const list = paletteColors(p);
                  const created = p.created ? new Date(p.created).toLocaleDateString("pt-BR") : "";
                  const groupName = p.groupId ? (groups.find((g) => g.id === p.groupId) || {}).name : null;

                  return (
                    <div key={p.id} className="card-soft p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold">{p.name}</p>
                          {created && <p className="text-[10px] opacity-50 mt-0.5">{created}</p>}
                          {groupName && (
                            <span className="chip mt-1 inline-flex">
                              <Icon name="archive" className="w-3 h-3" /> {groupName}
                            </span>
                          )}
                        </div>
                        <button onClick={() => deletePalette(p.id)} className="text-xs underline opacity-60">apagar</button>
                      </div>

                      <div className="flex gap-1 mt-3 flex-wrap">
                        {list.map((c, i) => (
                          <div
                            key={c + "-" + i}
                            className="w-7 h-7 rounded-full border border-white shadow-sm"
                            style={{ background: c }}
                            title={c}
                          ></div>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button onClick={() => exportPngColors(list, p.name)} className="btn btn-ghost text-xs">
                          <Icon name="download" className="w-3.5 h-3.5" /> PNG
                        </button>
                        <button onClick={() => copyPaletteCss(p)} className="btn btn-ghost text-xs">
                          <Icon name="copy" className="w-3.5 h-3.5" /> CSS
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* BANCADA DE TRABALHO */}
            <h3 className="font-bold text-base mt-8 mb-3">Bancada de trabalho</h3>
            <div className="grid md:grid-cols-3 gap-4">

              {/* 1. Lista de compras DMC */}
              <div className="tool-card">
                <h4><Icon name="list" className="w-4 h-4" /> Lista de compras DMC</h4>
                {palettes.length === 0 ? (
                  <p className="text-xs opacity-60">Salve uma paleta primeiro.</p>
                ) : (
                  <React.Fragment>
                    <select
                      className="select mb-2"
                      value={shopPalette ? shopPalette.id : ""}
                      onChange={(e) => setShopPaletteId(e.target.value)}
                    >
                      {palettes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="select mb-2" value={shopSize} onChange={(e) => setShopSize(e.target.value)}>
                      <option value="P">Pequeno 10x10 cm (aida 14)</option>
                      <option value="M">Médio 20x20 cm (aida 14)</option>
                      <option value="G">Grande 30x30 cm (aida 14)</option>
                    </select>
                    <div className="max-h-40 overflow-y-auto pr-1">
                      {shoppingList.map((r, i) => (
                        <div key={i} className="tool-row">
                          <span className="w-4 h-4 rounded-full border border-white shrink-0" style={{ background: r.hex }}></span>
                          <span className="mono">DMC {r.code}</span>
                          <span className="truncate opacity-70">{r.name}</span>
                          <span className="ml-auto font-bold">{r.skeins}x</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="btn btn-primary text-xs" onClick={exportShoppingTxt}>
                        <Icon name="download" className="w-3.5 h-3.5" /> Exportar .txt
                      </button>
                      <button
                        className="btn btn-ghost text-xs"
                        onClick={() => openProjectSave({
                          kind: "lista",
                          name: "Lista " + (shopPalette ? shopPalette.name : "") + " " + shopSize,
                          data: {
                            paletteId: shopPalette ? shopPalette.id : "",
                            size: shopSize,
                            rows: shoppingList,
                          },
                        })}
                      >
                        <Icon name="archive" className="w-3.5 h-3.5" /> Salvar no ninho
                      </button>
                    </div>
                  </React.Fragment>
                )}
              </div>

              {/* 2. Simulador de pontos */}
              <div className="tool-card">
                <h4><Icon name="ruler" className="w-4 h-4" /> Simulador de pontos</h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <label className="text-xs font-bold">Largura (pontos)
                    <input className="input mt-1" type="number" min="1" value={simW} onChange={(e) => setSimW(e.target.value)} />
                  </label>
                  <label className="text-xs font-bold">Altura (pontos)
                    <input className="input mt-1" type="number" min="1" value={simH} onChange={(e) => setSimH(e.target.value)} />
                  </label>
                </div>
                <select className="select mb-2" value={simCount} onChange={(e) => setSimCount(e.target.value)}>
                  <option value="14">Tecido aida 14</option>
                  <option value="16">Tecido aida 16</option>
                  <option value="18">Tecido aida 18</option>
                </select>
                <div className="tool-row"><span>Tamanho final:</span><span className="ml-auto font-bold">{simCmW} x {simCmH} cm</span></div>
                <div className="tool-row"><span>Total de pontos:</span><span className="ml-auto font-bold">{simTotal.toLocaleString("pt-BR")}</span></div>
                <button
                  className="btn btn-ghost text-xs mt-3"
                  onClick={() => openProjectSave({
                    kind: "sim",
                    name: "Sim " + simW + "x" + simH + " aida " + simCount,
                    data: { w: simW, h: simH, count: simCount, cmW: simCmW, cmH: simCmH },
                  })}
                >
                  <Icon name="archive" className="w-3.5 h-3.5" /> Salvar no ninho
                </button>
              </div>

              {/* 3. Moodboard */}
              <div className="tool-card">
                <h4><Icon name="notebook" className="w-4 h-4" /> Moodboard</h4>
                {palettes.length === 0 ? (
                  <p className="text-xs opacity-60">Salve uma paleta primeiro.</p>
                ) : (
                  <React.Fragment>
                    <select
                      className="select mb-2"
                      value={moodPalette ? moodPalette.id : ""}
                      onChange={(e) => setMoodPaletteId(e.target.value)}
                    >
                      {palettes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button
                      className="btn btn-ghost text-xs mb-2"
                      onClick={() => moodFileRef.current && moodFileRef.current.click()}
                    >
                      <Icon name="image" className="w-3.5 h-3.5" /> {moodImg ? "Trocar foto" : "Foto de referência"}
                    </button>
                    <input
                      ref={moodFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => { handleMoodImage(e.target.files && e.target.files[0]); e.target.value = ""; }}
                    />
                    {moodImg && (
                      <img src={moodImg} alt="Referência" className="w-full h-24 object-cover rounded-lg mb-2" />
                    )}
                    <textarea
                      className="textarea mb-2"
                      placeholder="Notas do projeto (tecido, pontos, ideias...)"
                      value={moodNote}
                      onChange={(e) => setMoodNote(e.target.value)}
                    ></textarea>
                    <div className="flex gap-2">
                      <button className="btn btn-primary text-xs" onClick={exportMoodboardPng}>
                        <Icon name="download" className="w-3.5 h-3.5" /> Exportar PNG
                      </button>
                      <button
                        className="btn btn-ghost text-xs"
                        onClick={() => openProjectSave({
                          kind: "mood",
                          name: "Mood " + (moodPalette ? moodPalette.name : ""),
                          data: {
                            paletteId: moodPalette ? moodPalette.id : "",
                            colors: moodPalette ? paletteColors(moodPalette) : [],
                            img: moodImg,
                            note: moodNote,
                          },
                        })}
                      >
                        <Icon name="archive" className="w-3.5 h-3.5" /> Salvar no ninho
                      </button>
                    </div>
                  </React.Fragment>
                )}
              </div>
            </div>

            <div className="mt-6">
              <HamsterTip text={getMascotPhrase("atelie")} />
            </div>
          </section>
        )}

        {/* ============ ABA NINHOS ============ */}
        {tab === "ninhos" && (
          <section className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-lg">Ninhos</h2>
                <p className="text-xs opacity-60 mt-1">Paletas e projetos organizados por coleção.</p>
              </div>
              <button onClick={createGroup} className="btn btn-primary">
                <Icon name="plus" className="w-4 h-4" /> Novo ninho
              </button>
            </div>

            {groups.length === 0 ? (
              <div
                className="rounded-[1.2rem] p-8 text-center border-2 border-dashed mt-4"
                style={{ borderColor: "var(--card-border)", background: "var(--bg-soft)" }}
              >
                <p className="font-bold">Você ainda não tem ninhos.</p>
                <p className="text-xs opacity-60 mt-1">Crie ninhos ou use "+ Criar novo ninho" ao salvar uma paleta.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {groups.map((g) => {
                  const icon = NINHO_ICONES[g.id] || "archive";
                  const groupPalettes = palettes.filter((p) => p.groupId === g.id);
                  const groupProjects = safeArray(g.projects);

                  return (
                    <div key={g.id} className="card-soft p-4 relative overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: "var(--accent)" }}
                          >
                            <Icon name={icon} className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold">{g.name}</p>
                            <p className="text-[11px] opacity-60 mt-0.5">
                              {groupPalettes.length} paleta{groupPalettes.length !== 1 ? "s" : ""} • {groupProjects.length} projeto{groupProjects.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => deleteGroup(g.id)} className="text-xs underline opacity-60">apagar</button>
                      </div>

                      {groupPalettes.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {groupPalettes.map((p) => {
                            const list = paletteColors(p);
                            return (
                              <div key={p.id} className="tool-row">
                                <span className="text-[11px] font-bold truncate max-w-[90px]">{p.name}</span>
                                <div className="flex gap-0.5">
                                  {list.slice(0, 5).map((c, i) => (
                                    <div
                                      key={c + "-" + i}
                                      className="w-4 h-4 rounded-full border border-white"
                                      style={{ background: c }}
                                      title={c}
                                    ></div>
                                  ))}
                                </div>
                                <div className="ml-auto flex gap-1">
                                  <button
                                    className="btn btn-ghost text-[10px] px-2 py-1"
                                    title="Exportar PNG"
                                    onClick={() => exportPngColors(list, p.name)}
                                  >
                                    <Icon name="download" className="w-3 h-3" />
                                  </button>
                                  <button
                                    className="btn btn-ghost text-[10px] px-2 py-1"
                                    title="Copiar CSS"
                                    onClick={() => copyPaletteCss(p)}
                                  >
                                    <Icon name="copy" className="w-3 h-3" />
                                  </button>
                                  <button
                                    className="btn btn-ghost text-[10px] px-2 py-1"
                                    title="Continuar no Extrator"
                                    onClick={() => continuePalette(list, p.name)}
                                  >
                                    <Icon name="edit" className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {groupProjects.length > 0 && (
                        <div className="mt-3 space-y-1 border-t border-dashed pt-2" style={{ borderColor: "var(--border-strong)" }}>
                          {groupProjects.map((proj) => (
                            <div key={proj.id} className="tool-row">
                              <span className="chip">
                                {proj.kind === "lista" ? "lista" : proj.kind === "sim" ? "sim" : "mood"}
                              </span>
                              <span className="text-[11px] font-bold truncate max-w-[110px]">{proj.name}</span>
                              <div className="ml-auto flex gap-1">
                                <button
                                  className="btn btn-ghost text-[10px] px-2 py-1"
                                  title="Abrir na bancada"
                                  onClick={() => loadProject(proj)}
                                >
                                  <Icon name="folder-open" className="w-3 h-3" />
                                </button>
                                <button
                                  className="btn btn-ghost text-[10px] px-2 py-1"
                                  title="Exportar"
                                  onClick={() => exportProject(proj)}
                                >
                                  <Icon name="download" className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6">
              <HamsterTip text={getMascotPhrase("ninhos")} />
            </div>
          </section>
        )}

        {/* ============ ABA CATÁLOGO ============ */}
        {tab === "catalogo" && (
          <section className="space-y-4">
            <div className="card p-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar DMC por código, nome fofo, nome ou hex"
                className="input"
              />
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {CATALOG_FAMILIES.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFamily(f)}
                    className={`tab-button capitalize ${family === f ? "active" : ""}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs opacity-60 px-2">Catálogo DMC completo. {filteredCatalog.length} cores.</p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCatalog.map((item, idx) => (
                <div key={item.code + "-" + item.hex + "-" + idx} className="card p-3 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm shrink-0"
                    style={{ background: item.hex }}
                  ></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{item.code} • {item.cuteName}</p>
                    <p className="text-xs opacity-60 truncate">{item.name}</p>
                    <p className="text-[10px] font-mono">{item.hex}</p>
                  </div>
                  <button
                    onClick={() => copy(item.hex, item.cuteName)}
                    className="btn btn-ghost text-[10px] px-2 py-1"
                  >
                    copiar
                  </button>
                </div>
              ))}
            </div>

            {filteredCatalog.length === 0 && (
              <p className="text-center mt-10 text-sm font-bold opacity-70">Nenhuma cor encontrada.</p>
            )}

            <div className="mt-2">
              <HamsterTip text={getMascotPhrase("catalogo")} />
            </div>
          </section>
        )}
      </main>

      <footer
        className="border-t py-6 mt-8 text-center text-xs opacity-70"
        style={{ borderColor: "var(--card-border)" }}
      >
        <div className="flex items-center justify-center gap-2">
          <span>Pontinhos e Bigodinhos — Ateliê Florido v2.4</span>
          <Icon name="heart" className="w-3.5 h-3.5" />
          <Icon name="paw-print" className="w-3.5 h-3.5" />
        </div>
      </footer>

      {/* ============ MODAL SALVAR (paleta / harmonia / projeto) ============ */}
      {saveModalOpen && (
        <div className="modal-overlay" onClick={() => setSaveModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">
              Salvar {saveModalKind === "harmony" ? "harmonia" : saveModalKind === "project" ? "projeto no ninho" : "paleta"}
            </h3>

            <label className="block text-xs font-bold mb-1">Nome</label>
            <input
              value={saveModalName}
              onChange={(e) => setSaveModalName(e.target.value)}
              className="input mb-4"
              placeholder="Dê um nome fofo"
              autoFocus
            />

            <label className="block text-xs font-bold mb-1">Ninho {saveModalKind === "project" ? "(obrigatório)" : "(opcional)"}</label>
            <select
              value={saveModalGroup}
              onChange={(e) => setSaveModalGroup(e.target.value)}
              className="input mb-4"
            >
              <option value="">Sem ninho</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              <option value="__new__">+ Criar novo ninho</option>
            </select>

            {saveModalKind === "project" && !saveModalGroup && (
              <p className="text-[11px] opacity-60 mb-3">Escolha um ninho da lista ou crie um novo.</p>
            )}

            {saveModalGroup === "__new__" && (
              <React.Fragment>
                <label className="block text-xs font-bold mb-1">Nome do ninho novo</label>
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="input mb-4"
                  placeholder="Ex: Projeto Jardim"
                />
              </React.Fragment>
            )}

            <div className="flex gap-2">
              <button onClick={confirmSaveModal} className="btn btn-primary flex-1">
                <Icon name="save" className="w-4 h-4" /> Salvar
              </button>
              <button onClick={() => setSaveModalOpen(false)} className="btn btn-ghost flex-1">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ LUPA COM ZOOM ============ */}
      {lens.visible && (
        <div
          className="loupe"
          style={{
            left: Math.min(lens.x + 18, window.innerWidth - 160) + "px",
            top: Math.min(lens.y + 18, window.innerHeight - 170) + "px",
          }}
        >
          <canvas ref={loupeCanvasRef} width={140} height={140}></canvas>
          <div className="loupe-crosshair"></div>
          <div className="loupe-info">{lens.hex} • {zoom}x • área {lens.area}px</div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className="toast">{toast}</div>
        </div>
      )}
    </div>
  );
}

/* =========================================
   COMPONENTES VISUAIS
   ========================================= */
function HamsterTip({ text }) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="avatar-hamster">
        <img
          src={window.__PB_DARK ? "assets/mascotes/mascote-avatar-dark.png" : "assets/mascotes/mascote-avatar.webp"}
          alt="Mascote"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      </div>
      <p className="text-sm opacity-80">{text}</p>
    </div>
  );
}

function ColorBall({ hex, onCopy, onAdd }) {
  return (
    <div className="group relative flex flex-col items-center">
      <button
        onClick={() => onCopy(hex)}
        className="w-12 h-12 rounded-full border-2 border-white shadow-md transition-transform hover:scale-105"
        style={{ backgroundColor: hex }}
        title={hex}
      ></button>
      <div className="absolute top-12 hidden group-hover:flex gap-1 z-10">
        <button className="btn btn-ghost btn-icon w-8 h-8" onClick={() => onCopy(hex)} title="Copiar">
          <Icon name="copy" className="w-3.5 h-3.5" />
        </button>
        {onAdd ? (
          <button className="btn btn-primary btn-icon w-8 h-8" onClick={() => onAdd(hex)} title="Adicionar">
            <Icon name="plus" className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* =========================================
   RENDER FINAL
   ========================================= */
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);