import { afterEach, describe, expect, it } from 'vitest'

import { EVOLUTION_ITEMS_PANEL_STYLE_ID, ensureEvolutionItemsPanelStyles } from './evolution-items-panel.styles'

describe('evolution-items-panel.styles', () => {
  afterEach(() => {
    document.getElementById(EVOLUTION_ITEMS_PANEL_STYLE_ID)?.remove()
  })

  it('injects collapse styles once', () => {
    ensureEvolutionItemsPanelStyles()
    ensureEvolutionItemsPanelStyles()

    const styles = document.querySelectorAll(`#${EVOLUTION_ITEMS_PANEL_STYLE_ID}`)
    expect(styles).toHaveLength(1)
    expect(styles[0]?.textContent).toContain('display: none !important')
    expect(styles[0]?.textContent).toContain('rotate(180deg)')
  })
})
