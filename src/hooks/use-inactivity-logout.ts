import { useEffect, useRef, useCallback } from 'react'

interface UseInactivityLogoutOptions {
  timeout?: number // milliseconds
  onLogout: () => void
  rememberMe: boolean
}

/**
 * Hook pentru auto-logout după inactivitate
 * @param timeout - Timp de inactivitate în milisecunde (default: 30 minute)
 * @param onLogout - Funcție apelată la logout
 * @param rememberMe - Dacă e true, nu se face auto-logout
 */
export function useInactivityLogout({ 
  timeout = 30 * 60 * 1000, // 30 minute default
  onLogout, 
  rememberMe 
}: UseInactivityLogoutOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const resetTimer = useCallback(() => {
    // Dacă e activat "remember me", nu facem auto-logout
    if (rememberMe) {
      return
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Update last activity
    lastActivityRef.current = Date.now()

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      console.log('[Inactivity] User inactive for', timeout / 1000, 'seconds - logging out')
      onLogout()
    }, timeout)
  }, [timeout, onLogout, rememberMe])

  useEffect(() => {
    // Dacă remember me e activ, nu monitorizăm inactivitatea
    if (rememberMe) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    // Activity events to monitor
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    // Reset timer on any activity
    const handleActivity = () => {
      resetTimer()
    }

    // Initialize timer
    resetTimer()

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [resetTimer, rememberMe])

  return {
    lastActivity: lastActivityRef.current,
    resetTimer
  }
}
