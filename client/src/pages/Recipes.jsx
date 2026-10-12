import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { daysUntil, freezeItem } from '../lib/items'
import { ChevronIcon, SnowflakeIcon } from '../components/Icons'
import { findByIngredient, lookupMeal, fitsDiet, searchTerms, pantryMatches } from '../lib/mealdb'

export default function Recipes() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [params] = useSearchParams()
  const diet = user?.diet || []
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [searching, setSearching] = useState(false)
  const [frozen, setFrozen] = useState(null)

  useEffect(() => {
    api.get('/items').then(({ data }) => {
      const expiring = data
        .map((i) => ({ ...i, days: daysUntil(i.expiryDate) }))
        .filter((i) => i.days >= 0 && i.days <= 7)
        .sort((a, b) => a.days - b.days)
        .slice(0, 8)
      setItems(expiring)
      const wanted = params.get('item')
      const preset = wanted ? expiring.filter((i) => i.name === wanted) : []
      setSelected((preset.length ? preset : expiring.slice(0, 4)).map((i) => i._id))
    }).finally(() => setLoadingItems(false))
  }, [])

  const chosen = useMemo(() => items.filter((i) => selected.includes(i._id)), [items, selected])

  useEffect(() => {
    if (chosen.length === 0) { setRecipes([]); return }
    let cancelled = false
    setSearching(true)
    ;(async () => {
      // Candidate meals per ingredient, ranked by how many chosen items found them
      const hits = new Map()
      for (const item of chosen) {
        for (const term of searchTerms(item.name)) {
          const meals = await findByIngredient(term)
          if (meals.length) {
            for (const m of meals) hits.set(m.idMeal, (hits.get(m.idMeal) || 0) + 1)
            break
          }
        }
      }
      const top = [...hits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
      const details = await Promise.all(top.map(([id]) => lookupMeal(id)))
      const result = details
        .filter(Boolean)
        .filter((meal) => fitsDiet(meal, diet))
        .map((meal) => ({ meal, uses: pantryMatches(meal, items) }))
        .sort((a, b) => b.uses.length - a.uses.length)
      if (!cancelled) { setRecipes(result); setSearching(false) }
    })()
    return () => { cancelled = true }
  }, [chosen, diet.join()])

  if (loadingItems) return <div className="loading" role="status">{t('recipes.loading')}</div>

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const [hero, ...more] = recipes
  const freezable = items.find((i) => i.days <= 1 && (i.location || 'fridge') !== 'freezer' && i._id !== frozen)

  const freeze = async () => {
    await freezeItem(freezable)
    setFrozen(freezable._id)
  }

  return (
    <div className="page recipes">
      <div className="page-header">
        <h1 className="headline">{t('recipes.title')}</h1>
        <p className="page-subtitle">{t('recipes.subtitle')}</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state"><p>{t('recipes.noItems')}</p></div>
      ) : (
        <section aria-labelledby="cooking-with">
          <h2 className="section-title" id="cooking-with">{t('recipes.cookingWith')}</h2>
          <div className="chip-row" role="group" aria-labelledby="cooking-with">
            {items.map((i) => (
              <button key={i._id} type="button" className={`chip${selected.includes(i._id) ? ' active' : ''}`}
                aria-pressed={selected.includes(i._id)} onClick={() => toggle(i._id)}>
                {i.name}
              </button>
            ))}
          </div>
          {diet.length > 0 && (
            <p className="form-hint">
              {t('recipes.dietNote', { diets: diet.map((d) => t(`diet.${d}`)).join(', ') })}{' '}
              <Link to="/settings" className="text-link">{t('recipes.change')}</Link>
            </p>
          )}
        </section>
      )}

      {searching && <div className="loading" role="status">{t('recipes.loading')}</div>}

      {!searching && chosen.length > 0 && recipes.length === 0 && (
        <div className="empty-state"><p>{t('recipes.noRecipes')}</p></div>
      )}

      {!searching && hero && (
        <article className="recipe-hero" aria-labelledby="hero-recipe">
          <img src={hero.meal.strMealThumb} alt="" className="recipe-hero-img" />
          <div className="recipe-hero-body">
            <span className="hero-eyebrow">{hero.uses.length > 0 ? t('recipes.usesCount', { count: hero.uses.length }) : t('recipes.idea')}</span>
            <h2 className="recipe-hero-name" id="hero-recipe">{hero.meal.strMeal}</h2>
            {hero.uses.length > 0 && (
              <ul className="tag-row" aria-label={t('recipes.yourItems')}>
                {hero.uses.map((i) => <li key={i._id} className="tag">{i.name}</li>)}
              </ul>
            )}
            <Link to={`/recipes/${hero.meal.idMeal}`} className="btn btn-hero">{t('recipes.startCooking')}</Link>
          </div>
        </article>
      )}

      {!searching && more.length > 0 && (
        <section className="item-list" aria-labelledby="more-ideas">
          <h2 className="section-heading" id="more-ideas">{t('recipes.moreIdeas')}</h2>
          {more.map(({ meal, uses }) => (
            <Link key={meal.idMeal} to={`/recipes/${meal.idMeal}`} className="recipe-row">
              <img src={meal.strMealThumb} alt="" className="recipe-row-img" loading="lazy" decoding="async" />
              <span className="recipe-row-text">
                <span className="recipe-row-name">{meal.strMeal}</span>
                <span className="item-row-meta">
                  {uses.length > 0 ? t('recipes.uses', { names: uses.map((u) => u.name.toLowerCase()).join(', ') }) : meal.strArea}
                </span>
              </span>
              <ChevronIcon size={20} className="link-card-chevron" />
            </Link>
          ))}
        </section>
      )}

      {freezable && (
        <aside className="tip-card" aria-labelledby="tip-title">
          <h2 className="tip-title" id="tip-title">{t('recipes.notTonight')}</h2>
          <p>{t('recipes.freezeTip', { name: freezable.name })}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={freeze}><SnowflakeIcon size={18} />{t('recipes.freezeNow', { name: freezable.name })}</button>
        </aside>
      )}
      {frozen && <p className="form-hint" role="status">{t('recipes.frozen')}</p>}

      <p className="form-hint">{t('recipes.source')}</p>
    </div>
  )
}
