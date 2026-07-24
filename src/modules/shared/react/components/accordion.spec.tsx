import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { Accordion } from './accordion'

function renderAccordion(options?: { title?: string; defaultOpen?: boolean }): {
  container: HTMLDivElement
  root: Root
} {
  const container = document.createElement('div')
  document.body.append(container)

  const root = createRoot(container)

  act(() => {
    root.render(
      <Accordion title={options?.title ?? 'Fixos'} defaultOpen={options?.defaultOpen}>
        <p data-testid="accordion-content">Conteúdo</p>
      </Accordion>,
    )
  })

  return { container, root }
}

function getTrigger(): HTMLButtonElement {
  const trigger = document.querySelector('[data-testid="accordion"] button')
  if (!(trigger instanceof HTMLButtonElement)) {
    throw new TypeError('Accordion trigger not found')
  }
  return trigger
}

describe('Accordion', () => {
  let root: Root | null = null

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    act(() => {
      root?.unmount()
    })
    root = null
  })

  it('renders title and children when open by default', () => {
    const rendered = renderAccordion()
    root = rendered.root

    expect(getTrigger().getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelector('[data-testid="accordion-content"]')).toBeTruthy()
  })

  it('hides children when collapsed', () => {
    const rendered = renderAccordion({ title: 'Marcos', defaultOpen: false })
    root = rendered.root

    expect(getTrigger().getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('[data-testid="accordion-content"]')).toBeNull()
  })

  it('toggles content on click', () => {
    const rendered = renderAccordion({ title: 'Objetivos', defaultOpen: false })
    root = rendered.root
    const trigger = getTrigger()

    act(() => {
      trigger.click()
    })
    expect(document.querySelector('[data-testid="accordion-content"]')).toBeTruthy()

    act(() => {
      trigger.click()
    })
    expect(document.querySelector('[data-testid="accordion-content"]')).toBeNull()
  })
})
