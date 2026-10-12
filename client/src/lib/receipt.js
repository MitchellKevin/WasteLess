// Turns the OCR text of a (Dutch) supermarket receipt into products.
// Handles Albert Heijn, Jumbo, Lidl, Plus, Aldi, Dirk and similar layouts:
//   "1 AH HALFVOLLE MELK      1,09"         quantity column first (AH)
//   "2 KIPFILET  2,49  4,98"                quantity, unit price, total
//   "JUMBO BANANEN            1,79"  then "2 x 1,79"
//   "Halfvolle melk        1,05 B"          VAT class after the price (Lidl)
//   "0,512 kg x 2,99 EUR/kg   1,53"         weighed products
// Discounts, deposit, bags, totals, payment lines and non-food are left out.

const STORES = [
  ['ah', /albert\s*heijn|\bah\b.*(bonus|to go)|ah\.nl/i],
  ['jumbo', /jumbo/i],
  ['lidl', /lidl/i],
  ['plus', /\bplus\b.*(supermarkt|retail)|plus\.nl/i],
  ['aldi', /aldi/i],
  ['dirk', /dirk\s*(van den broek)?/i],
  ['coop', /\bcoop\b/i],
  ['spar', /\bspar\b/i],
]

// Lines that end the product list
const END = /^(sub)?tota(a)?l\b|te betalen|totaal|\bbetaald\b|^bedrag\b|^pin\b|^betaling|^wisselgeld|^contant|^bankpas|^maestro|^v[- ]?pay|^visa|^mastercard/i
// Lines that are never a product
const SKIP = new RegExp([
  'bonus', 'korting', 'voordeel', 'actie', 'aanbieding', 'gratis', 'zegel', 'koopzegel', 'spaarzegel', 'airmiles', 'air miles',
  'statiegeld', 'emballage', 'retour', '\\btas\\b', 'draagtas', 'plastic tas', 'papieren tas', 'tasje',
  'btw', 'b\\.t\\.w', '\\bvat\\b', 'excl', 'incl', 'kassa', 'kassier', 'bon nr', 'bonnr', 'transactie', 'terminal', 'autorisatie',
  'klantenkaart', 'bonuskaart', '\\bdatum\\b', '\\btijd\\b', '\\bbon\\b', 'pas nr', 'kaartnummer', 'filiaal', 'winkel', 'openingstijden', 'bedankt', 'tot ziens', 'www\\.', 'tel[.:]',
  'aantal\\s+omschrijving', 'omschrijving', 'prijs\\s+bedrag', '\\beur/kg\\b$',
].join('|'), 'i')
// Non-food: not something for the pantry
const NON_FOOD = new RegExp([
  'shampoo', 'conditioner', 'douche', 'zeep', 'tandpasta', 'tandenborstel', '\\bdeo', 'scheer', 'luier', 'maandverband', 'tampon',
  'wasmiddel', 'wasverzachter', 'afwas', 'vaatwas', 'allesreiniger', 'schoonmaak', 'wc[- ]', 'toiletpapier', 'keukenrol', 'tissues', 'zakdoek',
  'vuilniszak', 'afvalzak', 'aluminiumfolie', 'huishoudfolie', 'bakpapier', 'diepvrieszak', 'batterij', 'lamp', 'kaars', 'aansteker',
  'sigaret', 'tabak', 'tijdschrift', 'krant', 'cadeaukaart', 'giftcard', 'bloemen', 'boeket', 'plant\\b', 'kattenvoer', 'hondenvoer', 'kattenbak',
].join('|'), 'i')

