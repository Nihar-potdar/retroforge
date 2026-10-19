export type CameraCommand =
  "left" | "right" | "up" | "down" | "in" | "out" | "reset";
export function cameraKey(key: string): CameraCommand | null {
  return (
    (
      {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
        "+": "in",
        "=": "in",
        "-": "out",
        Home: "reset",
      } as Record<string, CameraCommand>
    )[key] ?? null
  );
}
