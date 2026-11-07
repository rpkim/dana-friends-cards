import { readFile } from "fs/promises";
import path from "path";
import { generateChibiImage, getGeminiApiKey } from "@/lib/gemini";
import type { PaletteId } from "@/lib/themes";
import { NextResponse } from "next/server";

export const maxDuration = 180;

const FRIENDS_REF: Record<PaletteId, string> = {
  electric: "friends-electric.jpg",
  autumn: "friends-autumn.jpg",
  aura: "friends-aura.jpg",
  sparkle: "friends-sparkle.jpg",
};

async function loadFriendsReference(palette: string) {
  const id = (palette in FRIENDS_REF ? palette : "electric") as PaletteId;
  const file = path.join(
    process.cwd(),
    "public",
    "art",
    "backs",
    FRIENDS_REF[id],
  );
  try {
    const buf = await readFile(file);
    return {
      base64: buf.toString("base64"),
      mediaType: "image/jpeg",
    };
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  if (!getGeminiApiKey()) {
    return NextResponse.json({
      fallback: true,
      reason:
        "Missing GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_API_KEY. Print chrome still works with preview art.",
    });
  }

  try {
    const form = await req.formData();
    const file = form.get("image");
    const palette = String(form.get("palette") || form.get("theme") || "electric");
    const typeLabel = String(form.get("typeLabel") || "");
    const imageModel = String(
      form.get("imageModel") || form.get("GEMINI_IMAGE_MODEL") || "",
    );
    const name = String(form.get("name") || "");
    const hp = String(form.get("hp") || "");
    const caption = String(form.get("caption") || "");
    const attack1Name = String(form.get("attack1Name") || "");
    const attack1Damage = String(form.get("attack1Damage") || "");
    const attack1Text = String(form.get("attack1Text") || "");
    const attack2Name = String(form.get("attack2Name") || "");
    const attack2Damage = String(form.get("attack2Damage") || "");
    const attack2Text = String(form.get("attack2Text") || "");
    const weakness = String(form.get("weakness") || "");
    const resistance = String(form.get("resistance") || "");
    const retreat = String(form.get("retreat") || "");
    const accessory1 = String(form.get("accessory1") || "");
    const accessory2 = String(form.get("accessory2") || "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const mediaType = file.type || "image/jpeg";
    const sourceImage = {
      base64: bytes.toString("base64"),
      mediaType,
    };
    const cardFields = {
      paletteId: palette,
      name,
      hp,
      typeLabel,
      caption,
      attack1Name,
      attack1Damage,
      attack1Text,
      attack2Name,
      attack2Damage,
      attack2Text,
      weakness,
      resistance,
      retreat,
      accessory1,
      accessory2,
    };
    const friendsRef = await loadFriendsReference(palette);
    const common = {
      theme: palette,
      mode: "photo" as const,
      typeLabel,
      sourceImage,
      imageModel: imageModel || undefined,
      cardFields,
    };

    // Portrait for the front art, and one friends scene for the name back.
    // No A4 sheet — Dana & Friends keeps stock back art.
    const [friendsR, portraitR] = await Promise.all([
      generateChibiImage({
        ...common,
        photoKind: "friends-scene",
        referenceImage: friendsRef,
      }),
      generateChibiImage({ ...common, photoKind: "portrait" }),
    ]);

    if (!friendsR.ok && !portraitR.ok) {
      const fail = !portraitR.ok ? portraitR : friendsR;
      return NextResponse.json({
        fallback: true,
        reason: !fail.ok ? fail.reason : "All image generations failed",
        billing: !fail.ok ? fail.billing || false : false,
        httpStatus: !fail.ok ? fail.httpStatus : undefined,
        errorKind: !fail.ok ? fail.errorKind : undefined,
      });
    }

    return NextResponse.json({
      /** Personalized friends scene for {name} & Friends back only. */
      friendsScene: friendsR.ok ? friendsR.image : undefined,
      /** @deprecated alias — same as friendsScene */
      nameBack: friendsR.ok ? friendsR.image : undefined,
      portrait: portraitR.ok ? portraitR.image : undefined,
      provider: "google-gemini",
      model: portraitR.ok
        ? portraitR.model
        : friendsR.ok
          ? friendsR.model
          : undefined,
      styleModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      friendsScenePrompt: friendsR.ok ? friendsR.prompt : undefined,
      portraitPrompt: portraitR.ok ? portraitR.prompt : undefined,
      partial: {
        friendsScene: friendsR.ok,
        nameBack: friendsR.ok,
        portrait: portraitR.ok,
      },
      reason: !portraitR.ok && "reason" in portraitR ? portraitR.reason : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stylize failed";
    return NextResponse.json({ fallback: true, reason: message });
  }
}
