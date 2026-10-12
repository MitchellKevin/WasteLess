// TheMealDB access and matching between recipe ingredients and pantry items
const MEALDB = 'https://www.themealdb.com/api/json/v1/1'

async function getJson(url) {
  try { return await (await fetch(url)).json() } catch { return null }
}

// Ingredient words that rule a recipe out for a diet (checked against TheMealDB ingredient names)
const MEAT = ['chicken', 'beef', 'pork', 'lamb', 'bacon', 'ham', 'sausage', 'turkey', 'duck', 'veal', 'mince', 'chorizo', 'salami', 'prosciutto', 'goat meat']
const FISH = ['fish', 'salmon', 'tuna', 'cod', 'prawn', 'shrimp', 'anchov', 'mackerel', 'haddock', 'sardine', 'crab', 'lobster', 'mussel', 'clam', 'squid', 'oyster']
const DAIRY = ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'yoghurt', 'parmesan', 'mozzarella', 'cheddar', 'ricotta', 'mascarpone', 'feta', 'ghee', 'creme fraiche']
const GLUTEN = ['flour', 'bread', 'pasta', 'spaghetti', 'noodle', 'couscous', 'breadcrumb', 'tortilla', 'pastry', 'lasagne', 'macaroni', 'penne', 'wheat', 'barley', 'bulgur', 'pita', 'baguette', 'soy sauce']
const NUTS = ['almond', 'peanut', 'cashew', 'walnut', 'pecan', 'hazelnut', 'pistachio', 'macadamia', 'pine nut']
const ANIMAL = ['egg', 'honey', 'gelatin']
const BLOCK = {
  vegetarian: [...MEAT, ...FISH],
  vegan: [...MEAT, ...FISH, ...DAIRY, ...ANIMAL],
  'gluten-free': GLUTEN,
  'dairy-free': DAIRY,
  'nut-free': NUTS,
}

// [{ name, measure }] in recipe order
export const ingredientsOf = (meal) =>
  Array.from({ length: 20 }, (_, i) => ({
    name: (meal[`strIngredient${i + 1}`] || '').trim(),
    measure: (meal[`strMeasure${i + 1}`] || '').trim(),
  })).filter((x) => x.name)

export const fitsDiet = (meal, diet) => {
  const names = ingredientsOf(meal).map((i) => i.name.toLowerCase())
  return diet.every((d) => !(BLOCK[d] || []).some((w) => names.some((n) => n.includes(w))))
}

// "Baby spinach" -> ["baby spinach", "spinach"]: TheMealDB knows the last word more often
export const searchTerms = (name) => {
  const words = name.toLowerCase().trim().split(/\s+/)
  return [...new Set([words.join(' '), words[words.length - 1]])].filter((w) => w.length > 2)
}

export const ingredientMatches = (ingredient, itemName) => {
  const ing = ingredient.toLowerCase()
  return searchTerms(itemName).some((term) => ing.includes(term) || term.includes(ing))
}

// Pantry items that appear somewhere in the recipe
export const pantryMatches = (meal, items) =>
  items.filter((item) => ingredientsOf(meal).some((ing) => ingredientMatches(ing.name, item.name)))

// Instructions as separate steps, without "STEP 1" headings or leading numbers
export const stepsOf = (meal) =>
  (meal.strInstructions || '')
    .split(/\r?\n+/)
    .map((line) => line.trim().replace(/^(step\s*\d+[:.)]?|\d+[.)])\s*/i, ''))
    .filter((line) => line && !/^step\s*\d*$/i.test(line) && !/^\d+$/.test(line))

export const youtubeId = (url) => {
  const m = /[?&]v=([\w-]{11})/.exec(url || '') || /youtu\.be\/([\w-]{11})/.exec(url || '')
  return m ? m[1] : null
}

export async function findByIngredient(term) {
  const data = await getJson(`${MEALDB}/filter.php?i=${encodeURIComponent(term)}`)
  return data?.meals || []
}

const cache = new Map()
export async function lookupMeal(id) {
  if (cache.has(id)) return cache.get(id)
  const data = await getJson(`${MEALDB}/lookup.php?i=${encodeURIComponent(id)}`)
  const meal = data?.meals?.[0] || null
  if (meal) cache.set(id, meal)
  return meal
}
