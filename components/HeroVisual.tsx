'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './HeroVisual.module.css'

export function HeroVisual() {
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 })
  const animationRef = useRef<number>()

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const normalizedX = Math.min(Math.max(event.clientX / window.innerWidth, 0), 1)
      const normalizedY = Math.min(Math.max(event.clientY / window.innerHeight, 0), 1)

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      animationRef.current = requestAnimationFrame(() => {
        setPointer({ x: normalizedX, y: normalizedY })
      })
    }

    window.addEventListener('pointermove', handlePointerMove)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const translateX = (pointer.x - 0.5) * 100
  const translateY = (pointer.y - 0.5) * 50

  return (
    <div className={styles.heroVisual} aria-hidden="true">
      <div
        className={styles.floatWrapper}
        style={{ transform: `translate3d(${translateX}px, ${translateY}px, 0)` }}
      >
        <div className={styles.halo} />
        <div className={styles.diamond}>
          <span className={styles.play} />
        </div>
      </div>
    </div>
  )
}

