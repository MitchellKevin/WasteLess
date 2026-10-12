// Reads the text of a receipt photo on the device (nothing is uploaded).
// The photo is cleaned up first: text recognition is much more reliable on a large,
// high-contrast, black-and-white image than on a dim phone photo.

const TARGET_WIDTH = 1600 // receipts are narrow; this gives the letters enough pixels

async function loadImage(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Otsu's method: the grey level that best separates ink from paper
function otsuThreshold(histogram, total) {
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * histogram[i]
  let sumB = 0, weightB = 0, best = 0, threshold = 128
  for (let i = 0; i < 256; i++) {
    weightB += histogram[i]
    if (!weightB) continue
    const weightF = total - weightB
    if (!weightF) break
    sumB += i * histogram[i]
    const between = weightB * weightF * (sumB / weightB - (sum - sumB) / weightF) ** 2
    if (between > best) { best = between; threshold = i }
  }
  return threshold
}

// Scale, greyscale, stretch contrast and turn into black text on white
export async function prepareReceiptImage(file) {
  const img = await loadImage(file)
  const scale = Math.min(3, Math.max(0.5, TARGET_WIDTH / img.naturalWidth))
  const width = Math.round(img.naturalWidth * scale)
  const height = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)

  const image = ctx.getImageData(0, 0, width, height)
  const px = image.data
  const grey = new Uint8ClampedArray(width * height)
  const histogram = new Array(256).fill(0)
  let min = 255, max = 0
  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    const g = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000
    grey[j] = g
    if (g < min) min = g
    if (g > max) max = g
  }
  // Stretch contrast so faded thermal print becomes darker
  const range = Math.max(1, max - min)
  for (let j = 0; j < grey.length; j++) {
    grey[j] = ((grey[j] - min) * 255) / range
    histogram[grey[j]]++
  }
  const threshold = otsuThreshold(histogram, grey.length)
  for (let i = 0, j = 0; i < px.length; i += 4, j++) {
    const v = grey[j] > threshold ? 255 : 0
    px[i] = px[i + 1] = px[i + 2] = v
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

// Text of the receipt, with progress updates (0–100)
export async function readReceiptText(file, onProgress) {
  const canvas = await prepareReceiptImage(file)
  const { createWorker, PSM } = await import('tesseract.js')
  const worker = await createWorker(['nld', 'eng'], 1, {
    logger: (m) => { if (m.status === 'recognizing text') onProgress?.(Math.round(m.progress * 100)) },
  })
  try {
    await worker.setParameters({
      // One uniform block: keeps the price column on the same line as the product.
      // (Single-column mode dropped the prices on Jumbo and Lidl receipts in testing.)
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1',
    })
    const { data } = await worker.recognize(canvas)
    return data.text
  } finally {
    await worker.terminate()
  }
}
