/**
 * Собирает Lottie-версию разлёта сердечек из шита благодарности.
 *
 * Источник правды — CSS-кейфреймы heartPump/heartBurst в rating/styles.css
 * и разброс частиц из burstHearts() в rating/app.js. Здесь повторена та же
 * математика, только со seeded-генератором: Lottie не умеет в случайность,
 * поэтому один вариант разлёта запекается в файл.
 *
 * Запуск: node rating/lottie/generate-hearts.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

const FPS = 60;

/* Композиция обтягивает сам разлёт, а не шит: размеры шита зависят от устройства
   и длины текста, поэтому вью центрируется по иконке сердца. Крайние частицы
   всё равно уходят за границы шита — обрезает их контейнер на стороне клиента,
   см. HANDOFF.md */
const COMP_W = 440;
const COMP_H = 120;
const HEART_X = COMP_W / 2;
const HEART_Y = COMP_H / 2;

const HEART_BOX = 24; /* вьюбокс иконки, от него считается масштаб частиц */
const PARTICLE_COUNT = 22;
const SEED = 20260917;

const ms = (value) => (value / 1000) * FPS;

/* ===== SVG path -> безье в формате Lottie ===== */

function parseHeartPath(d) {
  const commands = d.match(/[MCHLVZmchlvz][^MCHLVZmchlvz]*/g) ?? [];
  const nums = (chunk) => (chunk.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);

  const points = [];
  let cursor = [0, 0];

  for (const command of commands) {
    const type = command[0];
    const args = nums(command.slice(1));

    if (type === "M") {
      cursor = [args[0], args[1]];
      points.push({ v: cursor, in: null, out: null });
    } else if (type === "C") {
      points.at(-1).out = [args[0], args[1]];
      cursor = [args[4], args[5]];
      points.push({ v: cursor, in: [args[2], args[3]], out: null });
    } else if (type === "L") {
      cursor = [args[0], args[1]];
      points.push({ v: cursor, in: null, out: null });
    } else if (type === "H") {
      cursor = [args[0], cursor[1]];
      points.push({ v: cursor, in: null, out: null });
    } else if (type === "V") {
      cursor = [cursor[0], args[0]];
      points.push({ v: cursor, in: null, out: null });
    }
  }

  /* Контур замкнут: последняя точка совпадает с первой, схлопываем их в одну */
  const first = points[0];
  const last = points.at(-1);
  if (Math.hypot(last.v[0] - first.v[0], last.v[1] - first.v[1]) < 0.001) {
    first.in = last.in;
    points.pop();
  }

  const relative = (control, vertex) =>
    control ? [control[0] - vertex[0], control[1] - vertex[1]] : [0, 0];

  return {
    /* Центрируем по вьюбоксу — дальше слой позиционируется своим position */
    v: points.map((p) => [p.v[0] - HEART_BOX / 2, p.v[1] - HEART_BOX / 2]),
    i: points.map((p) => relative(p.in, p.v)),
    o: points.map((p) => relative(p.out, p.v)),
    c: true,
  };
}

function readHeart() {
  const svg = readFileSync(join(repoRoot, "assets", "icons", "heart.svg"), "utf8");
  const d = svg.match(/\sd="([^"]+)"/)?.[1];
  const fill = svg.match(/fill="(#[0-9a-f]{6})"/i)?.[1];
  if (!d || !fill) throw new Error("Не нашёл path или заливку в heart.svg");

  const hex = fill.slice(1);
  const channel = (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255;

  return { path: parseHeartPath(d), color: [channel(0), channel(2), channel(4), 1] };
}

/* ===== Кейфреймы ===== */

/* CSS cubic-bezier(x1, y1, x2, y2) ложится на ручки кейфрейма Lottie один в один */
function easing([x1, y1, x2, y2]) {
  return { o: { x: [x1], y: [y1] }, i: { x: [x2], y: [y2] } };
}

/**
 * @param {Array<{t: number, s: number[], ease?: number[]}>} steps
 */
function track(steps) {
  return {
    a: 1,
    k: steps.map((step, index) => {
      if (index === steps.length - 1) return { t: step.t, s: step.s };
      return { ...easing(step.ease), t: step.t, s: step.s };
    }),
  };
}

const still = (value) => ({ a: 0, k: value });

/* ===== Детерминированная случайность вместо Math.random() ===== */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ===== Слои ===== */

function shapeGroup(heart) {
  return [
    {
      ty: "gr",
      nm: "Heart",
      it: [
        { ty: "sh", nm: "Path", ind: 0, ks: { a: 0, k: heart.path } },
        { ty: "fl", nm: "Fill", c: { a: 0, k: heart.color }, o: { a: 0, k: 100 }, r: 1 },
        {
          ty: "tr",
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
          sk: { a: 0, k: 0 },
          sa: { a: 0, k: 0 },
        },
      ],
    },
  ];
}

