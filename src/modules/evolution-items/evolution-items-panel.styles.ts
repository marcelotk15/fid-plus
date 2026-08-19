export const EVOLUTION_ITEMS_PANEL_STYLE_ID = 'fid-plus-evolution-items-style'

const PANEL_STYLES = `
#fid-plus-evolution-items [data-fid-plus-body][hidden],
#fid-plus-evolution-items[data-fid-plus-panel-open='false'] [data-fid-plus-body] {
  display: none !important;
}
#fid-plus-evolution-items [data-fid-plus-chevron] {
  flex-shrink: 0;
  transform: rotate(0deg) !important;
  transition: transform 300ms ease-out !important;
}
#fid-plus-evolution-items [data-fid-plus-chevron][data-open='true'],
#fid-plus-evolution-items[data-fid-plus-panel-open='true'] [data-fid-plus-chevron] {
  transform: rotate(180deg) !important;
}
#fid-plus-evolution-items [data-fid-plus-body]:not([hidden]) {
  animation: fid-plus-evolution-items-open 200ms ease-out;
}
@keyframes fid-plus-evolution-items-open {
  from { opacity: 0; }
  to { opacity: 1; }
}
`.trim()

export function ensureEvolutionItemsPanelStyles(): void {
  if (document.getElementById(EVOLUTION_ITEMS_PANEL_STYLE_ID)) return

  const style = document.createElement('style')
  style.id = EVOLUTION_ITEMS_PANEL_STYLE_ID
  style.textContent = PANEL_STYLES
  document.head.append(style)
}
