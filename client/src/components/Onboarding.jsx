import { useState } from 'react'

const STEPS = [
  {
    icon: '🌱',
    title: 'Welcome to WasteLess',
    desc: 'Track what\'s in your fridge, freezer, and pantry — and always know what\'s about to expire.',
  },
  {
    icon: '📷',
    title: 'Scan to add items',
    desc: 'Point your camera at any barcode and product info is filled in automatically. Set the expiry date and you\'re done.',
  },
  {
    icon: '⏰',
    title: 'Use food before it goes bad',
    desc: 'Get expiry alerts, recipe suggestions for what\'s running out, and a smart shopping list. Waste less, save more.',
  },
]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const { icon, title, desc } = STEPS[step]
  const last = step === STEPS.length - 1

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-icon">{icon}</div>
        <h2>{title}</h2>
        <p className="onboarding-desc">{desc}</p>
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`onboarding-dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>
        <div className="onboarding-actions">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>Back</button>
          )}
          <button className="btn btn-primary" onClick={last ? onDone : () => setStep((s) => s + 1)}>
            {last ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
