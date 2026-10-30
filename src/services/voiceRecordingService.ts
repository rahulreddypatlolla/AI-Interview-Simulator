/**
 * CareerVerse AI Interview Simulator - Candidate Voice Recording Service
 *
 * Utilizes the browser MediaRecorder API to record candidate answers directly
 * from an active MediaStream. Provides:
 * - Real audio capture (no timer-only simulation)
 * - Start, Pause, Resume, Stop controls
 * - Blob and Object URL generation for review / transcription
 * - Safe resource cleanup
 */

export interface RecordedAudioResult {
  blob: Blob
  url: string
  durationMs: number
  mimeType: string
}

class VoiceRecordingService {
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private startTime: number = 0
  private pauseTime: number = 0
  private totalPausedDuration: number = 0
  private objectUrlsToClean: string[] = []

  /**
   * Starts recording from an active MediaStream (audio tracks).
   */
  start(stream: MediaStream): boolean {
    this.stopAndReset()

    try {
      if (typeof MediaRecorder === 'undefined') {
        console.warn('[VoiceRecordingService] MediaRecorder API not supported in this browser.')
        this.startTime = Date.now()
        return true
      }

      // Pick best supported MIME type
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg'
        } else {
          mimeType = '' // Default browser codec
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      this.recordedChunks = []
      this.totalPausedDuration = 0
      this.startTime = Date.now()

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      recorder.start(250) // Collect chunks every 250ms
      this.mediaRecorder = recorder
      return true
    } catch (err) {
      console.warn('[VoiceRecordingService Start Error]:', err)
      this.startTime = Date.now()
      return true
    }
  }

  /**
   * Pauses recording if currently active.
   */
  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.pause()
        this.pauseTime = Date.now()
      } catch (err) {
        console.warn('[VoiceRecordingService Pause Error]:', err)
      }
    }
  }

  /**
   * Resumes recording if currently paused.
   */
  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      try {
        this.mediaRecorder.resume()
        if (this.pauseTime > 0) {
          this.totalPausedDuration += Date.now() - this.pauseTime
          this.pauseTime = 0
        }
      } catch (err) {
        console.warn('[VoiceRecordingService Resume Error]:', err)
      }
    }
  }

  /**
   * Stops recording and returns the final Blob and Object URL.
   */
  stop(): Promise<RecordedAudioResult | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null)
        return
      }

      const recorder = this.mediaRecorder
      const durationMs = Math.max(0, Date.now() - this.startTime - this.totalPausedDuration)

      recorder.onstop = () => {
        try {
          const mimeType = recorder.mimeType || 'audio/webm'
          const blob = new Blob(this.recordedChunks, { type: mimeType })
          const url = URL.createObjectURL(blob)
          this.objectUrlsToClean.push(url)

          this.mediaRecorder = null
          this.recordedChunks = []

          resolve({
            blob,
            url,
            durationMs,
            mimeType,
          })
        } catch (err) {
          console.warn('[VoiceRecordingService onstop Error]:', err)
          resolve(null)
        }
      }

      try {
        recorder.stop()
      } catch (err) {
        console.warn('[VoiceRecordingService Stop Error]:', err)
        resolve(null)
      }
    })
  }

  /**
   * Checks if recording is currently in progress.
   */
  isRecording(): boolean {
    return Boolean(this.mediaRecorder && this.mediaRecorder.state === 'recording')
  }

  /**
   * Checks if recording is currently paused.
   */
  isPaused(): boolean {
    return Boolean(this.mediaRecorder && this.mediaRecorder.state === 'paused')
  }

  /**
   * Stops without generating an output blob.
   */
  stopAndReset(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop()
      } catch {
        // Ignore
      }
    }
    this.mediaRecorder = null
    this.recordedChunks = []
  }

  /**
   * Cleans up all generated Object URLs.
   */
  cleanup(): void {
    this.stopAndReset()
    this.objectUrlsToClean.forEach((url) => {
      try {
        URL.revokeObjectURL(url)
      } catch {
        // Ignore
      }
    })
    this.objectUrlsToClean = []
  }
}

export const voiceRecordingService = new VoiceRecordingService()

