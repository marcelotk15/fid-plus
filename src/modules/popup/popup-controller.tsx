import { createRef, StrictMode } from 'react'
import ReactDOM from 'react-dom/client'

import { PopupPanel, type PopupHandle } from './popup-panel'
import { readPopupPersistedState, writePopupPersistedState } from './popup-state'

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

function getInitialPanelProps() {
  const persisted = readPopupPersistedState()

  return {
    initialMode: persisted?.mode ?? 'minimized',
    initialOpenPosition: persisted?.openPosition ?? null,
    initialMinimizedTop: persisted?.minimizedTop ?? null,
  }
}

export async function initPopupUi(ctx: InstanceType<typeof ContentScriptContext>): Promise<void> {
  const initialProps = getInitialPanelProps()

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
            initialMode={initialProps.initialMode}
            initialOpenPosition={initialProps.initialOpenPosition}
            initialMinimizedTop={initialProps.initialMinimizedTop}
            onPersistState={(state) => writePopupPersistedState(globalThis.localStorage, state)}
            onClose={() => closePopup()}
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

export function restorePopupIfNeeded(): void {
  if (!ui || ui.mounted) return

  const persisted = readPopupPersistedState()
  if (persisted?.visible === false) return

  if (!persisted) {
    writePopupPersistedState(globalThis.localStorage, {
      visible: true,
      mode: 'minimized',
    })
  }

  ui.mount()
}

export function togglePopup(): void {
  if (!ui) return

  if (!ui.mounted) {
    ui.mount()
    panelHandle?.open()
  } else if (panelHandle?.isMinimized()) {
    panelHandle.open()
  } else {
    panelHandle?.minimize()
  }
}

export function closePopup(): void {
  writePopupPersistedState(globalThis.localStorage, {
    visible: false,
    mode: 'minimized',
  })
  destroyPopup()
}

export function destroyPopup(): void {
  ui?.remove()
}
