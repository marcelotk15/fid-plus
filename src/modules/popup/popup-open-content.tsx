import type { RefObject } from 'react'

import { useState } from 'react'

import { cn } from '~/lib/cn'
import { APP_NAME } from '~/modules/shared/consts'
import { useAuthUser } from '~/modules/shared/hooks'

import { HeaderButton } from './header-button'
import { applyPanelPosition } from './popup-position'

type PopupOpenContentProps = {
  wrapperRef: RefObject<HTMLDivElement | null>
  onClose: () => void
  onMinimize: () => void
}

function IconMinimize() {
  return (
    <svg className="fill-accent-gold" viewBox="0 0 52 52" width="8" height="8">
      <rect x="4" y="24" width="44" height="8" rx="3"></rect>
    </svg>
  )
}

function IconClose() {
  return (
    <svg className="fill-accent-gold" viewBox="0 0 52 52" width="8" height="8">
      <path d="M50.4423 1.55759C48.3654 -0.519199 44.9984 -0.519199 42.9217 1.5576L26 18.4793L9.07834 1.5576C7.00155 -0.51919 3.6344 -0.51919 1.5576 1.5576C-0.519191 3.6344 -0.519191 7.00155 1.5576 9.07834L18.4793 26L1.55759 42.9217C-0.519196 44.9984 -0.5192 48.3654 1.55759 50.4423C3.63439 52.5191 7.00155 52.5191 9.07834 50.4423L26 33.5207L42.9217 50.4423C44.9984 52.5191 48.3654 52.5191 50.4423 50.4423C52.5191 48.3654 52.5191 44.9984 50.4423 42.9217L33.5207 26L50.4423 9.07834C52.5191 7.00155 52.5191 3.63439 50.4423 1.55759Z"></path>
    </svg>
  )
}

export function PopupOpenContent({ wrapperRef, onClose, onMinimize }: PopupOpenContentProps) {
  const [isGrabbing, setIsGrabbing] = useState(false)
  const { isLoggedIn, user } = useAuthUser()

  const handleHeaderPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    if (event.target instanceof Element && event.target.closest('[data-testid="header-button"]')) return

    const wrapper = wrapperRef.current
    if (!wrapper) return

    const rect = wrapper.getBoundingClientRect()
    applyPanelPosition(wrapper, rect.left, rect.top)

    const offsetX = event.clientX - rect.left
    const offsetY = event.clientY - rect.top
    const header = event.currentTarget

    setIsGrabbing(true)
    header.setPointerCapture(event.pointerId)

    const onPointerMove = (moveEvent: PointerEvent) => {
      applyPanelPosition(wrapper, moveEvent.clientX - offsetX, moveEvent.clientY - offsetY)
    }

    const onPointerUp = (upEvent: PointerEvent) => {
      setIsGrabbing(false)
      header.releasePointerCapture(upEvent.pointerId)
      header.removeEventListener('pointermove', onPointerMove)
      header.removeEventListener('pointerup', onPointerUp)
      header.removeEventListener('pointercancel', onPointerUp)
    }

    header.addEventListener('pointermove', onPointerMove)
    header.addEventListener('pointerup', onPointerUp)
    header.addEventListener('pointercancel', onPointerUp)
  }

  return (
    <div
      data-testid="popup-open"
      className="aside-popup-content w-[360px] max-h-[90vh] rounded-lg bg-panel-bg shadow-[0_3px_5px_-1px_rgba(19,64,42,0.2),0_6px_10px_rgba(19,64,42,0.14),0_1px_18px_rgba(19,64,42,0.12)] overflow-hidden"
    >
      <header
        className={cn(
          'bg-primary-300 px-4 py-1 flex flex-wrap items-center justify-between rounded-t-lg select-none touch-none',
          isGrabbing ? 'cursor-grabbing' : 'cursor-grab',
        )}
        onPointerDown={handleHeaderPointerDown}
      >
        <div className="header-buttons flex gap-1 w-full justify-end mb-3">
          <HeaderButton label="Minimizar" onClick={onMinimize}>
            <IconMinimize />
          </HeaderButton>
          <HeaderButton label="Fechar" onClick={onClose}>
            <IconClose />
          </HeaderButton>
        </div>
        <span className="text-xl font-semibold leading-[1.3] text-cream w-full">{APP_NAME}</span>
      </header>
      <section className="screen max-h-[65vh] min-h-[400px] p-4 overflow-y-auto mb-[60px]">
        <p className="placeholder m-0 text-[13px] leading-normal text-primary-700/60">
          {isLoggedIn ? `Bem-vindo, ${user?.email}` : 'Faça login para continuar'}
        </p>
      </section>
    </div>
  )
}
