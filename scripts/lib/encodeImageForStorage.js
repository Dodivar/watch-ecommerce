import sharp from 'sharp'

import {
  UPLOAD_IMAGE_MAX_DIMENSION,
  UPLOAD_IMAGE_WEBP_QUALITY,
  fitWithin,
} from '../../packages/base/src/utils/imageEncoding.js'

/**
 * Pendant Node de `@/services/imageCompressionService.js` : mêmes dimensions,
 * même qualité, mêmes contraintes — l'un tourne dans le navigateur de l'admin,
 * l'autre dans les scripts d'import et de reprise.
 *
 * @param {Buffer} input
 * @returns {Promise<{ buffer: Buffer, width: number, height: number, sourceWidth: number, sourceHeight: number }>}
 * @throws {Error} si `input` n'est pas une image décodable
 */
export async function encodeImageForStorage(input) {
  const pipeline = sharp(input, { failOn: 'error' }).rotate()
  const metadata = await pipeline.metadata()

  // `metadata` décrit l'image stockée ; `rotate()` échange les côtés pour les
  // orientations EXIF 5 à 8, il faut mesurer la cible sur l'image redressée.
  const isQuarterTurn = (metadata.orientation ?? 1) >= 5
  const sourceWidth = (isQuarterTurn ? metadata.height : metadata.width) ?? 0
  const sourceHeight = (isQuarterTurn ? metadata.width : metadata.height) ?? 0

  const target = fitWithin(sourceWidth, sourceHeight, UPLOAD_IMAGE_MAX_DIMENSION)

  const buffer = await pipeline
    .resize({
      width: target.width || undefined,
      height: target.height || undefined,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: Math.round(UPLOAD_IMAGE_WEBP_QUALITY * 100) })
    .toBuffer()

  return {
    buffer,
    width: target.width,
    height: target.height,
    sourceWidth,
    sourceHeight,
  }
}
