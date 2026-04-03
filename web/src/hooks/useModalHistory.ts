import { useEffect, useRef } from 'react'

/**
 * Pushes a history entry when a modal opens so mobile users can close it
 * with the browser back button. Cleans up the history entry on normal close.
 */
export function useModalHistory(isOpen: boolean, onClose: () => void) {
  const pushedRef = useRef(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (isOpen && !pushedRef.current) {
      history.pushState({ modal: true }, '')
      pushedRef.current = true
    } else if (!isOpen && pushedRef.current) {
      pushedRef.current = false
      history.back()
    }
  }, [isOpen])

  useEffect(() => {
    const handlePopState = () => {
      if (pushedRef.current) {
        pushedRef.current = false
        onCloseRef.current()
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
}
