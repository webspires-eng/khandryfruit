import sharp from "sharp";

const MAX_BYTES = 8_000_000;
const MAX_DIMENSION = 8_000;
const MAX_PIXELS = 40_000_000;

type RasterFormat = "jpeg" | "png" | "webp" | "avif";

export type ValidatedImage = {
  bytes: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
  sourceFormat: RasterFormat;
};

function detectedFormat(bytes: Uint8Array): RasterFormat | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return "jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "png";
  if (
    bytes.length >= 12 &&
    Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP"
  )
    return "webp";
  if (
    bytes.length >= 12 &&
    Buffer.from(bytes.subarray(4, 8)).toString("ascii") === "ftyp" &&
    ["avif", "avis"].includes(
      Buffer.from(bytes.subarray(8, 12)).toString("ascii"),
    )
  )
    return "avif";
  return null;
}

export async function validateAndReencodeImage(
  input: Uint8Array,
): Promise<ValidatedImage> {
  if (input.byteLength === 0 || input.byteLength > MAX_BYTES)
    throw new Error("INVALID_IMAGE_SIZE");
  const sourceFormat = detectedFormat(input);
  if (!sourceFormat) throw new Error("INVALID_IMAGE_SIGNATURE");

  const image = sharp(input, {
    failOn: "warning",
    limitInputPixels: MAX_PIXELS,
    sequentialRead: true,
  });
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (
    width < 1 ||
    height < 1 ||
    width > MAX_DIMENSION ||
    height > MAX_DIMENSION ||
    width * height > MAX_PIXELS
  )
    throw new Error("INVALID_IMAGE_DIMENSIONS");

  const bytes = await image
    .rotate()
    .toColorspace("srgb")
    .webp({ quality: 86, effort: 4 })
    .toBuffer();
  return { bytes, contentType: "image/webp", width, height, sourceFormat };
}
