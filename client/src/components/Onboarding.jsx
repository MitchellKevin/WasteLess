import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useDialog from '../hooks/useDialog'
import { LeafIcon, BarcodeIcon, BellIcon } from './Icons'

const ICONS = [LeafIcon, BarcodeIcon, BellIcon]

export default function Onboarding({ onDone }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const id = useId()
  const dialogRef = useDialog(onDone)

  const steps = [1, 2, 3].map((n) => ({ title: t(`onboarding.step${n}Title`), desc: t(`onboarding.step${n}Desc`) }))
  const { title, desc } = steps[step]
  const Icon = ICONS[step]
  const last = step === steps.length - 1

  return (
    <div className="onboarding-overlay">
      <div
        className="onboarding-card"
        role="dialog"
        aria-modal="true"
        aria-label={t('onboarding.dialog')}
        aria-describedby={`${id}-desc`}
        tabIndex={-1}
        ref={dialogRef}
      >
        {!last && (
          <button type="button" className="onboarding-skip" onClick={onDone}>{t('onboarding.skip')}</button>
        )}
        <div className="onboarding-icon" aria-hidden="true"><Icon size={48} /></div>
        <h2 aria-live="polite">{title}</h2>
        <p className="onboarding-desc" id={`${id}-desc`}>{desc}</p>
        <div className="onboarding-dots" aria-hidden="true">
          {steps.map((_, i) => <span key={i} className={`onboarding-dot ${i === step ? 'active' : ''}`} />)}
        </div>
        <div className="onboarding-actions">
          {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>{t('onboarding.back')}</button>}
          <button type="button" className="btn btn-primary" onClick={last ? onDone : () => setStep((s) => s + 1)}>
            {last ? t('onboarding.getStarted') : t('onboarding.next')}
          </button>
        </div>
      </div>
    </div>
  )
}
