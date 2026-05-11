import { useTranslation } from 'react-i18next'

export default function NutritionPanel({ nutrients }) {
  const { t } = useTranslation()
  if (!nutrients || !nutrients.calories) return null

  const rows = [
    { key: 'calories', value: nutrients.calories, unit: t('nutrition.kcal') },
    { key: 'protein', value: nutrients.protein, unit: t('nutrition.g') },
    { key: 'carbs', value: nutrients.carbs, unit: t('nutrition.g') },
    { key: 'fat', value: nutrients.fat, unit: t('nutrition.g') },
    { key: 'fiber', value: nutrients.fiber, unit: t('nutrition.g') },
    { key: 'salt', value: nutrients.salt, unit: t('nutrition.g') },
  ].filter((r) => r.value != null && r.value > 0)

  return (
    <div className="nutrition-panel">
      <div className="nutrition-title">{t('nutrition.per100g')}</div>
      {rows.map((r) => (
        <div key={r.key} className="nutrition-row">
          <span>{t(`nutrition.${r.key}`)}</span>
          <span>{Number(r.value).toFixed(1)} {r.unit}</span>
        </div>
      ))}
    </div>
  )
}
