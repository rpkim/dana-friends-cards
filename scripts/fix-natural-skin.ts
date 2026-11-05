/**
 * Aggressive natural-skin fix: edit with an explicit warm-skin reference.
 * Target face region B-R similar to friends-electric (~ -70), not blue (+).
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { DEFAULT_IMAGE_MODEL_ID } from "../src/lib/imageModels";
import { getGeminiApiKey } from "../src/lib/gemini";

const root = resolve(__dirname, "..");

function saveDataUrl(dataUrl: string, outPath: string) {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error(`bad data url for ${outPath}`);
  writeFileSync(outPath, Buffer.from(m[2], "base64"));
  console.log("wrote", outPath);
}

async function fixWithSkinRef(opts: {
  subjectPath: string;
  skinRefPath: string;
  outPath: string;
  who: string;
}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("missing Gemini API key");
  const google = createGoogleGenerativeAI({ apiKey });
  const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL_ID;
  const subject = readFileSync(opts.subjectPath);
  const skinRef = readFileSync(opts.skinRefPath);

  const prompt = `[TASK]
Produce ONE corrected illustration.

Image 1 = the subject to fix (${opts.who}).
Image 2 = SKIN TONE REFERENCE only (warm peach anime skin). Copy that warm skin color family onto the human in Image 1.

[MANDATORY SKIN FIX]
- The human face, ears, neck, and hands in Image 1 currently look cyan/blue/gray. That is a bug.
- Repaint those skin areas to match Image 2's warm peach / light-tan skin (with soft pink cheek blush OK).
- After the fix, skin must clearly read as natural flesh — NOT blue, NOT cyan, NOT ice-lit gray.
- Do NOT leave a translucent blue wash, rectangular blue mask, or cool highlight on the cheeks/nose/forehead.

[KEEP FROM IMAGE 1]
- Same person identity, hair, eyes, expression, pose.
- Same blue hoodie / hood details / crystals.
- Same mascots and blue magical background if present.
- Same composition — one unified illustration, no circular face sticker, no ring inset, no second face.

[THEME RULE]
Blue/cyan theme color stays on hoodie, hood spikes, border, crystals, and background ONLY — never on skin.

Output only the corrected full image.`;

  console.log("fix", opts.subjectPath, "→", opts.outPath);
  const result = await generateText({
    model: google(model),
    providerOptions: {
      google: { responseModalities: ["TEXT", "IMAGE"] },
    },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Image 1 — subject with blue-tinted skin (FIX THIS):" },
          {
            type: "image",
            image: `data:image/jpeg;base64,${subject.toString("base64")}`,
          },
          {
            type: "text",
            text: "Image 2 — SKIN TONE REFERENCE (warm peach skin to copy onto Image 1's human only):",
          },
          {
            type: "image",
            image: `data:image/jpeg;base64,${skinRef.toString("base64")}`,
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const file = result.files?.find((f) =>
    (f.mediaType || "").startsWith("image/"),
  );
  if (!file) {
    console.error("no image", result.text?.slice(0, 400));
    return false;
  }
  const b64 =
    typeof file.base64 === "string"
      ? file.base64
      : Buffer.from(file.uint8Array).toString("base64");
  saveDataUrl(`data:${file.mediaType};base64,${b64}`, opts.outPath);
  return true;
}

async function main() {
  const skinRef = resolve(root, "public/art/backs/friends-electric.jpg");
  const a = await fixWithSkinRef({
    subjectPath: resolve(root, "public/art/backs/friends-aura.jpg"),
    skinRefPath: skinRef,
    outPath: resolve(root, "public/art/backs/friends-aura.jpg"),
    who: "stock Dana & Friends aura back scene",
  });
  const b = await fixWithSkinRef({
    subjectPath: resolve(root, "public/art/demo/jay-blue-portrait.jpg"),
    skinRefPath: skinRef,
    outPath: resolve(root, "public/art/demo/jay-blue-portrait.jpg"),
    who: "Jay front portrait",
  });
  const c = await fixWithSkinRef({
    subjectPath: resolve(root, "public/art/demo/jay-blue-friends-scene.jpg"),
    skinRefPath: skinRef,
    outPath: resolve(root, "public/art/demo/jay-blue-friends-scene.jpg"),
    who: "Jay friends-party back scene",
  });
  if (!a || !b || !c) process.exit(1);
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