// Brand and store prefixes that say nothing about the product
const PREFIXES = /^(ah|ah biologisch|ah excellent|ah terra|jumbo|plus|lidl|aldi|dirk|g'?woon|perfekt|milbona|1 de beste|coop|spar|bio|biologisch|euro shopper|hollandia|campina|zaanlander|unox|calvé|calve)\s+/i
// Receipt abbreviations → words
const ABBREVIATIONS = [
  [/\bhv\b|\bhalfv\b|\bhalfvol\b/, 'halfvolle'], [/\bvl\b/, 'volle'], [/\bmag\b/, 'magere'], [/\bkarnem\b/, 'karnemelk'],
  [/\byogh\b|\byog\b/, 'yoghurt'], [/\bkipfil\b|\bkipfi\b/, 'kipfilet'], [/\bgeh\b/, 'gehakt'], [/\brundergeh\b/, 'rundergehakt'],
  [/\bh\/?r\b/, 'half-om-half'], [/\bvolk\b/, 'volkoren'], [/\bbrd\b/, 'brood'], [/\baardapp\b|\baardap\b/, 'aardappelen'],
  [/\bkomk\b/, 'komkommer'], [/\bchamp\b|\bchampign\b/, 'champignons'], [/\bsinaasapp\b|\bsinaasap\b/, 'sinaasappels'],
  [/\bjong bel\b/, 'jong belegen'], [/\bbel\b/, 'belegen'], [/\bgesn\b/, 'gesneden'], [/\bgeraspt\b/, 'geraspte'],
  [/\bpl\b/, 'plakken'], [/\bstk\b|\bst\b/, 'stuks'],
  [/\bscharrel\b/, 'scharreleieren'], [/\bvr uitloop\b/, 'vrije uitloop'], [/\bdiepvr\b/, 'diepvries'],
]
// Pack sizes like 500G, 1L, 1,5 L, 6ST, 4X125G
const SIZE = /\b\d+([.,]\d+)?\s*(x\s*\d+([.,]\d+)?\s*)?(g|gr|gram|kg|ml|cl|l|ltr|liter|st|stuks|pak|pk|stk)\b\.?/gi

const PRICE = '(-?\\d{1,3}[.,]\\d{2})'
const toNumber = (s) => Number(String(s).replace(',', '.'))

// OCR sometimes reads O for 0 and drops the decimal comma ("109" for "1,09")
function cleanLine(line) {
  let l = line
    .replace(/[|_~`"“”]/g, ' ')
    .replace(/(\d)[oO](\d)/g, '$10$2')
    .replace(/(^|\s)[oO]([.,]\d{2})\b/g, '$10$2') // "O,89" → "0,89"
    .replace(/(\d)\s+([.,])\s*(\d{2})\b/g, '$1$2$3')
    .replace(/\s+/g, ' ')
    .trim()
  // "1 09" at the end of a line without a proper price → "1,09"
  if (!/\d[.,]\d{2}(\s*[A-D]{1,2})?$/.test(l)) l = l.replace(/\s(\d{1,3})\s(\d{2})(\s*[A-D]{1,2})?$/, ' $1,$2$3')
  return l
}

function cleanName(raw) {
  let name = ` ${raw.toLowerCase()} `.replace(SIZE, ' ').replace(/[*#=]+/g, ' ').replace(/\s+/g, ' ').trim()
  for (let i = 0; i < 2; i++) name = name.replace(PREFIXES, '')
  for (const [pattern, word] of ABBREVIATIONS) name = name.replace(pattern, word)
  name = name.replace(/[^a-z0-9àâäéèêëïîôöùûüç'&+\- ]/gi, ' ').replace(/\s+/g, ' ').trim()
  return name ? name[0].toUpperCase() + name.slice(1) : ''
}

const looksLikeName = (s) => /[a-zà-ÿ]{3,}/i.test(s)

export function detectStore(text) {
  const head = text.split('\n').slice(0, 12).join(' ')
  return (STORES.find(([, re]) => re.test(head)) || [null])[0]
}

export function parseReceipt(text) {
  const lines = String(text || '').split('\n').map(cleanLine).filter(Boolean)
  const store = detectStore(text)
  const items = []
  let started = false

  for (const line of lines) {
    if (END.test(line) && started) break
    const last = items[items.length - 1]

    // "2 x 1,19" / "2 X 1.19 2,38": quantity of the line above
    let m = line.match(new RegExp(`^(\\d{1,2})\\s*[xX×*]\\s*${PRICE}(?:\\s+${PRICE})?$`))
    if (m && last) { last.quantity = Number(m[1]); last.price = toNumber(m[3] || m[2]) * (m[3] ? 1 : Number(m[1])); continue }

    // "0,512 kg x 2,99 EUR/kg 1,53": weight of the line above (or of this line if it has a name)
    m = line.match(new RegExp(`(\\d+[.,]\\d{1,3})\\s*kg\\s*[xX×*]\\s*(?:€\\s*)?${PRICE}(?:\\s*(?:eur)?\\s*/\\s*kg)?(?:\\s+${PRICE})?`, 'i'))
    if (m) {
      const kg = toNumber(m[1])
      const namePart = line.slice(0, m.index).trim()
      if (looksLikeName(namePart) && !SKIP.test(namePart)) {
        items.push({ rawName: namePart, quantity: kg, unit: 'kg', price: toNumber(m[3] || m[2]) * (m[3] ? 1 : kg) })
        started = true
      } else if (last) { last.quantity = kg; last.unit = 'kg'; if (m[3]) last.price = toNumber(m[3]) }
      continue
    }

    if (SKIP.test(line)) continue

    // [qty] NAME [unit price] PRICE [VAT class]
    m = line.match(new RegExp(`^(?:(\\d{1,2})\\s+)?(.+?)\\s+(?:${PRICE}\\s+)?${PRICE}(?:\\s*[A-D]{1,2})?$`))
    if (!m) continue
    const [, qty, rawName, unitPrice, total] = m
    if (!looksLikeName(rawName)) continue
    const price = toNumber(total)
    if (price <= 0 || price > 250) continue // negative = discount; very high = total or OCR error
    const quantity = qty ? Number(qty) : unitPrice ? Math.round(price / toNumber(unitPrice)) || 1 : 1
    items.push({ rawName, quantity, unit: 'item', price })
    started = true
  }

  // Clean names, drop non-food, and merge repeated lines of the same product
  const merged = []
  for (const it of items) {
    if (NON_FOOD.test(it.rawName)) continue
    const name = cleanName(it.rawName)
    if (!looksLikeName(name)) continue
    const same = merged.find((m) => m.name.toLowerCase() === name.toLowerCase() && m.unit === it.unit)
    if (same) { same.quantity = Math.round((same.quantity + it.quantity) * 1000) / 1000; same.price = Math.round((same.price + it.price) * 100) / 100 }
    else merged.push({ name, rawName: it.rawName, quantity: it.quantity, unit: it.unit, price: Math.round(it.price * 100) / 100 })
  }
  return { store, items: merged }
}
