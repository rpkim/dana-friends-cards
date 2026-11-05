import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { generateChibiImage } from "../src/lib/gemini";

async function main() {
  const root = resolve(__dirname, "..");
  const portrait = readFileSync(
    resolve(root, "public/art/demo/jay-blue-portrait.jpg"),
  );
  const friends = readFileSync(
    resolve(root, "public/art/backs/friends-aura.jpg"),
  );
  const result = await generateChibiImage({
    theme: "aura",
    mode: "photo",
    photoKind: "friends-scene",
    cardFields: { paletteId: "aura", name: "Jay" },
    sourceImage: {
      base64: portrait.toString("base64"),
      mediaType: "image/jpeg",
    },
    referenceImage: {
      base64: friends.toString("base64"),
      mediaType: "image/jpeg",
    },
  });
  if (!result.ok) {
    console.error("FAIL", result.reason);
    process.exit(1);
  }
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(result.image);
  if (!m) {
    console.error("bad data url");
    process.exit(1);
  }
  const out = resolve(root, "public/art/demo/jay-blue-friends-scene.jpg");
  writeFileSync(out, Buffer.from(m[2], "base64"));
  console.log("wrote", out, "model", result.model);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
