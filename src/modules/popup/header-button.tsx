import type { ReactNode } from 'react'

type HeaderButtonProps = {
  label: string
  onClick: () => void
  children: ReactNode
}

export function HeaderButton({ label, onClick, children }: HeaderButtonProps) {
  const stopDragPropagation = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
  }

  return (
    <button
      type="button"
      data-testid="header-button"
      className="flex items-center justify-center w-[25px] h-[25px] border-0 bg-transparent hover:opacity-80 p-0 cursor-pointer"
      aria-label={label}
      onPointerDown={stopDragPropagation}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
