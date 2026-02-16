/**
 * ==================================================
 * ██╗     ██╗██╗   ██╗ █████╗ 
 * ██║     ██║╚██╗ ██╔╝██╔══██╗
 * ██║     ██║ ╚████╔╝ ███████║
 * ██║     ██║  ╚██╔╝  ██╔══██║
 * ███████╗██║   ██║   ██║  ██║
 * ╚══════╝╚═╝   ╚═╝   ╚═╝  ╚═╝
 *        AI Assistant
 * ==================================================
 * Author / Creator : Mahmut Denizli (With help of LiyaAi)
 * License          : MIT
 * Connect          : liyalabs.com, info@liyalabs.com
 * ==================================================
 */
// Liya AI Chat - Browser Compatibility Check

export interface BrowserCompatibility {
  supported: boolean
  speechApi: boolean
  audioContext: boolean
  reason?: string
}

export function checkBrowserCompatibility(): BrowserCompatibility {
  // Check for basic ES6+ support (Proxy as indicator)
  const hasES6 = typeof Proxy !== 'undefined'
  
  // Check for Web Speech API (optional - voice can be disabled)
  const hasSpeechApi = typeof window !== 'undefined' && 
    !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition)
  
  // Check for AudioContext (for TTS playback)
  const hasAudioContext = typeof window !== 'undefined' && 
    !!(window.AudioContext || (window as any).webkitAudioContext)
  
  // For chat widget, we only need basic modern browser support
  // Speech API and AudioContext are optional features
  if (!hasES6) {
    return {
      supported: false,
      speechApi: false,
      audioContext: false,
      reason: 'ES6_NOT_SUPPORTED'
    }
  }
  
  return {
    supported: true,
    speechApi: hasSpeechApi,
    audioContext: hasAudioContext
  }
}

export function useBrowserCompat() {
  const compat = checkBrowserCompatibility()
  
  return {
    isSupported: compat.supported,
    hasSpeechApi: compat.speechApi,
    hasAudioContext: compat.audioContext,
    reason: compat.reason
  }
}
