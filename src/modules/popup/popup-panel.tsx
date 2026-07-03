import { useEffect, useRef, useState, type RefObject } from 'react'

import { PopupMinimizedContent } from './popup-minimized-content'
import { PopupOpenContent } from './popup-open-content'
import { applyMinimizedPosition, applyPanelPosition } from './popup-position'

export {
  applyMinimizedPosition,
  applyMinimizedVerticalPosition,
  applyPanelPosition,
  clampMinimizedTop,
  clampPanelPosition,
} from './popup-position'

export type PopupHandle = {
  open: () => void
  isMinimized: () => boolean
}

type PopupPanelProps = {
  wrapperRef: RefObject<HTMLDivElement | null>
  onClose: () => void
  onReady: (handle: PopupHandle) => void
}

export function PopupPanel({ wrapperRef, onClose, onReady }: PopupPanelProps) {
  const [state, setState] = useState<'open' | 'minimized'>('open')
  const stateRef = useRef(state)
  const savedOpenPositionRef = useRef<{ left: number; top: number } | null>(null)
  stateRef.current = state

  useEffect(() => {
    onReady({
      open: () => setState('open'),
      isMinimized: () => stateRef.current === 'minimized',
    })
  }, [onReady])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    if (state === 'minimized') {
      applyMinimizedPosition(wrapper)
      return
    }

    if (savedOpenPositionRef.current) {
      applyPanelPosition(wrapper, savedOpenPositionRef.current.left, savedOpenPositionRef.current.top)
      return
    }

    if (wrapper.style.right !== 'auto') return

    const left = Number.parseFloat(wrapper.style.left)
    const top = Number.parseFloat(wrapper.style.top)
    if (Number.isNaN(left) || Number.isNaN(top)) return

    applyPanelPosition(wrapper, left, top)
  }, [state, wrapperRef])

  const minimizePanel = () => {
    const wrapper = wrapperRef.current
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect()
      savedOpenPositionRef.current = { left: rect.left, top: rect.top }
    }

    setState('minimized')
  }

  const isMinimized = state === 'minimized'

  return (
    <div id="aside-popup" className="font-sans pointer-events-auto z-9999999">
      {isMinimized ? (
        <PopupMinimizedContent wrapperRef={wrapperRef} onOpen={() => setState('open')} />
      ) : (
        <PopupOpenContent wrapperRef={wrapperRef} onClose={onClose} onMinimize={minimizePanel} />
      )}
    </div>
  )
}
