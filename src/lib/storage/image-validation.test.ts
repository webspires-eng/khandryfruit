import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { validateAndReencodeImage } from "./image-validation";

describe("image upload validation", () => {
  it.each(["jpeg", "png", "webp"] as const)(
    "decodes and re-encodes valid %s",
    async (format) => {
      const source = await sharp({
        create: { width: 8, height: 6, channels: 3, background: "#315b3b" },
      })
        .toFormat(format)
        .toBuffer();
      const result = await validateAndReencodeImage(source);
      expect(result.contentType).toBe("image/webp");
      expect(result.sourceFormat).toBe(format);
      expect(result.width).toBe(8);
      expect(result.height).toBe(6);
      expect((await sharp(result.bytes).metadata()).format).toBe("webp");
    },
  );

  it.each([
    Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"),
    Buffer.from("not an image"),
    Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01]),
  ])("rejects SVG, non-image, and malformed payloads", async (source) => {
    await expect(validateAndReencodeImage(source)).rejects.toThrow();
  });

  it("rejects an excessive pixel count", async () => {
    const header = await sharp({
      create: { width: 8_000, height: 5_001, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();
    await expect(validateAndReencodeImage(header)).rejects.toThrow();
  });
});
