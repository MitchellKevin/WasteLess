// Typical shelf life per product type, used to suggest expiry dates (WasteLess Plus).
// Days are conservative household estimates for an unopened product bought fresh, per storage
// place, plus how long it keeps once opened. They are suggestions, not food safety advice.
//
// Matching is on words in the item name (Dutch and English); the most specific word wins.
// null means "not a sensible place for this product".

const GUIDE = [
  // ── Sweets and snacks first, so "melkchocolade" doesn't count as milk ──
  { type: 'chocolate', words: ['chocolade', 'chocolate', 'chocola', 'reep'], fridge: 180, freezer: 365, cupboard: 180, opened: 60, place: 'cupboard' },
  { type: 'crisps', words: ['chips', 'crisps', 'nootjes', 'nuts', 'pinda', 'peanut', 'noten'], fridge: null, freezer: null, cupboard: 120, opened: 14, place: 'cupboard' },
  { type: 'biscuits', words: ['koek', 'koekjes', 'biscuit', 'cookies', 'crackers', 'beschuit', 'ontbijtkoek', 'stroopwafel'], fridge: null, freezer: 180, cupboard: 90, opened: 21, place: 'cupboard' },
  { type: 'icecream', words: ['ijs', 'ice cream', 'roomijs', 'magnum', 'ijsjes'], fridge: null, freezer: 180, cupboard: null, opened: 60, place: 'freezer' },

  // ── Dairy ──
  { type: 'sour_cream', words: ['zure room', 'sour cream', 'creme fraiche', 'crème fraîche', 'cremefraiche'], fridge: 14, freezer: 60, cupboard: null, opened: 5, place: 'fridge' },
  { type: 'cream', words: ['slagroom', 'kookroom', 'room', 'cream', 'whipping'], fridge: 10, freezer: 90, cupboard: null, opened: 4, place: 'fridge' },
  { type: 'plant_milk', words: ['havermelk', 'sojamelk', 'amandelmelk', 'oat drink', 'haverdrink', 'sojadrink', 'oatly', 'alpro'], fridge: 7, freezer: null, cupboard: 180, opened: 7, place: 'cupboard' },
  { type: 'buttermilk', words: ['karnemelk', 'buttermilk'], fridge: 10, freezer: null, cupboard: null, opened: 4, place: 'fridge' },
  { type: 'milk', words: ['melk', 'milk', 'halfvol', 'volle melk', 'magere melk'], fridge: 7, freezer: 90, cupboard: null, opened: 4, place: 'fridge' },
  { type: 'yogurt', words: ['yoghurt', 'yogurt', 'kwark', 'skyr', 'vla', 'griekse', 'greek'], fridge: 14, freezer: 60, cupboard: null, opened: 5, place: 'fridge' },
  { type: 'butter', words: ['boter', 'butter', 'roomboter', 'margarine', 'halvarine'], fridge: 60, freezer: 180, cupboard: null, opened: 30, place: 'fridge' },
  { type: 'soft_cheese', words: ['mozzarella', 'ricotta', 'mascarpone', 'roomkaas', 'cream cheese', 'brie', 'camembert', 'feta', 'burrata', 'cottage', 'hüttenkäse', 'zuivelspread', 'philadelphia'], fridge: 14, freezer: 60, cupboard: null, opened: 5, place: 'fridge' },
  { type: 'hard_cheese', words: ['kaas', 'cheese', 'gouda', 'cheddar', 'parmezaan', 'parmesan', 'parmigiano', 'emmentaler', 'old amsterdam', 'geraspte', 'belegen', 'jong belegen', 'oud belegen', 'extra belegen', 'jonge kaas', 'oude kaas', '48+', '30+', 'leerdammer', 'beemster', 'maaslander'], fridge: 30, freezer: 120, cupboard: null, opened: 21, place: 'fridge' },
  { type: 'eggs', words: ['eieren', 'ei ', 'eggs', 'egg', 'scharreleieren', 'vrije uitloop'], fridge: 28, freezer: null, cupboard: 21, opened: 2, place: 'fridge' },

  // ── Meat and fish ──
  { type: 'minced_meat', words: ['gehakt', 'mince', 'minced', 'ground beef', 'tartaar', 'hamburger', 'burger'], fridge: 2, freezer: 90, cupboard: null, opened: 1, place: 'fridge' },
  { type: 'chicken', words: ['kip', 'kipfilet', 'kippendij', 'kippenpoten', 'chicken', 'kalkoen', 'turkey', 'drumstick'], fridge: 3, freezer: 270, cupboard: null, opened: 2, place: 'fridge' },
  { type: 'fish', words: ['vis', 'zalm', 'salmon', 'kabeljauw', 'cod', 'tonijn steak', 'pangasius', 'tilapia', 'garnalen', 'shrimp', 'prawn', 'mosselen', 'mussels', 'fish', 'schelvis', 'makreel', 'haring'], fridge: 2, freezer: 120, cupboard: null, opened: 1, place: 'fridge' },
  { type: 'cold_cuts', words: ['vleeswaren', 'ham', 'salami', 'rookvlees', 'kipfilet beleg', 'boterhamworst', 'cervelaat', 'chorizo', 'prosciutto', 'bacon', 'spek', 'ontbijtspek', 'pastrami'], fridge: 10, freezer: 60, cupboard: null, opened: 4, place: 'fridge' },
  { type: 'sausage', words: ['worst', 'worstjes', 'braadworst', 'rookworst', 'unox', 'sausage', 'knakworst'], fridge: 14, freezer: 60, cupboard: null, opened: 3, place: 'fridge' },
  { type: 'meat', words: ['rund', 'beef', 'biefstuk', 'steak', 'varken', 'pork', 'karbonade', 'speklapje', 'lamsvlees', 'lamb', 'vlees', 'meat', 'shoarma', 'gyros', 'stoofvlees', 'schnitzel'], fridge: 3, freezer: 180, cupboard: null, opened: 2, place: 'fridge' },
  { type: 'meat_substitute', words: ['tofu', 'tempeh', 'vegetarische', 'vegan', 'vegaburger', 'vegetarische burger', 'de vegetarische slager', 'beyond', 'seitan', 'falafel'], fridge: 10, freezer: 90, cupboard: null, opened: 3, place: 'fridge' },

  // ── Ready meals and spreads ──
  { type: 'fresh_meal', words: ['maaltijd', 'kant-en-klaar', 'ready meal', 'pizza', 'lasagne', 'quiche', 'wrap', 'sushi', 'maaltijdsalade', 'pasta salade'], fridge: 3, freezer: 90, cupboard: null, opened: 1, place: 'fridge' },
  { type: 'fresh_pasta', words: ['verse pasta', 'fresh pasta', 'tortellini', 'ravioli', 'gnocchi'], fridge: 14, freezer: 60, cupboard: null, opened: 3, place: 'fridge' },
  { type: 'soup_fresh', words: ['verse soep', 'soep', 'soup'], fridge: 5, freezer: 90, cupboard: 365, opened: 3, place: 'fridge' },
  { type: 'dip', words: ['hummus', 'houmous', 'tzatziki', 'guacamole', 'dip', 'pesto', 'tapenade', 'salsa'], fridge: 14, freezer: 60, cupboard: null, opened: 5, place: 'fridge' },
  { type: 'sauce', words: ['saus', 'sauce', 'ketchup', 'mayonaise', 'mayo', 'mosterd', 'mustard', 'sambal', 'sojasaus', 'dressing'], fridge: 180, freezer: null, cupboard: 365, opened: 60, place: 'cupboard' },
  { type: 'spread', words: ['pindakaas', 'peanut butter', 'jam', 'hagelslag', 'nutella', 'honing', 'honey', 'appelstroop', 'chocopasta'], fridge: null, freezer: null, cupboard: 365, opened: 90, place: 'cupboard' },

  // ── Bakery ──
  { type: 'bread', words: ['brood', 'bread', 'bolletjes', 'broodjes', 'stokbrood', 'baguette', 'croissant', 'pistolet', 'volkoren', 'casino', 'krentenbol', 'bagel', 'pita', 'naan', 'tortilla', 'sourdough', 'loaf', 'desem'], fridge: null, freezer: 90, cupboard: 3, opened: 3, place: 'cupboard' },
  { type: 'cake', words: ['taart', 'cake', 'gebak', 'muffin', 'brownie', 'appeltaart', 'tompouce', 'donut'], fridge: 4, freezer: 90, cupboard: 3, opened: 3, place: 'fridge' },

  // ── Vegetables ──
  { type: 'salad', words: ['sla', 'salade', 'salad', 'rucola', 'veldsla', 'ijsbergsla', 'lettuce', 'spinazie', 'spinach', 'andijvie', 'kropsla', 'babyleaf'], fridge: 4, freezer: null, cupboard: null, opened: 2, place: 'fridge' },
  { type: 'herbs', words: ['kruiden', 'herbs', 'basilicum', 'peterselie', 'koriander', 'bieslook', 'dille', 'munt', 'basil', 'parsley', 'cilantro'], fridge: 5, freezer: 90, cupboard: null, opened: 3, place: 'fridge' },
  { type: 'mushrooms', words: ['champignons', 'mushrooms', 'paddenstoelen', 'kastanjechampignons', 'oesterzwam'], fridge: 5, freezer: null, cupboard: null, opened: 3, place: 'fridge' },
  { type: 'berries', words: ['aardbeien', 'strawberries', 'frambozen', 'raspberries', 'blauwe bessen', 'blueberries', 'bessen', 'berries', 'bramen'], fridge: 4, freezer: 240, cupboard: null, opened: 2, place: 'fridge' },
  { type: 'soft_veg', words: ['tomaat', 'tomaten', 'tomato', 'komkommer', 'cucumber', 'courgette', 'zucchini', 'paprika', 'pepper', 'aubergine', 'avocado', 'sperziebonen', 'green beans', 'broccoli', 'bloemkool', 'cauliflower', 'asperges', 'asparagus', 'prei', 'leek', 'spitskool', 'boerenkool', 'peultjes', 'maïs', 'bleekselderij', 'radijs'], fridge: 7, freezer: 240, cupboard: 4, opened: 3, place: 'fridge' },
  { type: 'root_veg', words: ['wortel', 'wortels', 'wortelen', 'carrot', 'bieten', 'rode biet', 'beetroot', 'pastinaak', 'knolselderij', 'witlof', 'rode kool', 'witte kool', 'kool', 'cabbage'], fridge: 21, freezer: 240, cupboard: 7, opened: 4, place: 'fridge' },
  { type: 'potatoes', words: ['aardappel', 'aardappelen', 'aardappels', 'kriel', 'potato', 'potatoes', 'zoete aardappel', 'sweet potato'], fridge: null, freezer: null, cupboard: 21, opened: 3, place: 'cupboard' },
  { type: 'onions', words: ['ui', 'uien', 'onion', 'onions', 'rode ui', 'sjalot', 'shallot', 'knoflook', 'garlic', 'gember', 'ginger'], fridge: null, freezer: null, cupboard: 30, opened: 7, place: 'cupboard' },
  { type: 'frozen_veg', words: ['diepvries', 'frozen', 'doperwten', 'erwten', 'peas', 'spinazie diepvries', 'wokgroente', 'friet', 'patat', 'fries', 'roerbakgroente'], fridge: 2, freezer: 300, cupboard: null, opened: 30, place: 'freezer' },

  // ── Fruit ──
  { type: 'bananas', words: ['banaan', 'bananen', 'banana', 'bananas'], fridge: null, freezer: 90, cupboard: 5, opened: 1, place: 'cupboard' },
  { type: 'citrus', words: ['sinaasappel', 'sinaasappels', 'mandarijn', 'mandarijnen', 'citroen', 'citroenen', 'limoen', 'lemon', 'lime', 'orange', 'oranges', 'grapefruit'], fridge: 21, freezer: null, cupboard: 10, opened: 2, place: 'cupboard' },
  { type: 'hard_fruit', words: ['appel', 'appels', 'apple', 'apples', 'peer', 'peren', 'pear', 'pears'], fridge: 30, freezer: null, cupboard: 10, opened: 1, place: 'cupboard' },
  { type: 'soft_fruit', words: ['druiven', 'grapes', 'kiwi', 'mango', 'ananas', 'pineapple', 'meloen', 'melon', 'perzik', 'nectarine', 'pruimen', 'kersen', 'cherries', 'fruit'], fridge: 6, freezer: 240, cupboard: 3, opened: 2, place: 'fridge' },

  // ── Drinks ──
  { type: 'fresh_juice', words: ['verse jus', 'versgeperst', 'fresh juice', 'smoothie'], fridge: 4, freezer: 90, cupboard: null, opened: 3, place: 'fridge' },
  { type: 'juice', words: ['sap', 'juice', 'jus d\'orange', 'appelsap', 'sinaasappelsap', 'multivruchten'], fridge: 30, freezer: null, cupboard: 180, opened: 7, place: 'cupboard' },
  { type: 'soft_drinks', words: ['cola', 'frisdrank', 'limonade', 'ranja', 'ice tea', 'fanta', 'sprite', 'tonic', 'spa', 'water', 'bier', 'beer', 'wijn', 'wine'], fridge: 180, freezer: null, cupboard: 365, opened: 3, place: 'cupboard' },

  // ── Cupboard ──
  { type: 'canned', words: ['blik', 'conserven', 'canned', 'tin', 'tomatenblokjes', 'passata', 'kikkererwten', 'chickpeas', 'kokosmelk', 'kidneybonen', 'bonen in', 'tonijn', 'tuna', 'mais in', 'kokosmelk', 'coconut milk'], fridge: null, freezer: null, cupboard: 730, opened: 3, place: 'cupboard' },
  { type: 'dry_goods', words: ['pasta', 'spaghetti', 'macaroni', 'penne', 'fusilli', 'noedels', 'noodles', 'mie', 'rijst', 'rice', 'couscous', 'bulgur', 'quinoa', 'meel', 'bloem', 'flour', 'suiker', 'sugar', 'havermout', 'oats', 'muesli', 'cornflakes', 'cereal', 'granola', 'linzen', 'lentils'], fridge: null, freezer: null, cupboard: 365, opened: 120, place: 'cupboard' },
  { type: 'coffee_tea', words: ['koffie', 'coffee', 'thee', 'tea', 'cacao', 'koffiebonen', 'nespresso', 'senseo'], fridge: null, freezer: null, cupboard: 365, opened: 60, place: 'cupboard' },
  { type: 'oil', words: ['olie', 'oil', 'olijfolie', 'olive oil', 'azijn', 'vinegar'], fridge: null, freezer: null, cupboard: 365, opened: 180, place: 'cupboard' },
]

