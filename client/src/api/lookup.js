import api from './axios'

export async function lookupBarcode(barcode) {
  try {
    const { data } = await api.get(`/barcodes/${barcode}`)
    if (data.name) return data
  } catch {}

  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await res.json()
    if (data.status !== 1) return null
    const p = data.product
    const n = p.nutriments || {}
    const info = {
      barcode,
      name: p.product_name || p.product_name_en || '',
      category: p.categories_tags?.[0]?.replace('en:', '').replace(/-/g, ' ') || '',
      imageUrl: p.image_front_small_url || p.image_url || '',
      nutrients: {
        calories: n['energy-kcal_100g'] || null,
        protein: n['proteins_100g'] || null,
        carbs: n['carbohydrates_100g'] || null,
        fat: n['fat_100g'] || null,
        fiber: n['fiber_100g'] || null,
        salt: n['salt_100g'] || null,
      },
    }
    if (info.name) api.post('/barcodes', info).catch(() => {})
    return info
  } catch {
    return null
  }
}