function layer({ ind, nm, transform, heart, ip, op }) {
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm,
    sr: 1,
    ks: transform,
    ao: 0,
    shapes: shapeGroup(heart),
    ip,
    op,
    st: 0,
    bm: 0,
  };
}

/* Пульсация: обычный размер -> раздутие -> отскок -> обычный размер */
function pumpLayer(heart, compEnd) {
  const pct = (value) => ms(value * 10); /* проценты от 1000ms в кадры */
  const scale = (factor) => [factor * 100, factor * 100];

  return layer({
    ind: 1,
    nm: "Heart pump",
    heart,
    ip: 0,
    op: compEnd,
    transform: {
      o: still(100),
      r: still(0),
      p: still([HEART_X, HEART_Y, 0]),
      a: still([0, 0, 0]),
      s: track([
        { t: pct(0), s: scale(1), ease: [0, 0, 1, 1] },
        { t: pct(16), s: scale(1), ease: [0.34, 0.9, 0.5, 1] },
        { t: pct(44), s: scale(2.1), ease: [0.5, 0, 0.35, 1] },
        { t: pct(66), s: scale(0.92), ease: [0.34, 1.2, 0.64, 1] },
        { t: pct(84), s: scale(1.05), ease: [0, 0, 1, 1] },
        { t: pct(100), s: scale(1) },
      ]),
    },
  });
}

function particleLayers(heart, compEnd) {
  const random = mulberry32(SEED);
  const ease = [0.16, 0.68, 0.3, 1];
  const layers = [];

  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const angle = (360 / PARTICLE_COUNT) * i + (random() * 12 - 6);
    const radians = (angle * Math.PI) / 180;

    /* 0 — мелкое и прозрачное, 1 — крупное и плотное */
    const weight = random();
    const size = 7 + weight * 19;

    const spread = 0.8 + weight * 0.35;
    const tx = Math.cos(radians) * 178 * spread;
    const ty = Math.sin(radians) * 34 * spread - 4;

    const rotation = random() * 100 - 50;
    const peakOpacity = Number((0.22 + weight * 0.78).toFixed(2)) * 100;
    const duration = 950 + random() * 450;
    const delay = 400 + random() * 160;

    const start = ms(delay);
    const at = (fraction) => start + ms(duration * fraction);

    /* Размер частицы запекается в масштаб: путь нарисован в боксе 24px */
    const full = (size / HEART_BOX) * 100;
    const seed = 0.2 * full;

    layers.push(
      layer({
        ind: i + 2,
        nm: `Heart particle ${i + 1}`,
        heart,
        ip: start,
        op: compEnd,
        transform: {
          o: track([
            { t: at(0), s: [0], ease },
            { t: at(0.16), s: [peakOpacity], ease },
            { t: at(0.62), s: [peakOpacity], ease },
            { t: at(1), s: [0] },
          ]),
          r: track([
            { t: at(0), s: [0], ease },
            { t: at(1), s: [rotation] },
          ]),
          p: track([
            { t: at(0), s: [HEART_X, HEART_Y, 0], ease },
            { t: at(1), s: [HEART_X + tx, HEART_Y + ty, 0] },
          ]),
          a: still([0, 0, 0]),
          s: track([
            { t: at(0), s: [seed, seed], ease },
            { t: at(1), s: [full, full] },
          ]),
        },
      }),
    );
  }

  return layers;
}

/* ===== Сборка ===== */

function build() {
  const heart = readHeart();

  /* Сначала считаем длину по самой поздней частице, потом строим слои под неё */
  const probe = particleLayers(heart, 0);
  const lastFrame = Math.max(
    ms(1000),
    ...probe.map((l) => Math.max(...l.ks.o.k.map((k) => k.t))),
  );
  const compEnd = Math.ceil(lastFrame);

  return {
    v: "5.9.0",
    fr: FPS,
    ip: 0,
    op: compEnd,
    w: COMP_W,
    h: COMP_H,
    nm: "Hearts burst",
    ddd: 0,
    assets: [],
    layers: [pumpLayer(heart, compEnd), ...particleLayers(heart, compEnd)],
  };
}

/* Полная точность float раздувает файл втрое, трёх знаков хватает на пиксель */
function round(value) {
  if (typeof value === "number") return Number(value.toFixed(3));
  if (Array.isArray(value)) return value.map(round);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, round(v)]));
  }
  return value;
}

const animation = round(build());
const out = join(here, "hearts-burst.json");
writeFileSync(out, `${JSON.stringify(animation)}\n`);

console.log(
  `hearts-burst.json: ${animation.layers.length} слоёв, ` +
    `${animation.w}x${animation.h}, ${animation.op} кадров при ${animation.fr}fps`,
);
