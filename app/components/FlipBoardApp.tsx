'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import FlipBoard, { type FlipBoardHandle } from './FlipBoard'
import { SoundEngine } from '../lib/soundEngine'
import { MESSAGES, MESSAGE_INTERVAL, TOTAL_TRANSITION } from '../lib/constants'

export default function FlipBoardApp() {
  const boardRef = useRef<FlipBoardHandle>(null)
  const soundEngineRef = useRef<SoundEngine | null>(null)
  const [muted, setMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [toast, setToast] = useState<{ text: string; visible: boolean }>({ text: '', visible: false })
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const msgIndexRef = useRef(-1)
  const rotatorTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioInitRef = useRef(false)

  // ── Audio ──────────────────────────────────────────────────────────────────
  const initAudio = useCallback(async () => {
    if (audioInitRef.current) return
    audioInitRef.current = true
    const se = new SoundEngine()
    await se.init()
    se.resume()
    soundEngineRef.current = se
  }, [])

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((text: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ text, visible: true })
    toastTimerRef.current = setTimeout(() => {
      setToast(t => ({ ...t, visible: false }))
    }, 1200)
  }, [])

  // ── Message rotation ───────────────────────────────────────────────────────
  const resetRotator = useCallback(() => {
    if (rotatorTimerRef.current) clearInterval(rotatorTimerRef.current)
    rotatorTimerRef.current = setInterval(() => {
      if (!boardRef.current?.isTransitioning) {
        msgIndexRef.current = (msgIndexRef.current + 1) % MESSAGES.length
        boardRef.current?.displayMessage(MESSAGES[msgIndexRef.current])
      }
    }, MESSAGE_INTERVAL + TOTAL_TRANSITION)
  }, [])

  const next = useCallback(() => {
    msgIndexRef.current = (msgIndexRef.current + 1) % MESSAGES.length
    boardRef.current?.displayMessage(MESSAGES[msgIndexRef.current])
    resetRotator()
  }, [resetRotator])

  const prev = useCallback(() => {
    msgIndexRef.current = (msgIndexRef.current - 1 + MESSAGES.length) % MESSAGES.length
    boardRef.current?.displayMessage(MESSAGES[msgIndexRef.current])
    resetRotator()
  }, [resetRotator])

  // ── Init: show first message + start rotator ───────────────────────────────
  useEffect(() => {
    msgIndexRef.current = 0
    boardRef.current?.displayMessage(MESSAGES[0])
    resetRotator()
    return () => {
      if (rotatorTimerRef.current) clearInterval(rotatorTimerRef.current)
    }
  }, [resetRotator])

  // ── Keyboard controller ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case 'Enter':
        case ' ':
        case 'ArrowRight':
          e.preventDefault()
          void initAudio()
          next()
          break
        case 'ArrowLeft':
          e.preventDefault()
          void initAudio()
          prev()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            document.documentElement.requestFullscreen().catch(() => {})
          }
          break
        case 'm':
        case 'M': {
          e.preventDefault()
          void initAudio().then(() => {
            if (!soundEngineRef.current) return
            const nowMuted = soundEngineRef.current.toggleMute()
            setMuted(nowMuted)
            showToast(nowMuted ? 'Sound off' : 'Sound on')
          })
          break
        }
        case 'Escape':
          if (document.fullscreenElement) document.exitFullscreen()
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [initAudio, next, prev, showToast])

  // ── Fullscreen listener ────────────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // ── Volume toggle ──────────────────────────────────────────────────────────
  const handleVolumeClick = async () => {
    await initAudio()
    if (!soundEngineRef.current) return
    const nowMuted = soundEngineRef.current.toggleMute()
    setMuted(nowMuted)
  }

  // ── CTA click: scroll + fullscreen ────────────────────────────────────────
  const handleCta = (e: React.MouseEvent) => {
    e.preventDefault()
    void initAudio()
    document.getElementById('board-container')?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => {
      document.documentElement.requestFullscreen().catch(() => {})
    }, 400)
  }

  return (
    <div className={`page-frame${isFullscreen ? ' fullscreen-active' : ''}`}>
      {/* Header */}
      <header className="header">
        <div className="header-logo">FlipOff.</div>
        <nav className="header-nav">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <button
            className="volume-btn"
            title="Toggle sound"
            onClick={handleVolumeClick}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero">
        <h1>Turn any TV into a retro split-flap display.</h1>
        <p className="subtitle">{'The classic flip-board look, without the $3,500 hardware.'}</p>
        <div className="hero-cta">
          <input type="email" placeholder="you@example.com" aria-label="Email address" />
          <button onClick={handleCta}>Get Early Access</button>
        </div>
      </section>

      {/* Board */}
      <section className="board-section" id="board-container">
        <FlipBoard
          ref={boardRef}
          soundEngine={soundEngineRef.current}
        />
      </section>

      {/* Toast */}
      {toast.text && (
        <div
          className={`toast${toast.visible ? '' : ' hidden'}`}
          role="status"
          aria-live="polite"
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}
