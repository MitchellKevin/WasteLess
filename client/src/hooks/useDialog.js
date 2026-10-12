import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

// Modal behaviour: focus moves into the dialog, Tab stays inside it,
// Escape closes it, and focus returns to the trigger on close.
export default function useDialog(onClose) {
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const dialog = ref.current
    const opener = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    ;(dialog.querySelector('[autofocus]') || dialog.querySelector(FOCUSABLE) || dialog).focus()

    const onKey = (e) => {
      if (e.key === 'Escape' && onCloseRef.current) { e.stopPropagation(); onCloseRef.current() }
      if (e.key !== 'Tab') return
      const nodes = [...dialog.querySelectorAll(FOCUSABLE)]
      if (nodes.length === 0) return
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      else if (!dialog.contains(document.activeElement)) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      if (opener && opener.isConnected) opener.focus()
    }
  }, [])

  return ref
}
