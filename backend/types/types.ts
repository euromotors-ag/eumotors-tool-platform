import * as path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { SCENE_IDS, CUT_TYPES } from "@utils/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type Profile = {
  license_plate?: Buffer;
  overlay?: Buffer;
  scene_id?: string;
  cut_type?: string;
  background?: Buffer;
  // "sync" uses CarCutter's synchronous endpoint, the only one that applies `background`
  endpoint?: "async" | "sync";
  // Sync only: also render on this scene (light floor) and paint the floor white, see white-background.service
  lightFloorSceneId?: string;
};

export type EditRequest = {
  imgs: Buffer[];
} & (
  | {
      profile_key: string;
    }
  | {
      profile: Profile;
    }
);

export const DEFAULT_PROFILES = {
  cartrade24: {
    license_plate: loadImage("../assets/cartrade24-lp.png"),
    overlay: loadImage("../assets/cartrade24-ol.png"),
    scene_id: SCENE_IDS.DEFAULT,
  },
  eumotors: {
    license_plate: loadImage("../assets/EM-SSI-licensePlate.png"),
    overlay: loadImage("../assets/EM-SSI-imageOverlay.png"),
    scene_id: SCENE_IDS.DEFAULT,
  },
  removebg: {
    cut_type: CUT_TYPES.DEFAULT,
    background: loadImage("../assets/white-bg.png"),
  },
  // Same retouching as eumotors/cartrade24, but fully white with a soft shadow and no license plate
  // or overlay. Uses two CarCutter renders (2 credits) per image to remove CarCutter's 3D floor.
  // To switch to a white 3D scene from CarCutter instead (1 credit), replace with:
  // { scene_id: "<scene id>", cut_type: CUT_TYPES.DEFAULT }
  white: {
    endpoint: "sync",
    cut_type: CUT_TYPES.DEFAULT,
    background: loadImage("../assets/white-bg.jpg"),
    lightFloorSceneId: SCENE_IDS.DEFAULT,
  },
} as const;

function loadImage(relativePath: string): Buffer {
  try {
    return readFileSync(path.resolve(__dirname, relativePath));
  } catch (error) {
    console.error(`Error loading image at ${relativePath}:`, error);
    return Buffer.from([]);
  }
}
