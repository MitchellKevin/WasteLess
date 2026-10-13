import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { BarcodeScanner as NativeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning'
import { isNative, platform } from '../lib/native'

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.QR_CODE,
]

const NATIVE_FORMATS = [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA, BarcodeFormat.UpcE, BarcodeFormat.Code128, BarcodeFormat.QrCode]

// iOS/Android: the system's full-screen ML Kit scanner
function NativeBarcodeScanner({ onScan, onCancel }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState('')
  const handlers = useRef({ onScan, onCancel })
  handlers.current = { onScan, onCancel }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Android uses Google's scanner module, which may still need to be downloaded
        if (platform === 'android') {
          const { available } = await NativeScanner.isGoogleBarcodeScannerModuleAvailable()
          if (!available) { await NativeScanner.installGoogleBarcodeScannerModule(); setFailed('installing'); return }
        }
        const { barcodes } = await NativeScanner.scan({ formats: NATIVE_FORMATS })
        if (cancelled) return
        const code = barcodes[0]?.rawValue
        if (code) handlers.current.onScan(code)
        else handlers.current.onCancel?.()
      } catch (err) {
        if (cancelled) return
        // Closing the scanner rejects with a "canceled" error
        if (/cancel/i.test(err?.message || '')) handlers.current.onCancel?.()
        else setFailed('error')
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (failed) return <div className="alert alert-warning" role="alert">{t(failed === 'installing' ? 'scanner.installing' : 'scanner.error')}</div>
  return <p className="lookup-status" role="status">{t('scanner.opening')}</p>
}

export default function BarcodeScanner(props) {
  return isNative ? <NativeBarcodeScanner {...props} /> : <WebBarcodeScanner {...props} />
}

// Why the camera didn't start, from the browser's error
function cameraProblem(err) {
  const text = `${err?.name || ''} ${err?.message || err || ''}`
  if (/NotAllowed|Permission|denied/i.test(text)) return 'denied'
  if (/NotFound|DevicesNotFound|no camera|Requested device not found/i.test(text)) return 'notFound'
  if (/NotReadable|TrackStart|Could not start|in use/i.test(text)) return 'busy'
  if (/secure|https|mediaDevices|getUserMedia is not/i.test(text)) return 'insecure'
  return 'error'
}

// Browser: camera-only scanner without html5-qrcode's built-in UI
function WebBarcodeScanner({ onScan }) {
  const { t } = useTranslation()
  const elementId = `barcode-reader-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan
  // starting → (waiting for permission) → running, or one of the camera problems
  const [state, setState] = useState('starting')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // Browsers only give pages the camera over https (or on localhost)
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) { setState('insecure'); return }
    setState('starting')
    const scanner = new Html5Qrcode(elementId, { formatsToSupport: BARCODE_FORMATS, verbose: false })
    let done = false
    // Still nothing after a few seconds: usually the permission prompt is waiting for an answer
    const waiting = setTimeout(() => setState((s) => (s === 'starting' ? 'waiting' : s)), 4000)
    const started = scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 260, height: 110 } },
      (code) => {
        if (done) return
        done = true
        scanner.stop().catch(() => {}).finally(() => onScanRef.current(code))
      },
      () => {}
    ).then(() => { if (!done) setState('running') })
      .catch((err) => { if (!done) setState(cameraProblem(err)) })
      .finally(() => clearTimeout(waiting))

    return () => {
      done = true
      clearTimeout(waiting)
      started.then(() => (scanner.isScanning ? scanner.stop() : null)).catch(() => {}).finally(() => {
        try { scanner.clear() } catch {}
      })
    }
  }, [elementId, attempt])

  const problem = !['starting', 'waiting', 'running'].includes(state)
  if (problem) {
    return (
      <div className="alert alert-warning scanner-problem" role="alert">
        <span>{t(`scanner.problem.${state}`)}</span>
        {state !== 'insecure' && state !== 'notFound' && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAttempt((n) => n + 1)}>{t('scanner.retry')}</button>
        )}
      </div>
    )
  }

  return (
    <div className={`scanner-wrapper${state === 'running' ? ' is-running' : ''}`}>
      <div id={elementId} className="barcode-reader" />
      {state === 'running' ? (
        <>
          <div className="scanner-frame" aria-hidden="true"><span /><span /><span /><span /></div>
          <p className="scanner-hint">{t('scanner.hint')}</p>
        </>
      ) : (
        <p className="scanner-status" role="status">{t(state === 'waiting' ? 'scanner.waitingPermission' : 'scanner.starting')}</p>
      )}
    </div>
  )
}