// Lowercase, accents removed, punctuation to spaces; padded so ' ei ' can match a whole word
const normalize = (text) => ` ${String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()} `

// How a guide word may match, so Dutch compound words work without false hits:
//  - 5+ letters: anywhere in a word ("chocolade" in "melkchocolade")
//  - 4 letters: at the start of a word ("zalm" in "zalmfilet")
//  - 1–3 letters: only as a whole word, or with a plural ending ("ui"/"uien" but not "fruit")
function matches(haystack, word) {
  const w = normalize(word).trim()
  if (!w) return false
  if (w.length >= 5) return haystack.includes(w)
  if (w.length === 4) return haystack.includes(` ${w}`)
  return [' ', 's ', 'en '].some((end) => haystack.includes(` ${w}${end}`))
}

// The most specific (longest) matching word wins: "roomboter" is butter, not cream
function findType(name, category) {
  const text = normalize(`${name} ${category || ''}`)
  let best = null, bestLength = 0
  for (const entry of GUIDE) {
    for (const word of entry.words) {
      const length = normalize(word).trim().length
      if (length > bestLength && matches(text, word)) { best = entry; bestLength = length }
    }
  }
  return best
}

// Best storage place and days for a product, or null when we don't recognise it
function guideFor(name, { category, location, opened } = {}) {
  const entry = findType(name, category)
  if (!entry) return null
  const place = location && entry[location] != null ? location : entry.place
  const days = opened ? entry.opened : entry[place]
  if (days == null) return null
  return { type: entry.type, location: place, days, openedDays: entry.opened }
}

module.exports = { guideFor, findType, normalize, GUIDE }
