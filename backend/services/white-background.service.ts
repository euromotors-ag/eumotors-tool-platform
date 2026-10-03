import sharp, { type Sharp } from "sharp";

/**
 * Turns CarCutter's white-backdrop render into a fully white image.
 *
 * CarCutter always renders a 3D floor under the car. We request the same image twice:
 *   withWhiteBackdrop: white backdrop + the account's default (dark) floor
 *   withLightFloor:    a scene with a light floor
 * The car is rendered pixel-identical in both, so we can tell car from floor. Everything above
 * the floor is already correct in the white render (white backdrop, glass, car edges against
 * white), so only the floor is replaced: with white plus the car's shadow from the light floor.
 */

// Max channel difference for a pixel to count as identical (car) in both renders
const CAR_DIFF_LOW = 4;
// Pixels next to the car fade from car to floor up to this difference (anti-aliased edges)
const CAR_DIFF_HIGH = 24;
// Width of the anti-aliased rim around the car where partial pixels are kept
const CAR_RIM_SIZE = 9;
// Identical areas smaller than this share of the image are noise in deep shadow, not car
const MIN_CAR_COMPONENT_SHARE = 0.001;
// The floor in the white render is dark; it is found by flooding from the bottom edge
const FLOOR_MAX_LUMINANCE = 140;
// Grows the floor over its anti-aliased boundary with the white backdrop
const FLOOR_BOUNDARY_SIZE = 7;
// Removes the turntable ring and floor texture before reading the shadow
const SHADOW_CLOSING_SIZE = 13;
const SHADOW_BLUR_SIGMA = 10;
// Ignore shadows lighter than this, and how dark the strongest shadow may get (0-1)
const SHADOW_START = 0.15;
const SHADOW_STRENGTH = 0.85;
// Shadows are only kept close to the car (computed at reduced size for speed)
const SHADOW_ZONE_SCALE = 8;
const SHADOW_ZONE_SIZE = 21;
const SHADOW_ZONE_BLUR_SIGMA = 4;
// Sanity limits for the share of the image that is identical in both renders
const MIN_CAR_SHARE = 0.03;
const MAX_CAR_SHARE = 0.9;
const JPEG_QUALITY = 92;

type RawImage = { data: Buffer; width: number; height: number };

export async function compositeOnWhite(
  withWhiteBackdrop: Buffer,
  withLightFloor: Buffer
): Promise<Buffer> {
  const [backdrop, floor] = await Promise.all([
    decodeRgb(withWhiteBackdrop),
    decodeRgb(withLightFloor),
  ]);

  if (backdrop.width !== floor.width || backdrop.height !== floor.height) {
    throw new Error("White background renders have different sizes");
  }

  const { width, height } = backdrop;
  const pixelCount = width * height;

  const diff = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    diff[i] = Math.max(
      Math.abs(backdrop.data[i * 3] - floor.data[i * 3]),
      Math.abs(backdrop.data[i * 3 + 1] - floor.data[i * 3 + 1]),
      Math.abs(backdrop.data[i * 3 + 2] - floor.data[i * 3 + 2])
    );
  }

  const carCore = findCar(diff, width, height);
  const nearCar = rankFilter(carCore, width, height, CAR_RIM_SIZE, "max");
  const floorArea = findFloor(backdrop.data, carCore, width, height);

  const alpha = new Float32Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    if (carCore[i] || !floorArea[i]) {
      alpha[i] = 1;
    } else if (nearCar[i]) {
      alpha[i] = clamp(
        1 - (diff[i] - CAR_DIFF_LOW) / (CAR_DIFF_HIGH - CAR_DIFF_LOW),
        0,
        1
      );
    }
  }

  const shadow = await buildShadow(floor.data, alpha, carCore, width, height);

  const output = Buffer.alloc(pixelCount * 3);
  for (let i = 0; i < pixelCount; i++) {
    const backgroundValue = 255 * (1 - shadow[i]);
    for (let c = 0; c < 3; c++) {
      const j = i * 3 + c;
      // Next to the floor, blend the car edge from the lighter render (closer to white)
      const carValue = floorArea[i]
        ? Math.max(backdrop.data[j], floor.data[j])
        : backdrop.data[j];
      output[j] = Math.round(
        alpha[i] * carValue + (1 - alpha[i]) * backgroundValue
      );
    }
  }

  return sharp(output, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}

