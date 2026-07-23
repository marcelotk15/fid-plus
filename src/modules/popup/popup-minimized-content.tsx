import { useState, type RefObject } from 'react'

import { cn } from '~/modules/shared/react/utils/cn'

import { MinimizedDragHandle } from './minimized-drag-handle'
import { MinimizedIconButton } from './minimized-icon-button'

type PopupMinimizedContentProps = {
  wrapperRef: RefObject<HTMLDivElement | null>
  onOpen: () => void
  onPositionChange?: (top: number) => void
}

export function PopupMinimizedContent({ wrapperRef, onOpen, onPositionChange }: PopupMinimizedContentProps) {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div data-testid="popup-minimized" className="group relative inline-flex items-center">
      <MinimizedIconButton
        onClick={onOpen}
        className={cn(
          'transition-transform duration-150 ease-out',
          isDragging ? '-translate-x-2' : 'group-hover:-translate-x-2',
        )}
      />
      <MinimizedDragHandle
        wrapperRef={wrapperRef}
        onDraggingChange={setIsDragging}
        onPositionChange={onPositionChange}
      />
    </div>
  )
}
