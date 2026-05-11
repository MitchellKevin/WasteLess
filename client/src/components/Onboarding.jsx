import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function Onboarding({ onDone }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)

  const steps = [
    { icon: t('onboarding.step1Icon'), title: t('onboarding.step1Title'), desc: t('onboarding.step1Desc') },
    { icon: t('onboarding.step2Icon'), title: t('onboarding.step2Title'), desc: t('onboarding.step2Desc') },
    { icon: t('onboarding.step3Icon'), title: t('onboarding.step3Title'), desc: t('onboarding.step3Desc') },
  ]

  const { icon, title, desc } = steps[step]
  const last = step === steps.length - 1

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-icon">{icon}</div>
        <h2>{title}</h2>
        <p className="onboarding-desc">{desc}</p>
        <div className="onboarding-dots">
          {steps.map((_, i) => <span key={i} className={`onboarding-dot ${i === step ? 'active' : ''}`} />)}
        </div>
        <div className="onboarding-actions">
          {step > 0 && <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>{t('onboarding.back')}</button>}
          <button className="btn btn-primary" onClick={last ? onDone : () => setStep((s) => s + 1)}>
            {last ? t('onboarding.getStarted') : t('onboarding.next')}
          </button>
        </div>
      </div>
    </div>
  )
}
