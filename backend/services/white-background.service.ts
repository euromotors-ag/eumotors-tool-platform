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
// The floor in the white render is dark; it is flood-filled from the lowest image row that
// contains it (CarCutter does not always extend the floor to the bottom edge of the image)
const FLOOR_MAX_LUMINANCE = 140;
// A row seeds the floor when at least this share of its pixels is floor-like
const FLOOR_SEED_MIN_ROW_SHARE = 0.2;
// Only this lower share of the image is searched for the seed row
const FLOOR_SEED_SEARCH_SHARE = 0.6;
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

  const { car: carCore, share: carShare } = findCar(diff, width, height);
  if (carShare > MAX_CAR_SHARE) {
    // Both renders are the same image: CarCutter found no car to cut out (interior photo,
    // detail shot), so there is no floor to replace either
    console.warn(
      `[white] renders are identical (car share ${carShare.toFixed(2)}), returning the render as is`
    );
    return withWhiteBackdrop;
  }

  const nearCar = rankFilter(carCore, width, height, CAR_RIM_SIZE, "max");
  const { floor: floorArea, seedRow } = findFloor(
    backdrop.data,
    carCore,
    width,
    height
  );
  const floorShare = countNonZero(floorArea) / pixelCount;
  console.log(
    `[white] ${width}x${height}: car ${carShare.toFixed(2)}, floor ${floorShare.toFixed(2)}` +
      (seedRow < 0 ? ", no floor found" : `, floor seeded at row ${seedRow}`)
  );
  if (seedRow < 0) {
    console.warn("[white] no floor found in the white render, nothing was replaced");
  }

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
 * Car = large areas that are identical in both renders (255 = car, 0 = not), with the share
 * of the image they cover. A share above MAX_CAR_SHARE means the renders are the same image.
 */
function findCar(
  diff: Uint8Array,
  width: number,
  height: number
): { car: Uint8Array; share: number } {
  const identical = Uint8Array.from(diff, (value) =>
    value <= CAR_DIFF_LOW ? 255 : 0
  );
  const car = keepLargeComponents(
    identical,
    width,
    height,
    Math.round(width * height * MIN_CAR_COMPONENT_SHARE)
  );

  const share = countNonZero(car) / car.length;
  if (share < MIN_CAR_SHARE) {
    throw new Error(
      `Could not separate the car from the floor (car share ${share.toFixed(2)})`
    );
  }

  return { car, share };
}

/**
 * Floor = dark area of the white render flood-filled from the lowest row that contains floor,
 * plus its boundary. The floor is usually cut by the bottom edge, but for some framings
 * CarCutter ends the floor ellipse above it and leaves a strip of white backdrop below.
 * Windows are dark too, but they sit above the floor, enclosed by the car.
 * `seedRow` is -1 when no floor was found.
 */
function findFloor(
  backdrop: Buffer,
  carCore: Uint8Array,
  width: number,
  height: number
): { floor: Uint8Array; seedRow: number } {
  const pixelCount = width * height;
  const isCandidate = (i: number) =>
    !carCore[i] &&
    luminance(backdrop[i * 3], backdrop[i * 3 + 1], backdrop[i * 3 + 2]) <
      FLOOR_MAX_LUMINANCE;

  const floorArea = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const seedRow = findFloorSeedRow(isCandidate, width, height);
  if (seedRow < 0) {
    return { floor: floorArea, seedRow };
  }
  for (let x = 0; x < width; x++) {
    const i = seedRow * width + x;
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
  return { floor: grown, seedRow };
}

/**
 * Lowest row (searching upwards from the bottom edge) where enough pixels are floor-like
 */
function findFloorSeedRow(
  isCandidate: (i: number) => boolean,
  width: number,
  height: number
): number {
  const minCandidates = width * FLOOR_SEED_MIN_ROW_SHARE;
  const lowestRow = Math.floor(height * (1 - FLOOR_SEED_SEARCH_SHARE));
  for (let y = height - 1; y >= lowestRow; y--) {
    let candidates = 0;
    for (let x = 0; x < width; x++) {
      if (isCandidate(y * width + x)) candidates++;
    }
    if (candidates >= minCandidates) return y;
  }
  return -1;
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

function countNonZero(mask: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) count++;
  }
  return count;
}

function luminance(red: number, green: number, blue: number): number {
  return Math.round(0.299 * red + 0.587 * green + 0.114 * blue);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
