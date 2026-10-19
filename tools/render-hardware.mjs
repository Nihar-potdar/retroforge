import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
const assets = JSON.parse(await readFile("src/models/assets.json", "utf8"));
const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 900, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto("http://127.0.0.1:5173/");
  await page.setContent(
    '<html><body style="margin:0;background:transparent"></body></html>',
  );
  for (const [kind, asset] of [
    ["assembly", { url: assets }],
    ...Object.entries(assets),
  ]) {
    await page.evaluate(
      async ({ url, kind }) => {
        const T = await import("/node_modules/three/build/three.module.js");
        const { GLTFLoader } =
          await import("/node_modules/three/examples/jsm/loaders/GLTFLoader.js");
        const { MeshoptDecoder } =
          await import("/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js");
        const { RoomEnvironment } =
          await import("/node_modules/three/examples/jsm/environments/RoomEnvironment.js");
        const renderer = new T.WebGLRenderer({
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
        });
        renderer.setSize(900, 900);
        renderer.setPixelRatio(1);
        renderer.setClearColor(0, 0);
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.5;
        const scene = new T.Scene();
        const pmrem = new T.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(
          new RoomEnvironment(),
          0.04,
        ).texture;
        scene.add(new T.HemisphereLight(0xffffff, 0x59635d, 3));
        const light = new T.DirectionalLight(0xffffff, 4);
        light.position.set(4, 6, 5);
        scene.add(light);
        let model;
        if (kind === "assembly") {
          model = new T.Group();
          const placements = {
            case: { p: [0, -1.8, 0], s: 10 },
            motherboard: { p: [-0.89, 1.15, 1.61], s: 0.3 },
            cpu: { p: [-0.89, 1.15, 1.61], s: 0.3 },
            ram: { p: [-0.89 + 0.2982114 * 0.3, 1.15, 1.61], s: 0.3 },
            gpu: { p: [-0.623, 0.32, 0], s: 0.65 },
            psu: { p: [-1.32, -1.17, -0.141], s: 0.07 },
          };
          for (const [key, asset] of Object.entries(url)) {
            const o = (
              await new GLTFLoader()
                .setMeshoptDecoder(MeshoptDecoder)
                .loadAsync("/" + asset.url)
            ).scene;
            const t = placements[key];
            o.position.set(...t.p);
            o.scale.setScalar(t.s);
            if (key === "gpu") o.rotation.y = -0.01822;
            model.add(o);
          }
        } else
          model = (
            await new GLTFLoader()
              .setMeshoptDecoder(MeshoptDecoder)
              .loadAsync("/" + url)
          ).scene;
        scene.add(model);
        model.updateMatrixWorld(true);
        const box = new T.Box3().setFromObject(model);
        const center = box.getCenter(new T.Vector3());
        const size = box.getSize(new T.Vector3());
        model.position.sub(center);
        const camera = new T.PerspectiveCamera(32, 1, 0.001, 10000);
        const span = Math.max(size.x, size.y, size.z);
        const dist = (span / Math.tan((32 * Math.PI) / 360)) * 0.76;
        const angle =
          kind === "motherboard" || kind === "cpu" || kind === "ram"
            ? new T.Vector3(1.3, 2, 1.5)
            : new T.Vector3(1.4, 0.8, 1.9);
        camera.position.copy(angle.normalize().multiplyScalar(dist));
        camera.lookAt(0, 0, 0);
        document.body.replaceChildren(renderer.domElement);
        renderer.render(scene, camera);
        window.__renderCleanup = () => {
          renderer.dispose();
          pmrem.dispose();
          scene.environment.dispose();
        };
      },
      { url: asset.url, kind },
    );
    await page
      .locator("canvas")
      .screenshot({
        path: `public/images/hardware/${kind}.png`,
        omitBackground: true,
      });
    await page.evaluate(() => window.__renderCleanup());
    console.log("Rendered", kind);
  }
} finally {
  await browser.close();
}
