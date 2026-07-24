import { useEffect, useRef, useState, type RefObject } from 'react'

import type { PopupPersistedMode, PopupPersistedState } from './popup-state'

import { PopupMinimizedContent } from './popup-minimized-content'
import { PopupOpenContent } from './popup-open-content'
import { applyMinimizedPosition, applyMinimizedVerticalPosition, applyPanelPosition } from './popup-position'

export {
  applyMinimizedPosition,
  applyMinimizedVerticalPosition,
  applyPanelPosition,
  clampMinimizedTop,
  clampPanelPosition,
} from './popup-position'

export type PopupHandle = {
  open: () => void
  minimize: () => void
  isMinimized: () => boolean
}

type PopupPanelProps = {
  wrapperRef: RefObject<HTMLDivElement | null>
  initialMode?: PopupPersistedMode
  initialOpenPosition?: { left: number; top: number } | null
  initialMinimizedTop?: number | null
  onPersistState?: (state: PopupPersistedState) => void
  onClose: () => void
  onReady: (handle: PopupHandle) => void
}

export function PopupPanel({
  wrapperRef,
  initialMode = 'open',
  initialOpenPosition = null,
  initialMinimizedTop = null,
  onPersistState,
  onClose,
  onReady,
}: PopupPanelProps) {
  const [state, setState] = useState<PopupPersistedMode>(initialMode)
  const stateRef = useRef(state)
  const savedOpenPositionRef = useRef<{ left: number; top: number } | null>(initialOpenPosition)
  const minimizedTopRef = useRef<number | null>(initialMinimizedTop)
  stateRef.current = state

  const persistState = (mode: PopupPersistedMode) => {
    const wrapper = wrapperRef.current

    onPersistState?.({
      visible: true,
      mode,
      openPosition: savedOpenPositionRef.current ?? undefined,
      minimizedTop:
        mode === 'minimized' && wrapper ? wrapper.getBoundingClientRect().top : (minimizedTopRef.current ?? undefined),
    })
  }

  const openPanel = () => {
    setState('open')
    persistState('open')
  }

  const minimizePanel = () => {
    const wrapper = wrapperRef.current
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect()
      savedOpenPositionRef.current = { left: rect.left, top: rect.top }
    }

    setState('minimized')
    persistState('minimized')
  }

  useEffect(() => {
    onReady({
      open: openPanel,
      minimize: minimizePanel,
      isMinimized: () => stateRef.current === 'minimized',
    })
  })

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    if (state === 'minimized') {
      if (minimizedTopRef.current !== null) {
        applyMinimizedVerticalPosition(wrapper, minimizedTopRef.current)
      } else {
        applyMinimizedPosition(wrapper)
      }
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

  const handleMinimizedPositionChange = (top: number) => {
    minimizedTopRef.current = top
    persistState('minimized')
  }

  const isMinimized = state === 'minimized'

  return (
    <div id="aside-popup" className="font-sans pointer-events-auto z-9999999">
      {isMinimized ? (
        <PopupMinimizedContent
          wrapperRef={wrapperRef}
          onOpen={openPanel}
          onPositionChange={handleMinimizedPositionChange}
        />
      ) : (
        <PopupOpenContent wrapperRef={wrapperRef} onClose={onClose} onMinimize={minimizePanel} />
      )}
    </div>
  )
}