/**
 * Car = large areas that are identical in both renders (255 = car, 0 = not)
 */
function findCar(diff: Uint8Array, width: number, height: number): Uint8Array {
  const identical = Uint8Array.from(diff, (value) =>
    value <= CAR_DIFF_LOW ? 255 : 0
  );
  const car = keepLargeComponents(
    identical,
    width,
    height,
    Math.round(width * height * MIN_CAR_COMPONENT_SHARE)
  );

  let carPixels = 0;
  for (let i = 0; i < car.length; i++) {
    if (car[i]) carPixels++;
  }
  const carShare = carPixels / car.length;
  if (carShare < MIN_CAR_SHARE || carShare > MAX_CAR_SHARE) {
    throw new Error(
      `Could not separate the car from the floor (car share ${carShare.toFixed(2)})`
    );
  }

  return car;
}

/**
 * Floor = dark area of the white render connected to the bottom edge, plus its boundary.
 * Windows are dark too, but they are enclosed by the car and never reach the bottom edge.
 */
function findFloor(
  backdrop: Buffer,
  carCore: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  const pixelCount = width * height;
  const isCandidate = (i: number) =>
    !carCore[i] &&
    luminance(backdrop[i * 3], backdrop[i * 3 + 1], backdrop[i * 3 + 2]) <
      FLOOR_MAX_LUMINANCE;

  const floorArea = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  for (let x = 0; x < width; x++) {
    const i = (height - 1) * width + x;
    if (isCandidate(i)) {
      floorArea[i] = 255;
      queue[tail++] = i;
    }
  }

  while (head < tail) {
    const i = queue[head++];
    const x = i % width;
    for (const next of [
      x > 0 ? i - 1 : -1,
      x < width - 1 ? i + 1 : -1,
      i - width,
      i + width,
    ]) {
      if (next < 0 || next >= pixelCount || floorArea[next]) continue;
      if (!isCandidate(next)) continue;
      floorArea[next] = 255;
      queue[tail++] = next;
    }
  }

  const grown = rankFilter(floorArea, width, height, FLOOR_BOUNDARY_SIZE, "max");
  for (let i = 0; i < pixelCount; i++) {
    if (carCore[i]) grown[i] = 0;
  }
  return grown;
}

/**
 * Returns the shadow darkness per pixel (0 = none, 1 = black)
 */
async function buildShadow(
  floor: Buffer,
  alpha: Float32Array,
  carCore: Uint8Array,
  width: number,
  height: number
): Promise<Float32Array> {
  const pixelCount = width * height;
  const floorLuminance = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    floorLuminance[i] = luminance(floor[i * 3], floor[i * 3 + 1], floor[i * 3 + 2]);
  }

  const floorBase = floorBrightness(floorLuminance, alpha, width, height);
  const closed = rankFilter(floorLuminance, width, height, SHADOW_CLOSING_SIZE, "max");
  const smooth = await blurGray(closed, width, height, SHADOW_BLUR_SIGMA);
  const zone = await buildShadowZone(carCore, width, height);

  const shadow = new Float32Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const ratio = clamp(smooth[i] / floorBase, 0, 1);
    const darkness = clamp((1 - ratio - SHADOW_START) / (1 - SHADOW_START), 0, 1);
    shadow[i] = darkness * SHADOW_STRENGTH * (zone[i] / 255);
  }
  return shadow;
}

/**
 * Unshadowed floor brightness: 75th percentile of floor pixels in the lower part of the image
 */
function floorBrightness(
  floorLuminance: Uint8Array,
  alpha: Float32Array,
  width: number,
  height: number
): number {
  const histogram = new Array<number>(256).fill(0);
  let count = 0;
  for (let y = Math.floor(height * 0.6); y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (alpha[i] >= 0.5) continue;
      histogram[floorLuminance[i]]++;
      count++;
    }
  }
  if (count === 0) return 255;

  let seen = 0;
  for (let value = 0; value < 256; value++) {
    seen += histogram[value];
    if (seen >= count * 0.75) return Math.max(value, 1);
  }
  return 255;
}

