/**
 * useScrollama — thin wrapper around the scrollama library.
 * Returns the current step index as the user scrolls through
 * `.step` elements inside the container ref.
 */
import { useEffect, useRef, useState } from 'react'
import scrollama from 'scrollama'

export function useScrollama({ offset = 0.5, debug = false } = {}) {
  const containerRef = useRef(null)
  const [currentStep, setCurrentStep] = useState(0)
  const scrollerRef = useRef(null)

  useEffect(() => {
    const scroller = scrollama()
    scrollerRef.current = scroller

    scroller
      .setup({
        step: '.scroll-step',
        offset,
        debug,
      })
      .onStepEnter(({ index }) => setCurrentStep(index))
      .onStepExit(({ index, direction }) => {
        // When scrolling back past the first step, reset to -1
        if (direction === 'up' && index === 0) setCurrentStep(-1)
      })

    window.addEventListener('resize', scroller.resize)
    return () => {
      window.removeEventListener('resize', scroller.resize)
      scroller.destroy()
    }
  }, [offset, debug])

  return { containerRef, currentStep }
}
