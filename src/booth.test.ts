import assert from "node:assert/strict";
import {
  calcStripMetrics,
  getLayoutConfig,
  FILTER_CSS,
  FRAME_STYLES,
  STICKER_PRESETS,
  type FilterKind,
  type FrameTheme,
  type GridLayout,
} from "./booth.utils.ts";

// 1. Layout Metrics test (3x1 & 4x1 vertical strips)
const m3 = calcStripMetrics(3, 640, 480, "3x1");
assert.equal(m3.width, 704, "width must be photoW + pad*2 (640 + 64 = 704)");
assert.equal(m3.height, 32 + 3 * (480 + 32) + 96, "height matches 3 photos formula");
assert.equal(m3.pad, 32);
assert.equal(m3.footerH, 96);
assert.equal(m3.columns, 1);
assert.equal(m3.rows, 3);

const m4 = calcStripMetrics(4, 640, 480, "4x1");
assert.equal(m4.width, 704);
assert.equal(m4.height, 32 + 4 * (480 + 32) + 96);

// 2. Multi-column grid layouts (2x2 and 2x3)
const m2x2 = calcStripMetrics(4, 640, 480, "2x2");
assert.equal(m2x2.columns, 2, "2x2 must have 2 columns");
assert.equal(m2x2.rows, 2, "2x2 must have 2 rows");
assert.equal(m2x2.width, 32 + 2 * (640 + 32), "2x2 width matches 2 columns");

const m2x3 = calcStripMetrics(6, 640, 480, "2x3");
assert.equal(m2x3.columns, 2, "2x3 must have 2 columns");
assert.equal(m2x3.rows, 3, "2x3 must have 3 rows");

const m6x1 = calcStripMetrics(6, 640, 480, "6x1");
assert.equal(m6x1.columns, 1, "6x1 must have 1 column");
assert.equal(m6x1.rows, 6, "6x1 must have 6 rows");

// 3. Layout config helper check
const cfg3 = getLayoutConfig("3x1");
assert.equal(cfg3.totalShots, 3);
const cfg6 = getLayoutConfig("2x3");
assert.equal(cfg6.totalShots, 6);

// 4. Filters check
const filters: FilterKind[] = [
  "normal",
  "beauty-glow",
  "soft-peach",
  "bw-classic",
  "vintage-warm",
  "cyber-pop",
  "warm-sunset",
  "pastel-dream",
];
for (const f of filters) {
  assert.ok(FILTER_CSS[f] !== undefined, `Filter ${f} must exist`);
}
assert.equal(FILTER_CSS.normal, "none");
assert.ok(FILTER_CSS["beauty-glow"].includes("contrast"));
assert.ok(FILTER_CSS["warm-sunset"].includes("sepia"));

// 5. Frame styles check
const themes: FrameTheme[] = [
  "blush-pink",
  "cream-pearl",
  "midnight-noir",
  "lavender-haze",
  "matcha-mint",
  "custom",
];
for (const t of themes) {
  const style = FRAME_STYLES[t];
  assert.ok(style.bg && style.text && style.border, `Theme ${t} must have complete colors`);
}
assert.equal(FRAME_STYLES["blush-pink"].bg, "#FFF1F2");

// 6. Stickers check
assert.ok(STICKER_PRESETS.length >= 10, "Must provide at least 10 cute stickers");
assert.ok(STICKER_PRESETS.some((s) => s.emoji === "💖" || s.id === "heart"));

console.log("PASS: booth.test.ts all unit checks succeeded!");
