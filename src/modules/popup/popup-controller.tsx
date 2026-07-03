import { createRef, StrictMode } from 'react'
import ReactDOM from 'react-dom/client'

import { PopupPanel, type PopupHandle } from './popup-panel'

export const PANEL_HOST_ID = 'fid-plus-popup-host'
const INITIAL_OFFSET_PX = 24

type MountedElements = {
  root: ReactDOM.Root
  wrapper: HTMLDivElement
}

type PopupUi = Awaited<ReturnType<typeof createShadowRootUi<MountedElements>>>

let ui: PopupUi | null = null
let panelHandle: PopupHandle | null = null
const wrapperRef = createRef<HTMLDivElement>()

function applyInitialPosition(wrapper: HTMLDivElement): void {
  wrapper.style.position = 'fixed'
  wrapper.style.top = `${INITIAL_OFFSET_PX}px`
  wrapper.style.right = `${INITIAL_OFFSET_PX}px`
  wrapper.style.zIndex = '2147483647'
}

export async function initPopupUi(ctx: InstanceType<typeof ContentScriptContext>): Promise<void> {
  ui = await createShadowRootUi<MountedElements>(ctx, {
    name: 'fid-plus-popup',
    position: 'inline',
    anchor: 'body',
    onMount: (container) => {
      const wrapper = document.createElement('div')
      wrapper.id = PANEL_HOST_ID
      applyInitialPosition(wrapper)
      wrapperRef.current = wrapper
      container.append(wrapper)

      const root = ReactDOM.createRoot(wrapper)
      root.render(
        <StrictMode>
          <PopupPanel
            wrapperRef={wrapperRef}
            onClose={() => destroyPopup()}
            onReady={(handle) => {
              panelHandle = handle
            }}
          />
        </StrictMode>,
      )

      return { root, wrapper }
    },
    onRemove: (elements) => {
      panelHandle = null
      wrapperRef.current = null
      elements?.root.unmount()
      elements?.wrapper.remove()
    },
  })
}

export function togglePopup(): void {
  if (!ui) return

  if (!ui.mounted) {
    ui.mount()
    panelHandle?.open()
    return
  }

  if (panelHandle?.isMinimized()) {
    panelHandle.open()
    return
  }

  destroyPopup()
}

export function destroyPopup(): void {
  ui?.remove()
}
