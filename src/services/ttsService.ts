/**
 * CareerVerse AI Interview Simulator - Text-to-Speech (TTS) Service
 *
 * Utilizes the browser Web Speech API (window.speechSynthesis) with:
 * - Female / Male voice selection heuristic
 * - Speech rate, pitch, and volume adjustments
 * - Chrome 15-second utterance timeout keep-alive workaround
 * - Graceful fallback when SpeechSynthesis is unavailable or voices are unready
 */

export interface TTSOptions {
  voice: 'female' | 'male'
  rate?: number // 0.5 to 2.0 (default: 1.0)
  pitch?: number // 0.5 to 1.5
  volume?: number // 0.0 to 1.0 (default: 1.0)
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: unknown) => void
}

class TTSService {
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private keepAliveTimer: any = null
  private cachedVoices: SpeechSynthesisVoice[] = []
  private isMuted: boolean = false

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices()
      }
    }
  }

  private loadVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    try {
      this.cachedVoices = window.speechSynthesis.getVoices()
    } catch {
      this.cachedVoices = []
    }
  }

  /**
   * Checks if browser supports SpeechSynthesis
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  /**
   * Sets global mute flag
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted
    if (muted) {
      this.stop()
    }
  }

  getMuted(): boolean {
    return this.isMuted
  }

  /**
   * Selects an appropriate system voice matching requested gender and English locale.
   */
  private selectVoice(gender: 'female' | 'male'): {
    voice: SpeechSynthesisVoice | null
    fallbackPitch: number
  } {
    if (this.cachedVoices.length === 0) {
      this.loadVoices()
    }

    const englishVoices = this.cachedVoices.filter((v) =>
      v.lang.toLowerCase().startsWith('en'),
    )

    const voicePool = englishVoices.length > 0 ? englishVoices : this.cachedVoices

    if (gender === 'female') {
      const femaleKeywords = [
        'female',
        'zira',
        'samantha',
        'victoria',
        'karen',
        'susan',
        'fiona',
        'moira',
        'tessa',
        'stephanie',
        'jenny',
        'aria',
      ]

      const matched = voicePool.find((v) => {
        const name = v.name.toLowerCase()
        return femaleKeywords.some((keyword) => name.includes(keyword))
      })

      if (matched) {
        return { voice: matched, fallbackPitch: 1.05 }
      }

      // If no explicit female name found, use standard voice with slightly higher pitch
      return { voice: voicePool[0] || null, fallbackPitch: 1.15 }
    } else {
      const maleKeywords = [
        'male',
        'david',
        'alex',
        'daniel',
        'george',
        'oliver',
        'guy',
        'tom',
        'mark',
        'fred',
        'rishi',
      ]

      const matched = voicePool.find((v) => {
        const name = v.name.toLowerCase()
        return maleKeywords.some((keyword) => name.includes(keyword))
      })

      if (matched) {
        return { voice: matched, fallbackPitch: 0.95 }
      }

      // If no explicit male name found, use standard voice with slightly lower pitch
      return { voice: voicePool[0] || null, fallbackPitch: 0.9 }
    }
  }

  /**
   * Speaks the given text using speech synthesis.
   */
  speak(text: string, options: TTSOptions): void {
    if (!this.isSupported() || this.isMuted) {
      if (options.onStart) options.onStart()
      if (options.onEnd) {
        // Immediate completion when muted or unsupported
        setTimeout(options.onEnd, 300)
      }
      return
    }

    // Cancel any ongoing speech first
    this.stop()

    if (!text || !text.trim()) {
      if (options.onEnd) options.onEnd()
      return
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text.trim())
      this.currentUtterance = utterance

      const { voice, fallbackPitch } = this.selectVoice(options.voice)
      if (voice) {
        utterance.voice = voice
      }

      utterance.pitch = options.pitch ?? fallbackPitch
      utterance.rate = options.rate ?? 1.0
      utterance.volume = options.volume ?? 1.0

      utterance.onstart = () => {
        // Chrome bug workaround: keep synthesis active every 10 seconds
        this.startKeepAlive()
        if (options.onStart) options.onStart()
      }

      utterance.onend = () => {
        this.clearKeepAlive()
        this.currentUtterance = null
        if (options.onEnd) options.onEnd()
      }

      utterance.onerror = (err) => {
        this.clearKeepAlive()
        this.currentUtterance = null
        // Ignore canceled errors from calling stop()
        if ((err as any).error !== 'canceled') {
          console.warn('[TTS Error]:', err)
          if (options.onError) options.onError(err)
        }
        if (options.onEnd) options.onEnd()
      }

      window.speechSynthesis.speak(utterance)
    } catch (err) {
      console.warn('[TTS Exception]:', err)
      this.clearKeepAlive()
      this.currentUtterance = null
      if (options.onError) options.onError(err)
      if (options.onEnd) options.onEnd()
    }
  }

  /**
   * Chrome keepalive timer to prevent speech cutoff on longer sentences
   */
  private startKeepAlive(): void {
    this.clearKeepAlive()
    this.keepAliveTimer = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (!window.speechSynthesis.speaking) {
          this.clearKeepAlive()
        } else {
          window.speechSynthesis.pause()
          window.speechSynthesis.resume()
        }
      }
    }, 10000)
  }

  private clearKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer)
      this.keepAliveTimer = null
    }
  }

  /**
   * Stops current playback immediately.
   */
  stop(): void {
    this.clearKeepAlive()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
      } catch {
        // Ignore
      }
    }
    this.currentUtterance = null
  }

  /**
   * Pauses current playback.
   */
  pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause()
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Resumes paused playback.
   */
  resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume()
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Returns true if speech synthesis is currently active.
   */
  isSpeaking(): boolean {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      window.speechSynthesis.speaking
    )
  }
}

export const ttsService = new TTSService()

