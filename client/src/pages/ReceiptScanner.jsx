import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'
import AddTabs from '../components/AddTabs'
import { PlusCard } from '../components/PlusGate'
import { useAuth } from '../context/AuthContext'
import { isPlus } from '../lib/plan'
import { LOCATIONS, productKey } from '../lib/items'
import { readReceiptText } from '../lib/ocr'
import { parseReceipt } from '../lib/receipt'
import { fetchSuggestions, inDays } from '../lib/suggest'
import { CameraIcon, UploadIcon, CloseIcon } from '../components/Icons'

const FALLBACK_DAYS = 7 // when smart dates don't recognise a product

async function pdfToImageFile(pdfFile) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url
  ).href

  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await getDocument({ data: arrayBuffer }).promise

  // Render all pages into one tall canvas for OCR
  const pageCanvases = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
    pageCanvases.push(canvas)
  }

  const totalHeight = pageCanvases.reduce((s, c) => s + c.height, 0)
  const combined = document.createElement('canvas')
  combined.width = pageCanvases[0].width
  combined.height = totalHeight
  const ctx = combined.getContext('2d')
  let y = 0
  for (const c of pageCanvases) { ctx.drawImage(c, 0, y); y += c.height }

  const blob = await new Promise((res) => combined.toBlob(res, 'image/png'))
  return new File([blob], 'receipt.png', { type: 'image/png' })
}

// Smart dates for every line: expiry date and storage place
async function withSuggestions(items) {
  const suggestions = await fetchSuggestions(items.map((it) => ({ name: it.name })))
  return items.map((it, i) => {
    const s = suggestions[i]
    return {
      ...it,
      selected: true,
      location: s?.location || 'fridge',
      expiryDate: inDays(s ? s.days : FALLBACK_DAYS),
      dateSource: s ? 'suggested' : 'default',
      recognised: Boolean(s),
    }
  })
}

