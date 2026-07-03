import { useState, type RefObject } from 'react'

import { cn } from '~/lib/cn'

import { applyMinimizedVerticalPosition } from './popup-position'

type MinimizedDragHandleProps = {
  wrapperRef: RefObject<HTMLDivElement | null>
  onDraggingChange?: (dragging: boolean) => void
}

export function MinimizedDragHandle({ wrapperRef, onDraggingChange }: MinimizedDragHandleProps) {
  const [isGrabbing, setIsGrabbing] = useState(false)

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return

    const wrapper = wrapperRef.current
    if (!wrapper) return

    event.preventDefault()
    event.stopPropagation()

    const startY = event.clientY
    const startTop = wrapper.getBoundingClientRect().top
    const handle = event.currentTarget

    setIsGrabbing(true)
    onDraggingChange?.(true)
    handle.setPointerCapture(event.pointerId)

    const onPointerMove = (moveEvent: PointerEvent) => {
      applyMinimizedVerticalPosition(wrapper, startTop + moveEvent.clientY - startY)
    }

    const onPointerUp = (upEvent: PointerEvent) => {
      setIsGrabbing(false)
      onDraggingChange?.(false)
      handle.releasePointerCapture(upEvent.pointerId)
      handle.removeEventListener('pointermove', onPointerMove)
      handle.removeEventListener('pointerup', onPointerUp)
      handle.removeEventListener('pointercancel', onPointerUp)
    }

    handle.addEventListener('pointermove', onPointerMove)
    handle.addEventListener('pointerup', onPointerUp)
    handle.addEventListener('pointercancel', onPointerUp)
  }

  return (
    <div
      className={cn(
        'aside-minimized-drag-handle absolute right-[-22px] grid grid-cols-2 gap-[2px] p-2',
        'pointer-events-none opacity-0 transition-all duration-200 ease-in-out touch-none select-none',
        'group-hover:pointer-events-auto group-hover:opacity-100',
        isGrabbing ? 'pointer-events-auto cursor-grabbing opacity-100' : 'cursor-grab',
      )}
      aria-label="Arrastar verticalmente"
      onPointerDown={handlePointerDown}
    >
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index} className="dot w-1 h-1 rounded-full bg-gray-800" />
      ))}
    </div>
  )
}
