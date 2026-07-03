import iconUrl from '/icon.png'

import { cn } from '~/lib/cn'
import { APP_NAME } from '~/modules/shared/consts'

export const MINIMIZED_ICON_SIZE_PX = 45
const POPUP_ICON_URL = browser.runtime.getURL(iconUrl as '/icon.png')

type MinimizedIconButtonProps = {
  onClick: () => void
  className?: string
}

export function MinimizedIconButton({ onClick, className }: MinimizedIconButtonProps) {
  return (
    <div
      role="button"
      className={cn(
        'minimized-icon shrink-0 w-[55px] h-[55px] bg-primary-300 rounded-[10px] shadow-lg overflow-hidden p-0 cursor-pointer flex items-center justify-center',
        className,
      )}
      aria-label="Abrir menu"
      onClick={onClick}
    >
      <img
        src={POPUP_ICON_URL}
        alt={APP_NAME}
        width={MINIMIZED_ICON_SIZE_PX}
        height={MINIMIZED_ICON_SIZE_PX}
        className="block"
      />
    </div>
  )
}
