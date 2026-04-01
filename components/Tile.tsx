'use client'

import { useRef, useImperativeHandle, forwardRef } from 'react'
import { CHARSET, SCRAMBLE_COLORS, FLIP_DURATION } from '@/lib/constants'

export interface TileHandle {
  scrambleTo(targetChar: string, delay: number): void
}

interface TileProps {
  initialChar?: string
}

const Tile = forwardRef<TileHandle, TileProps>(function Tile({ initialChar = ' ' }, ref) {
  const frontSpanRef = useRef<HTMLSpanElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const tileRef = useRef<HTMLDivElement>(null)
  const currentCharRef = useRef(initialChar)
  const scrambleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useImperativeHandle(ref, () => ({
    scrambleTo(targetChar: string, delay: number) {
      if (targetChar === currentCharRef.current) return

      if (scrambleTimerRef.current) {
        clearInterval(scrambleTimerRef.current)
        scrambleTimerRef.current = null
      }

      setTimeout(() => {
        if (!tileRef.current || !frontSpanRef.current || !innerRef.current) return

        tileRef.current.classList.add('scrambling')
        let scrambleCount = 0
        const maxScrambles = 10 + Math.floor(Math.random() * 4)

        scrambleTimerRef.current = setInterval(() => {
          if (!frontSpanRef.current || !innerRef.current || !tileRef.current) return

          const randChar = CHARSET[Math.floor(Math.random() * CHARSET.length)]
          frontSpanRef.current.textContent = randChar === ' ' ? '' : randChar

          const color = SCRAMBLE_COLORS[scrambleCount % SCRAMBLE_COLORS.length]
          ;(frontSpanRef.current.parentElement as HTMLElement).style.backgroundColor = color

          if (color === '#FFFFFF' || color === '#FFCC00') {
            frontSpanRef.current.style.color = '#111'
          } else {
            frontSpanRef.current.style.color = ''
          }

          scrambleCount++

          if (scrambleCount >= maxScrambles) {
            clearInterval(scrambleTimerRef.current!)
            scrambleTimerRef.current = null

            ;(frontSpanRef.current.parentElement as HTMLElement).style.backgroundColor = ''
            frontSpanRef.current.style.color = ''
            frontSpanRef.current.textContent = targetChar === ' ' ? '' : targetChar

            innerRef.current.style.transition = `transform ${FLIP_DURATION}ms ease-in-out`
            innerRef.current.style.transform = 'perspective(400px) rotateX(-8deg)'

            setTimeout(() => {
              if (!innerRef.current || !tileRef.current) return
              innerRef.current.style.transform = ''
              setTimeout(() => {
                if (!innerRef.current || !tileRef.current) return
                innerRef.current.style.transition = ''
                tileRef.current.classList.remove('scrambling')
                currentCharRef.current = targetChar
              }, FLIP_DURATION)
            }, FLIP_DURATION / 2)
          }
        }, 70)
      }, delay)
    },
  }))

  return (
    <div className="tile" ref={tileRef}>
      <div className="tile-inner" ref={innerRef}>
        <div className="tile-front">
          <span ref={frontSpanRef}>
            {initialChar === ' ' ? '' : initialChar}
          </span>
        </div>
        <div className="tile-back">
          <span></span>
        </div>
      </div>
    </div>
  )
})

export default Tile
