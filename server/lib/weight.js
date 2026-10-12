// Rough weight estimate so impact can be shown in kg.
// Items without a weight-like unit count as 250 g each.
const PER_ITEM_KG = 0.25

module.exports = function estimateKg(quantity = 1, unit = '') {
  const q = Number(quantity) || 0
  switch (String(unit).trim().toLowerCase()) {
    case 'kg': case 'l': case 'liter': case 'litre': return q
    case 'g': case 'gr': case 'ml': return q / 1000
    case 'cl': return q / 100
    case 'dl': return q / 10
    default: return q * PER_ITEM_KG
  }
}
