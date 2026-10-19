import type { ThreeElements } from "@react-three/fiber";

type configProps = Pick<
  ThreeElements["group"],
  "position" | "rotation" | "scale"
>;

export const corsair4000DTransforms = {
  motherboard: {
    position: [-0.89, 1.15, 1.61],
    rotation: [0, 0, 0],
    scale: 0.3,
  },

  gpu: {
    position: [-0.623, 0.32, 0],
    rotation: [0, -0.01822, 0],
    scale: 0.65,
  },

  psu: {
    position: [-1.32, -1.17, -0.141],
    scale: 0.07,
  },
} satisfies Record<string, configProps>;
