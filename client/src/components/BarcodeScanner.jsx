import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.QR_CODE,
]

export default function BarcodeScanner({ onScan }) {
  const scannerRef = useRef(null)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'barcode-reader',
      {
        fps: 10,
        qrbox: { width: 280, height: 120 },
        formatsToSupport: BARCODE_FORMATS,
        rememberLastUsedCamera: true,
      },
      false
    )

    scanner.render(
      (code) => {
        scanner.clear().catch(() => {})
        onScanRef.current(code)
      },
      () => {}
    )

    scannerRef.current = scanner
    return () => { scanner.clear().catch(() => {}) }
  }, [])

  return (
    <div className="scanner-wrapper">
      <div id="barcode-reader" />
    </div>
  )
}
