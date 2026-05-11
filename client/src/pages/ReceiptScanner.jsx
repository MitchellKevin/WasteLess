import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/axios'

// Tesseract drops commas and OCRs Dutch tax codes as digits (B→8, BB→88)
// e.g. "23,97 B" → "23978", "3,02 BB" → "30288"
// Fix: strip trailing 8s while the implied price (digits/100) exceeds €50
function normalizeOcrPrice(digits) {
  let s = digits
  while (s.length > 3 && parseInt(s, 10) / 100 > 50 && s.endsWith('8')) {
    s = s.slice(0, -1)
  }
  return parseInt(s, 10) / 100
}

function parseReceipt(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2)
  const SKIP = ['totaal', 'total', 'btw', 'vat', 'subtotaal', 'subtotal', 'korting',
    'discount', 'pinnen', 'pin', 'wisselgeld', 'change', 'bedankt', 'thank',
    'kassabon', 'receipt', 'kassier', 'cashier', 'openingstijden', 'statiegeld',
    'bonuskaart', 'airmiles', 'spaarkaart', 'klantenkaart',
    'omschrijving', 'omschrumng', 'aantal', 'antal', 'bedrag', 'prijs', '%']

  const items = []

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (SKIP.some((w) => lower.includes(w))) continue

    const digitSeqs = line.match(/\d+/g)
    if (!digitSeqs || digitSeqs.length === 0) continue

    // Last digit sequence = BEDRAG (total price column)
    const rawPrice = digitSeqs[digitSeqs.length - 1]
    if (rawPrice.length >= 6) continue  // loyalty card / store numbers, not prices

    const price = normalizeOcrPrice(rawPrice)
    if (price < 0.10 || price > 499) continue

    // Name = line stripped of all digits and punctuation
    const name = line
      .replace(/\d+/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')

    if (name.length < 2) continue

    items.push({ name: toTitleCase(name), price, expiryDate: '', selected: true })
  }
  return items
}

function toTitleCase(str) {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase())
}

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

export default function ReceiptScanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [rawText, setRawText] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const [preview, setPreview] = useState(null)

  const processFile = async (file) => {
    setItems([])
    setRawText('')
    setProgress(0)
    setStatus(t('receipt.downloading'))

    let imageFile = file
    if (file.type === 'application/pdf') {
      setStatus(t('receipt.convertingPdf'))
      imageFile = await pdfToImageFile(file)
    }

    setPreview(URL.createObjectURL(imageFile))

    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker(['eng', 'nld'], 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100))
          setStatus(t('receipt.processing', { progress: Math.round(m.progress * 100) }))
        }
      },
    })

    const { data: { text } } = await worker.recognize(imageFile)
    await worker.terminate()

    setRawText(text)
    setItems(parseReceipt(text))
    setStatus('')
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const toggle = (i) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, selected: !it.selected } : it))
  const setName = (i, v) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, name: v } : it))
  const setPrice = (i, v) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, price: v } : it))
  const setExpiry = (i, v) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, expiryDate: v } : it))
  const remove = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i))

  const selected = items.filter((it) => it.selected)
  const allSelected = items.length > 0 && items.every((it) => it.selected)
  const toggleAll = () => setItems((prev) => prev.map((it) => ({ ...it, selected: !allSelected })))

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: existing } = await api.get('/items')
      const fallbackExpiry = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

      await Promise.all(
        selected.map((it) => {
          const resolvedExpiry = it.expiryDate || fallbackExpiry
          const match = existing.find(
            (e) =>
              e.name.toLowerCase() === it.name.toLowerCase() &&
              e.expiryDate.slice(0, 10) === resolvedExpiry
          )
          if (match) {
            return api.patch(`/items/${match._id}`, { quantity: match.quantity + 1 })
          }
          return api.post('/items', {
            name: it.name,
            quantity: 1,
            unit: 'item',
            price: Number(it.price) || 0,
            expiryDate: resolvedExpiry,
          })
        })
      )
      navigate('/')
    } finally { setSaving(false) }
  }

  return (
    <div className="add-page">
      <h2>{t('receipt.title')}</h2>
      <p className="page-subtitle">{t('receipt.subtitle')}</p>

      <div className="receipt-upload">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
        <button className="btn btn-secondary" onClick={() => fileRef.current.click()}>
          {t('receipt.capture')}
        </button>
        <span className="upload-or">{t('receipt.orUpload')}</span>
        <input type="file" accept="image/*,application/pdf" onChange={handleFile} className="file-input-plain" />
      </div>

      {preview && !status && (
        <img src={preview} alt="Receipt" className="receipt-preview" />
      )}

      {status && (
        <div className="receipt-status">
          <div className="ocr-progress-bar">
            <div className="ocr-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="lookup-status">{status}</p>
        </div>
      )}

      {!status && items.length === 0 && rawText && (
        <>
          <div className="alert alert-warning">{t('receipt.notFound')}</div>
          <div style={{ marginTop: '1rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowRaw((v) => !v)}>
              {t('receipt.rawText')}
            </button>
            {showRaw && <pre className="raw-text">{rawText}</pre>}
          </div>
        </>
      )}

      {items.length > 0 && (
        <>
          <div className="receipt-toolbar">
            <p className="section-title">{t('receipt.found', { count: items.length })}</p>
            <button className="btn btn-ghost btn-sm" onClick={toggleAll}>
              {allSelected ? t('receipt.deselectAll') : t('receipt.selectAll')}
            </button>
          </div>

          <div className="receipt-items">
            <div className="receipt-item-header">
              <span></span>
              <span>{t('receipt.name')}</span>
              <span>{t('receipt.expiry')}</span>
              <span>{t('receipt.price')}</span>
              <span></span>
            </div>
            {items.map((it, i) => (
              <div key={i} className={`receipt-item ${!it.selected ? 'deselected' : ''}`}>
                <input type="checkbox" checked={it.selected} onChange={() => toggle(i)} />
                <input className="receipt-name-input" value={it.name} onChange={(e) => setName(i, e.target.value)} />
                <input type="date" className="receipt-expiry-input" value={it.expiryDate} onChange={(e) => setExpiry(i, e.target.value)} />
                <span className="receipt-price">€{Number(it.price).toFixed(2)}</span>
                <button className="btn-icon btn-icon--danger" onClick={() => remove(i)}>✕</button>
              </div>
            ))}
          </div>

          {selected.length > 0 && (
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => navigate('/')}>{t('receipt.back')}</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? t('receipt.saving') : t('receipt.save', { count: selected.length })}
              </button>
            </div>
          )}

          {rawText && (
            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRaw((v) => !v)}>
                {t('receipt.rawText')}
              </button>
              {showRaw && <pre className="raw-text">{rawText}</pre>}
            </div>
          )}
        </>
      )}
    </div>
  )
}