async function buildShadowZone(
  carCore: Uint8Array,
  width: number,
  height: number
): Promise<Uint8Array> {
  const smallWidth = Math.max(1, Math.round(width / SHADOW_ZONE_SCALE));
  const smallHeight = Math.max(1, Math.round(height / SHADOW_ZONE_SCALE));

  const small = await toGrayRaw(
    sharp(carCore, { raw: { width, height, channels: 1 } }).resize(
      smallWidth,
      smallHeight,
      { kernel: "linear" }
    ),
    smallWidth,
    smallHeight
  );

  const grown = rankFilter(small, smallWidth, smallHeight, SHADOW_ZONE_SIZE, "max");
  const softened = await blurGray(grown, smallWidth, smallHeight, SHADOW_ZONE_BLUR_SIGMA);

  return toGrayRaw(
    sharp(softened, {
      raw: { width: smallWidth, height: smallHeight, channels: 1 },
    }).resize(width, height, { kernel: "linear" }),
    width,
    height
  );
}

/**
 * Keeps 4-connected components of non-zero pixels with at least `minArea` pixels
 */
function keepLargeComponents(
  mask: Uint8Array,
  width: number,
  height: number,
  minArea: number
): Uint8Array {
  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const result = new Uint8Array(pixelCount);
  const component = new Int32Array(pixelCount);

  for (let start = 0; start < pixelCount; start++) {
    if (!mask[start] || visited[start]) continue;

    visited[start] = 1;
    component[0] = start;
    let size = 1;
    for (let k = 0; k < size; k++) {
      const i = component[k];
      const x = i % width;
      for (const next of [
        x > 0 ? i - 1 : -1,
        x < width - 1 ? i + 1 : -1,
        i - width,
        i + width,
      ]) {
        if (next < 0 || next >= pixelCount || visited[next] || !mask[next]) continue;
        visited[next] = 1;
        component[size++] = next;
      }
    }

    if (size >= minArea) {
      for (let k = 0; k < size; k++) result[component[k]] = 255;
    }
  }

  return result;
}

/**
 * Separable square min/max filter on a single-channel image
 */
function rankFilter(
  source: Uint8Array,
  width: number,
  height: number,
  size: number,
  mode: "min" | "max"
): Uint8Array {
  const radius = Math.floor(size / 2);
  const pick = mode === "min" ? Math.min : Math.max;
  const horizontal = new Uint8Array(source.length);
  const result = new Uint8Array(source.length);

  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let value = source[row + x];
      const from = Math.max(0, x - radius);
      const to = Math.min(width - 1, x + radius);
      for (let k = from; k <= to; k++) value = pick(value, source[row + k]);
      horizontal[row + x] = value;
    }
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let value = horizontal[y * width + x];
      const from = Math.max(0, y - radius);
      const to = Math.min(height - 1, y + radius);
      for (let k = from; k <= to; k++) value = pick(value, horizontal[k * width + x]);
      result[y * width + x] = value;
    }
  }

  return result;
}

async function blurGray(
  source: Uint8Array,
  width: number,
  height: number,
  sigma: number
): Promise<Buffer> {
  return toGrayRaw(
    sharp(source, { raw: { width, height, channels: 1 } }).blur(sigma),
    width,
    height
  );
}

/**
 * sharp outputs single-channel input as sRGB unless told otherwise, so force one channel
 */
async function toGrayRaw(
  pipeline: Sharp,
  width: number,
  height: number
): Promise<Buffer> {
  const data = await pipeline.toColourspace("b-w").raw().toBuffer();
  if (data.length !== width * height) {
    throw new Error("Unexpected channel count in grayscale image");
  }
  return data;
}

async function decodeRgb(image: Buffer): Promise<RawImage> {
  const { data, info } = await sharp(image)
    .removeAlpha()
    .toColorspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 3) {
    throw new Error(`Expected an RGB image, got ${info.channels} channels`);
  }
  return { data, width: info.width, height: info.height };
}

function luminance(red: number, green: number, blue: number): number {
  return Math.round(0.299 * red + 0.587 * green + 0.114 * blue);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
