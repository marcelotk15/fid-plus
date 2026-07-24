const VIEWPORT_EDGE_PADDING_PX = 16

export function clampPanelPosition(
  wrapper: HTMLElement,
  left: number,
  top: number,
  padding = VIEWPORT_EDGE_PADDING_PX,
): { left: number; top: number } {
  const { width, height } = wrapper.getBoundingClientRect()
  const minLeft = padding
  const minTop = padding
  const maxLeft = Math.max(minLeft, window.innerWidth - width - padding)
  const maxTop = Math.max(minTop, window.innerHeight - height - padding)

  return {
    left: Math.min(Math.max(left, minLeft), maxLeft),
    top: Math.min(Math.max(top, minTop), maxTop),
  }
}

export function applyPanelPosition(wrapper: HTMLElement, left: number, top: number): void {
  const clamped = clampPanelPosition(wrapper, left, top)
  wrapper.style.left = `${clamped.left}px`
  wrapper.style.top = `${clamped.top}px`
  wrapper.style.right = 'auto'
  wrapper.style.bottom = 'auto'
}

export function clampMinimizedTop(wrapper: HTMLElement, top: number, padding = VIEWPORT_EDGE_PADDING_PX): number {
  const { height } = wrapper.getBoundingClientRect()
  const minTop = padding
  const maxTop = Math.max(minTop, window.innerHeight - height - padding)

  return Math.min(Math.max(top, minTop), maxTop)
}

export function applyMinimizedVerticalPosition(
  wrapper: HTMLElement,
  top: number,
  padding = VIEWPORT_EDGE_PADDING_PX,
): void {
  wrapper.style.position = 'fixed'
  wrapper.style.top = `${clampMinimizedTop(wrapper, top, padding)}px`
  wrapper.style.right = `${padding}px`
  wrapper.style.left = 'auto'
  wrapper.style.bottom = 'auto'
}

export function applyMinimizedPosition(wrapper: HTMLElement, padding = VIEWPORT_EDGE_PADDING_PX): void {
  applyMinimizedVerticalPosition(wrapper, padding, padding)
}