export default function ReceiptScanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileRef = useRef()
  const uploadRef = useRef()

  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [items, setItems] = useState([])
  const [store, setStore] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [rawText, setRawText] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const [preview, setPreview] = useState(null)

  const processFile = async (file) => {
    setItems([]); setRawText(''); setError(''); setStore(null); setProgress(0)
    setStatus(t('receipt.downloading'))
    try {
      let imageFile = file
      if (file.type === 'application/pdf') {
        setStatus(t('receipt.convertingPdf'))
        imageFile = await pdfToImageFile(file)
      }
      setPreview(URL.createObjectURL(imageFile))
      const text = await readReceiptText(imageFile, (pct) => {
        setProgress(pct)
        setStatus(t('receipt.processing', { progress: pct }))
      })
      setRawText(text)
      const parsed = parseReceipt(text)
      setStore(parsed.store)
      setStatus(t('receipt.matching'))
      setItems(await withSuggestions(parsed.items))
    } catch (err) {
      setError(t('receipt.readError'))
    } finally {
      setStatus('')
    }
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow picking the same file again
    if (file) processFile(file)
  }

  const update = (i, changes) => setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...changes } : it)))
  const remove = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  // A corrected name may now be recognised: refresh its date and place (unless set by hand)
  const renamed = async (i) => {
    const it = items[i]
    if (!it || it.dateSource === 'manual') return
    const [s] = await fetchSuggestions([{ name: it.name }])
    if (s) update(i, { location: s.location, expiryDate: inDays(s.days), dateSource: 'suggested', recognised: true })
  }

  const selected = items.filter((it) => it.selected)
  const allSelected = items.length > 0 && items.every((it) => it.selected)
  const toggleAll = () => setItems((prev) => prev.map((it) => ({ ...it, selected: !allSelected })))

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const { data: existing } = await api.get('/items')
      // Same product with the same date already in the pantry: add to it instead of a new batch
      for (const it of selected) {
        const match = existing.find((e) => productKey(e.name) === productKey(it.name) && e.expiryDate.slice(0, 10) === it.expiryDate && e.unit === it.unit)
        if (match) await api.patch(`/items/${match._id}`, { quantity: Math.round((match.quantity + it.quantity) * 1000) / 1000 })
        else await api.post('/items', {
          name: it.name, quantity: it.quantity, unit: it.unit, price: Number(it.price) || 0,
          expiryDate: it.expiryDate, location: it.location, dateSource: it.dateSource,
        })
      }
      navigate('/pantry')
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
      setSaving(false)
    }
  }

  if (!isPlus(user)) {
    return (
      <div className="add-page">
        <AddTabs />
        <PlusCard title={t('plus.gate.receiptTitle')} desc={t('plus.gate.receiptDesc')} />
      </div>
    )
  }

  return (
    <div className="add-page">
      <AddTabs />
      <h2>{t('receipt.title')}</h2>
      <p className="page-subtitle">{t('receipt.subtitle')}</p>

      <div className="receipt-upload">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} hidden />
        <input ref={uploadRef} type="file" accept="image/*,application/pdf" onChange={handleFile} hidden />
        <button type="button" className="btn btn-primary" onClick={() => fileRef.current.click()} disabled={!!status}>
          <CameraIcon size={20} />{t('receipt.capture')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => uploadRef.current.click()} disabled={!!status}>
          <UploadIcon size={20} />{t('receipt.upload')}
        </button>
      </div>
      {!items.length && !status && <p className="form-hint">{t('receipt.tips')}</p>}

      {preview && !status && !items.length && <img src={preview} alt={t('receipt.title')} className="receipt-preview" />}

      {status && (
        <div className="receipt-status" aria-live="polite">
          <div className="ocr-progress-bar"><div className="ocr-progress-fill" style={{ width: `${progress}%` }} /></div>
          <p className="lookup-status">{status}</p>
        </div>
      )}

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {!status && items.length === 0 && rawText && (
        <div className="alert alert-warning" role="alert">{t('receipt.notFound')}</div>
      )}

      {items.length > 0 && (
        <>
          <div className="receipt-toolbar">
            <p className="section-title">
              {store ? t('receipt.foundAt', { count: items.length, store: t(`receipt.store.${store}`) }) : t('receipt.found', { count: items.length })}
            </p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={toggleAll}>
              {allSelected ? t('receipt.deselectAll') : t('receipt.selectAll')}
            </button>
          </div>
          <p className="form-hint smart-hint"><span className="plus-badge">Plus</span>{t('receipt.smartNote')}</p>

          <ul className="receipt-list">
            {items.map((it, i) => (
              <li key={i} className={`receipt-row${it.selected ? '' : ' deselected'}`}>
                <div className="receipt-row-top">
                  <input type="checkbox" checked={it.selected} onChange={() => update(i, { selected: !it.selected })} aria-label={t('receipt.include', { name: it.name })} />
                  <input className="receipt-name-input" value={it.name} onChange={(e) => update(i, { name: e.target.value })} onBlur={() => renamed(i)}
                    aria-label={t('receipt.nameFor', { n: i + 1 })} />
                  <span className="receipt-price">€{Number(it.price).toFixed(2)}</span>
                  <button type="button" className="btn-icon btn-icon--danger" onClick={() => remove(i)} aria-label={t('receipt.remove', { name: it.name })}><CloseIcon size={18} /></button>
                </div>
                <div className="receipt-row-details">
                  <label className="receipt-field">
                    <span>{t('receipt.qty')}</span>
                    <input type="number" inputMode="decimal" min="0" step="any" value={it.quantity}
                      onChange={(e) => update(i, { quantity: Number(e.target.value) })} />
                    {it.unit === 'kg' && <span className="receipt-unit">kg</span>}
                  </label>
                  <label className="receipt-field">
                    <span>{t('detail.storedIn')}</span>
                    <select value={it.location} onChange={(e) => update(i, { location: e.target.value })}>
                      {LOCATIONS.map((l) => <option key={l} value={l}>{t(`location.${l}`)}</option>)}
                    </select>
                  </label>
                  <label className="receipt-field">
                    <span>{t('receipt.expiry')}{!it.recognised && it.dateSource !== 'manual' && <span className="receipt-check"> · {t('receipt.check')}</span>}</span>
                    <input type="date" value={it.expiryDate} onChange={(e) => update(i, { expiryDate: e.target.value, dateSource: 'manual' })} />
                  </label>
                </div>
              </li>
            ))}
          </ul>

          {selected.length > 0 && (
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>{t('receipt.back')}</button>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? t('receipt.saving') : t('receipt.save', { count: selected.length })}
              </button>
            </div>
          )}
        </>
      )}

      {rawText && (
        <div className="raw-toggle">
          <button type="button" className="btn btn-ghost btn-sm" aria-expanded={showRaw} onClick={() => setShowRaw((v) => !v)}>{t('receipt.rawText')}</button>
          {showRaw && <pre className="raw-text">{rawText}</pre>}
        </div>
      )}
    </div>
  )
}
