import { useEffect, useState } from 'react'
import api from '../api/axios'

const MS_PER_DAY = 86400000

function daysUntil(dateStr) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const exp = new Date(dateStr)
  exp.setHours(0, 0, 0, 0)
  return Math.round((exp - now) / MS_PER_DAY)
}

async function searchMeals(ingredient) {
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`
    )
    const data = await res.json()
    return data.meals || []
  } catch {
    return []
  }
}

export default function Recipes() {
  const [meals, setMeals] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/items').then(async ({ data }) => {
      const expiring = data
        .filter((i) => { const d = daysUntil(i.expiryDate); return d >= 0 && d <= 7 })
        .slice(0, 4)

      setIngredients(expiring.map((i) => i.name))

      const results = await Promise.all(expiring.map((i) => searchMeals(i.name)))
      const seen = new Set()
      const combined = []
      for (const list of results) {
        for (const meal of list) {
          if (!seen.has(meal.idMeal)) {
            seen.add(meal.idMeal)
            combined.push(meal)
          }
        }
      }
      setMeals(combined.slice(0, 24))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Finding recipes…</div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Recipe Suggestions</h2>
        {ingredients.length > 0 && (
          <p className="page-subtitle">
            Based on items expiring soon: <strong>{ingredients.join(', ')}</strong>
          </p>
        )}
      </div>

      {meals.length === 0 ? (
        <div className="empty-state">
          <p>{ingredients.length === 0
            ? 'No items expiring within 7 days — nothing to suggest recipes for.'
            : 'No recipes found for your expiring items. Try adding more items to your inventory.'
          }</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {meals.map((meal) => (
            <a
              key={meal.idMeal}
              href={`https://www.themealdb.com/meal/${meal.idMeal}`}
              target="_blank"
              rel="noreferrer"
              className="recipe-card"
            >
              <img src={meal.strMealThumb} alt={meal.strMeal} className="recipe-img" />
              <div className="recipe-name">{meal.strMeal}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
