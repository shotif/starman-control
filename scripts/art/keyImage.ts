// Reads a candidate, keys it to transparency (scripts/art/keying.ts) and hands it back as a sharp
// image ready to scale and save, with the box it was trimmed to. Shared by art:key and art:approve.

import sharp, { type Sharp } from 'sharp';
import { type Box, type KeySpec, keyPicture } from './keying.ts';

export async function keyedImage(path: string, spec: KeySpec): Promise<{ image: Sharp; crop: Box | null }> {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { raster, crop } = keyPicture(
    { data: new Uint8Array(data.buffer, data.byteOffset, data.byteLength), width: info.width, height: info.height },
    spec,
  );
  const keyed = sharp(Buffer.from(raster.data), { raw: { width: raster.width, height: raster.height, channels: 4 } });
  // Extracting needs the pixels decoded first: round-trip through a lossless PNG.
  const png = await keyed.png().toBuffer();
  return { image: crop ? sharp(png).extract(crop) : sharp(png), crop };
}
