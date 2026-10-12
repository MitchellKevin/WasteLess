export const isPlus = (user) => Boolean(user?.plus?.active)

export const formatEur = (amount, lang) =>
  new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(amount)
