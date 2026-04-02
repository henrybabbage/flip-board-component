'use client'

import {
  useRef, useState, useImperativeHandle, forwardRef, useCallback
} from 'react'
import Tile, { type TileHandle } from './Tile'
import {
  GRID_COLS, GRID_ROWS, STAGGER_DELAY, TOTAL_TRANSITION, ACCENT_COLORS,
} from '@/app/lib/constants'
import { type SoundEngine } from '@/app/lib/soundEngine'

export interface FlipBoardHandle {
  displayMessage(lines: string[]): void
  isTransitioning: boolean
}

interface FlipBoardProps {
  soundEngine: SoundEngine | null
}

/** Centre-pad a string to exactly `width` characters */
function padLine(line: string, width: number): string[] {
  const upper = line.toUpperCase().slice(0, width)
  const padTotal = width - upper.length
  const padLeft = Math.floor(padTotal / 2)
  const padded = ' '.repeat(padLeft) + upper + ' '.repeat(padTotal - padLeft)
  return padded.split('')
}

const FlipBoard = forwardRef<FlipBoardHandle, FlipBoardProps>(
  function FlipBoard({ soundEngine }, ref) {
    // 2-D array of tile refs
    const tileRefs = useRef<(TileHandle | null)[][]>(
      Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null))
    )
    const currentGrid = useRef<string[][]>(
      Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(' '))
    )
    const isTransitioningRef = useRef(false)
    const accentIndexRef = useRef(0)

    const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0])
    const [showOverlay, setShowOverlay] = useState(false)

    const displayMessage = useCallback((lines: string[]) => {
      if (isTransitioningRef.current) return
      isTransitioningRef.current = true

      const newGrid = Array.from({ length: GRID_ROWS }, (_, r) =>
        padLine(lines[r] ?? '', GRID_COLS)
      )

      let hasChanges = false
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const newChar = newGrid[r][c]
          const oldChar = currentGrid.current[r][c]
          if (newChar !== oldChar) {
            const delay = (r * GRID_COLS + c) * STAGGER_DELAY
            tileRefs.current[r][c]?.scrambleTo(newChar, delay)
            hasChanges = true
          }
        }
      }

      if (hasChanges && soundEngine) soundEngine.playTransition()

      accentIndexRef.current++
      setAccentColor(ACCENT_COLORS[accentIndexRef.current % ACCENT_COLORS.length])

      currentGrid.current = newGrid

      setTimeout(() => {
        isTransitioningRef.current = false
      }, TOTAL_TRANSITION + 200)
    }, [soundEngine])

    useImperativeHandle(ref, () => ({
      displayMessage,
      get isTransitioning() { return isTransitioningRef.current },
    }), [displayMessage])

    return (
      <div
        className="board"
        style={{
          ['--grid-cols' as string]: GRID_COLS,
          ['--grid-rows' as string]: GRID_ROWS,
        }}
      >
        {/* Left accent bar */}
        <div className="accent-bar accent-bar-left">
          <div className="accent-segment" style={{ backgroundColor: accentColor }} />
          <div className="accent-segment" style={{ backgroundColor: accentColor }} />
        </div>

        {/* Tile grid */}
        <div className="tile-grid">
          {Array.from({ length: GRID_ROWS }, (_, r) =>
            Array.from({ length: GRID_COLS }, (_, c) => (
              <Tile
                key={`${r}-${c}`}
                ref={(el) => { tileRefs.current[r][c] = el }}
              />
            ))
          )}
        </div>

        {/* Right accent bar */}
        <div className="accent-bar accent-bar-right">
          <div className="accent-segment" style={{ backgroundColor: accentColor }} />
          <div className="accent-segment" style={{ backgroundColor: accentColor }} />
        </div>

        {/* Keyboard hint */}
        <button
          className="keyboard-hint"
          title="Keyboard shortcuts"
          onClick={(e) => { e.stopPropagation(); setShowOverlay(v => !v) }}
          aria-label="Toggle keyboard shortcuts"
        >
          N
        </button>

        {/* Shortcuts overlay */}
        {showOverlay && (
          <div className="shortcuts-overlay visible">
            <div><span>Next message</span><kbd>Enter</kbd></div>
            <div><span>Previous</span><kbd>&#8592;</kbd></div>
            <div><span>Fullscreen</span><kbd>F</kbd></div>
            <div><span>Mute</span><kbd>M</kbd></div>
          </div>
        )}
      </div>
    )
  }
)

export default FlipBoard
