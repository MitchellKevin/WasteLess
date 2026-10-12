import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { daysUntil, expiryLabel, urgency, finishItem } from '../lib/items'
import { lookupMeal, ingredientsOf, ingredientMatches, stepsOf, youtubeId } from '../lib/mealdb'
import { BackIcon, CheckIcon } from '../components/Icons'

export default function RecipeDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [meal, setMeal] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [used, setUsed] = useState([])
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    Promise.all([lookupMeal(id), api.get('/items').then((r) => r.data).catch(() => [])])
      .then(([m, list]) => {
        setMeal(m)
        setItems(list)
        if (m) {
          const ings = ingredientsOf(m)
          setUsed(list.filter((it) => ings.some((ing) => ingredientMatches(ing.name, it.name))).map((it) => it._id))
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading" role="status">{t('recipes.loading')}</div>
  if (!meal) {
    return (
      <div className="empty-state">
        <p>{t('recipe.notFound')}</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/recipes')}>{t('recipe.toRecipes')}</button>
      </div>
    )
  }

  const ingredients = ingredientsOf(meal).map((ing) => ({
    ...ing,
    have: items.find((it) => ingredientMatches(ing.name, it.name)),
  }))
  const matched = items.filter((it) => ingredients.some((ing) => ing.have?._id === it._id))
  const steps = stepsOf(meal)
  const video = youtubeId(meal.strYoutube)
  const tags = [meal.strCategory, meal.strArea].filter(Boolean)

  const toggleUsed = (itemId) => setUsed((prev) => (prev.includes(itemId) ? prev.filter((x) => x !== itemId) : [...prev, itemId]))

  const cooked = async () => {
    setSaving(true)
    try {
      for (const it of matched.filter((m) => used.includes(m._id))) await finishItem(it, 'consumed')
      setItems((prev) => prev.filter((it) => !used.includes(it._id)))
      setDone(true)
    } finally { setSaving(false) }
  }

  return (
    <article className="page recipe-detail" aria-labelledby="recipe-title">
      <div className="detail-bar">
        <button type="button" className="btn btn-ghost btn-sm btn-back" onClick={() => navigate(-1)}><BackIcon size={20} />{t('detail.back')}</button>
      </div>

      <img src={meal.strMealThumb} alt="" className="recipe-detail-img" />

      <div className="page-header">
        {tags.length > 0 && <p className="eyebrow">{tags.join(' · ')}</p>}
        <h1 className="headline" id="recipe-title">{meal.strMeal}</h1>
        <p className="page-subtitle">
          {t('recipe.summary', { count: ingredients.length, have: ingredients.filter((i) => i.have).length })}
        </p>
      </div>

      <section className="card" aria-labelledby="ingredients-title">
        <h2 className="card-title" id="ingredients-title">{t('recipe.ingredients')}</h2>
        <ul className="ingredient-list">
          {ingredients.map((ing, i) => {
            const days = ing.have ? daysUntil(ing.have.expiryDate) : null
            return (
              <li key={i} className={`ingredient${ing.have ? ' ingredient--have' : ''}`}>
                <span className="ingredient-measure">{ing.measure}</span>
                <span className="ingredient-name">{ing.name}</span>
                {ing.have && (
                  <span className={`ingredient-have when--${urgency(days)}`}>
                    <CheckIcon size={14} />{days <= 7 ? expiryLabel(t, days) : t('recipe.inPantry')}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="steps-title">
        <h2 className="section-heading" id="steps-title">{t('recipe.method')}</h2>
        <ol className="step-list">
          {steps.map((step, i) => (
            <li key={i} className="step">
              <span className="step-number" aria-hidden="true">{i + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {video && (
        <section aria-labelledby="video-title">
          <h2 className="section-heading" id="video-title">{t('recipe.video')}</h2>
          <div className="video-frame">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video}`}
              title={t('recipe.videoTitle', { name: meal.strMeal })}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {matched.length > 0 && !done && (
        <section className="card cooked-card" aria-labelledby="cooked-title">
          <h2 className="card-title" id="cooked-title">{t('recipe.cooked')}</h2>
          <p className="card-note">{t('recipe.cookedDesc')}</p>
          <ul className="cooked-list">
            {matched.map((it) => (
              <li key={it._id}>
                <label className="cooked-item">
                  <input type="checkbox" checked={used.includes(it._id)} onChange={() => toggleUsed(it._id)} />
                  <span>{it.name}</span>
                  <span className="item-row-meta">{it.quantity} {it.unit}</span>
                </label>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-primary" onClick={cooked} disabled={saving || used.length === 0}>
            <CheckIcon size={20} />{t('recipe.markUsed', { count: used.length })}
          </button>
        </section>
      )}
      {done && <div className="alert alert-success" role="status">{t('recipe.marked')}</div>}

      <p className="form-hint">{t('recipes.source')}</p>
    </article>
  )
}
