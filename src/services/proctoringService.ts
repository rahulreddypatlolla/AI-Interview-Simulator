/**
 * CareerVerse AI Interview Simulator - Proctoring Service
 *
 * Handles:
 * 1. Camera & Microphone MediaStream management
 * 2. Screen Sharing MediaStream management (getDisplayMedia)
 * 3. Real-time microphone audio level meter via Web Audio API
 * 4. Fullscreen API utilities and event helpers
 * 5. Track cleanup to ensure privacy when leaving interviews
 */

export interface MediaPermissionStatus {
  camera: 'not_requested' | 'requesting' | 'granted' | 'denied'
  microphone: 'not_requested' | 'requesting' | 'granted' | 'denied'
  screen: 'not_requested' | 'requesting' | 'granted' | 'denied'
}

class ProctoringService {
  private cameraStream: MediaStream | null = null
  private screenStream: MediaStream | null = null
  private audioMeterCleanup: (() => void) | null = null

  // -------------------------------------------------------------
  // Camera & Microphone
  // -------------------------------------------------------------

  /**
   * Requests webcam video and microphone audio streams via getUserMedia.
   */
  async requestCameraAndMicrophone(): Promise<{
    success: boolean
    stream?: MediaStream
    error?: string
  }> {
    // Stop any existing camera tracks first
    this.stopCameraStream()

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        success: false,
        error:
          'Your browser does not support media device recording. Please use modern Chrome, Edge, Firefox, or Safari.',
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      this.cameraStream = stream
      return { success: true, stream }
    } catch (firstErr: unknown) {
      // Fallback: basic constraints in case advanced constraints failed on this hardware
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        this.cameraStream = fallbackStream
        return { success: true, stream: fallbackStream }
      } catch (err: unknown) {
        let message = 'Camera and microphone access could not be established.'

        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            message =
              'Permission was denied by your browser. Please click the padlock or settings icon in your browser URL bar and allow Camera and Microphone access.'
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            message =
              'No camera or microphone found on your system. Please connect an active camera and microphone to continue.'
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            message =
              'Your camera or microphone is already in use by another application (e.g. Zoom, Teams, or another tab). Please close other apps and retry.'
          } else {
            message = err.message || message
          }
        } else if (err instanceof Error) {
          message = err.message
        }

        return { success: false, error: message }
      }
    }
  }

  /**
   * Returns active camera + mic MediaStream or null.
   */
  getCameraStream(): MediaStream | null {
    if (this.cameraStream && this.cameraStream.active) {
      return this.cameraStream
    }
    return null
  }

  /**
   * Stores a camera stream directly.
   */
  setCameraStream(stream: MediaStream | null): void {
    this.cameraStream = stream
  }

  /**
   * Stops all active camera and microphone tracks.
   */
  stopCameraStream(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch {
          // Ignore
        }
      })
      this.cameraStream = null
    }

    if (this.audioMeterCleanup) {
      this.audioMeterCleanup()
      this.audioMeterCleanup = null
    }
  }

  // -------------------------------------------------------------
  // Screen Sharing
  // -------------------------------------------------------------

  /**
   * Requests screen sharing via getDisplayMedia.
   */
  async requestScreenShare(
    onTrackEnded?: () => void
  ): Promise<{
    success: boolean
    stream?: MediaStream
    error?: string
  }> {
    this.stopScreenStream()

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      return {
        success: false,
        error:
          'Screen sharing is not supported in this browser environment. Please use desktop Chrome, Edge, Firefox, or Safari.',
      }
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      })

      this.screenStream = stream

      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.onended = () => {
          this.screenStream = null
          if (onTrackEnded) {
            onTrackEnded()
          }
        }
      }

      return { success: true, stream }
    } catch (err: unknown) {
      let message = 'Screen sharing was cancelled or denied.'

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          message =
            'Screen sharing selection was dismissed or denied. You must select an active screen or window to proceed with proctoring.'
        } else {
          message = err.message || message
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      return { success: false, error: message }
    }
  }

  /**
   * Returns active screen sharing MediaStream or null.
   */
  getScreenStream(): MediaStream | null {
    if (this.screenStream && this.screenStream.active) {
      return this.screenStream
    }
    return null
  }

  /**
   * Stores a screen stream directly.
   */
  setScreenStream(stream: MediaStream | null): void {
    this.screenStream = stream
  }

  /**
   * Stops all active screen sharing tracks.
   */
  stopScreenStream(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch {
          // Ignore
        }
      })
      this.screenStream = null
    }
  }

  // -------------------------------------------------------------
  // Combined Media Cleanup
  // -------------------------------------------------------------

  /**
   * Stops all media tracks (camera, microphone, screen sharing).
   */
  stopAllMediaStreams(): void {
    this.stopCameraStream()
    this.stopScreenStream()
  }

  // -------------------------------------------------------------
  // Web Audio API Microphone Volume Meter
  // -------------------------------------------------------------

  /**
   * Creates an audio level meter from an active MediaStream.
   * Returns a function to read 0-100 normalized volume and a cleanup callback.
   */
  createAudioMeter(stream: MediaStream): {
    getVolume: () => number
    cleanup: () => void
  } | null {
    try {
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) return null

      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext

      if (!AudioCtxClass) return null

      const audioCtx = new AudioCtxClass()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64
      analyser.smoothingTimeConstant = 0.6

      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const cleanup = () => {
        try {
          source.disconnect()
          analyser.disconnect()
          if (audioCtx.state !== 'closed') {
            audioCtx.close().catch(() => {})
          }
        } catch {
          // Ignore
        }
      }

      this.audioMeterCleanup = cleanup

      return {
        getVolume: () => {
          if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {})
          }
          analyser.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i]
          }
          const avg = sum / bufferLength
          // Scale non-linearly for human perception
          const normalized = Math.min(100, Math.round((avg / 180) * 100))
          return normalized
        },
        cleanup,
      }
    } catch (err) {
      console.warn('[ProctoringService AudioMeter Error]:', err)
      return null
    }
  }

  // -------------------------------------------------------------
  // Fullscreen API Utilities
  // -------------------------------------------------------------

  /**
   * Requests browser fullscreen on the document root element.
   * Must be initiated by a direct user gesture (e.g. click).
   */
  async requestFullscreen(): Promise<{ success: boolean; error?: string }> {
    try {
      const docEl = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>
        msRequestFullscreen?: () => Promise<void>
      }

      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen()
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen()
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen()
      } else {
        return {
          success: false,
          error:
            'Fullscreen API is not supported by your browser. Please upgrade your browser to continue.',
        }
      }

      return { success: true }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Fullscreen request was declined or blocked by your browser.'
      return { success: false, error: message }
    }
  }

  /**
   * Checks whether the document is currently in fullscreen mode.
   */
  isFullscreen(): boolean {
    const doc = document as Document & {
      webkitFullscreenElement?: Element
      msFullscreenElement?: Element
    }
    return Boolean(
      doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.msFullscreenElement
    )
  }

  /**
   * Exits fullscreen mode if active.
   */
  async exitFullscreen(): Promise<void> {
    try {
      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void>
        msExitFullscreen?: () => Promise<void>
      }

      if (this.isFullscreen()) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen()
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen()
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen()
        }
      }
    } catch {
      // Ignore exit errors
    }
  }
}

// Export singleton instance
export const proctoringService = new ProctoringService()

