import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import sharp from "sharp";
import {
  getAuthenticatedUser,
  getUserRole,
} from "../../../../lib/auth-route-utils";
import { createSupabaseAdminClient } from "../../../../lib/supabase-server";

// Vercel Functions accept request bodies up to 4.5 MB. Leave headroom for
// multipart metadata instead of advertising an upload size that cannot reach
// this handler in production.
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_DIMENSION = 2048;

function validateImageBuffer(buffer, mimetype) {
  if (buffer.length > MAX_FILE_SIZE) return false;
  if (!buffer || buffer.length === 0) return false;
  if (mimetype === "image/jpeg") {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }
  if (mimetype === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }
  if (mimetype === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString() === "RIFF" &&
      buffer.subarray(8, 12).toString() === "WEBP"
    );
  }
  if (mimetype === "image/avif") {
    return (
      buffer.length >= 16 &&
      buffer.subarray(4, 8).toString() === "ftyp" &&
      ["avif", "avis"].includes(buffer.subarray(8, 12).toString())
    );
  }
  return false;
}

export async function POST(request) {
  const cookieStore = await cookies();
  const supabase = createSupabaseAdminClient();
  const { user } = await getAuthenticatedUser(supabase, cookieStore);

  if (!user || getUserRole(user) !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No image file provided" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validateImageBuffer(buffer, file.type)) {
    return NextResponse.json(
      { error: "The uploaded file is not a valid image" },
      { status: 400 },
    );
  }

  try {
    const metadata = await sharp(buffer, {
      limitInputPixels: MAX_DIMENSION * MAX_DIMENSION,
    }).metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > MAX_DIMENSION ||
      metadata.height > MAX_DIMENSION
    ) {
      return NextResponse.json(
        {
          error: `Image dimensions must not exceed ${MAX_DIMENSION}x${MAX_DIMENSION}px`,
        },
        { status: 400 },
      );
    }

    const optimizedImage = await sharp(buffer, {
      limitInputPixels: MAX_DIMENSION * MAX_DIMENSION,
    })
      .rotate()
      .webp({ quality: 88, effort: 4 })
      .toBuffer();

    const uniqueFilename = `${Date.now()}-${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(uniqueFilename, optimizedImage, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(uniqueFilename);
    return NextResponse.json(
      {
        message: "Image uploaded successfully!",
        imageUrl: publicUrlData.publicUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message || "The uploaded file is not a supported, valid image",
      },
      { status: 400 },
    );
  }
}
