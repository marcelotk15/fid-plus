import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  applyLayoutFix,
  findMainContainer,
  hasInsertPoint,
  insertAttrsGridBetweenFirstDivs,
  restoreLayout,
  waitForInsertPoint,
  waitForMainContainer,
  watchLayoutFix,
} from '~/modules/player/layout'

describe('findMainContainer', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('prefers direct child with space-y-6 inside main', () => {
    document.body.innerHTML = `
      <main>
        <div class="space-y-6 max-w-2xl"></div>
      </main>
    `

    expect(findMainContainer()?.classList.contains('space-y-6')).toBe(true)
  })

  it('ignores nested space-y-6 when direct child is the layout wrapper', () => {
    document.body.innerHTML = `
      <main>
        <div class="space-y-6 max-w-2xl">
          <div class="space-y-6 nested">Nested</div>
        </div>
      </main>
    `

    const container = findMainContainer()
    expect(container?.classList.contains('nested')).toBe(false)
    expect(container?.classList.contains('max-w-2xl')).toBe(true)
  })

  it('falls back to max-w-2xl when space-y-6 is missing', () => {
    document.body.innerHTML = `
      <main>
        <div class="max-w-2xl"></div>
      </main>
    `

    expect(findMainContainer()?.classList.contains('max-w-2xl')).toBe(true)
  })

  it('falls back to first direct child of main', () => {
    document.body.innerHTML = `
      <main>
        <div class="player-profile"></div>
      </main>
    `

    expect(findMainContainer()?.classList.contains('player-profile')).toBe(true)
  })

  it('falls back to main element', () => {
    document.body.innerHTML = `<main class="profile-main"></main>`

    expect(findMainContainer()?.classList.contains('profile-main')).toBe(true)
  })
})

describe('waitForMainContainer', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('resolves when main content appears later', async () => {
    const promise = waitForMainContainer({ timeout: 1_000 })

    setTimeout(() => {
      document.body.innerHTML = `
        <main>
          <div class="max-w-2xl"></div>
        </main>
      `
    }, 50)

    const container = await promise

    expect(container.classList.contains('max-w-2xl')).toBe(true)
  })
})

describe('applyLayoutFix', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('removes max-w-2xl from layout container', () => {
    document.body.innerHTML = `
      <main>
        <div class="space-y-6 max-w-2xl"></div>
      </main>
    `

    expect(applyLayoutFix()).toBe(true)
    expect(findMainContainer()?.classList.contains('max-w-2xl')).toBe(false)
  })

  it('removes max-w-2xl from main direct children', () => {
    document.body.innerHTML = `
      <main class="max-w-2xl">
        <div class="space-y-6"></div>
      </main>
    `

    expect(applyLayoutFix()).toBe(true)
    expect(document.querySelector('main')?.classList.contains('max-w-2xl')).toBe(false)
  })
})

describe('watchLayoutFix', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps max-w-2xl removed when react re-adds the class', async () => {
    document.body.innerHTML = `
      <main>
        <div class="space-y-6 max-w-2xl"></div>
      </main>
    `

    const container = findMainContainer()!
    const cleanup = watchLayoutFix()

    expect(container.classList.contains('max-w-2xl')).toBe(false)

    container.classList.add('max-w-2xl')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(container.classList.contains('max-w-2xl')).toBe(false)

    cleanup()
  })
})

describe('restoreLayout', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('restores max-w-2xl on container', () => {
    document.body.innerHTML = `
      <main>
        <div class="space-y-6"></div>
      </main>
    `

    restoreLayout()

    expect(findMainContainer()?.classList.contains('max-w-2xl')).toBe(true)
  })
})

describe('insertAttrsGridBetweenFirstDivs', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('inserts grid between the first two direct child divs', () => {
    document.body.innerHTML = `
      <div class="space-y-6">
        <div class="first">First</div>
        <div class="second">Second</div>
        <div class="third">Third</div>
      </div>
    `

    const container = document.querySelector('.space-y-6')!
    const grid = document.createElement('div')
    grid.setAttribute('data-tour', 'attrs-grid')

    insertAttrsGridBetweenFirstDivs(container, grid)

    const children = Array.from(container.children)
    expect(children[0]?.classList.contains('first')).toBe(true)
    expect(children[1]).toBe(grid)
    expect(children[2]?.classList.contains('second')).toBe(true)
    expect(children[3]?.classList.contains('third')).toBe(true)
  })

  it('appends grid when no child divs exist', () => {
    document.body.innerHTML = `<div class="space-y-6"></div>`

    const container = document.querySelector('.space-y-6')!
    const grid = document.createElement('div')
    grid.setAttribute('data-tour', 'attrs-grid')

    insertAttrsGridBetweenFirstDivs(container, grid)

    expect(container.lastElementChild).toBe(grid)
  })

  it('inserts grid after the only child div when insert point is not ready', () => {
    document.body.innerHTML = `
      <div class="space-y-6">
        <div class="only">Only</div>
      </div>
    `

    const container = document.querySelector('.space-y-6')!
    const only = container.querySelector('.only')!
    const grid = document.createElement('div')
    grid.setAttribute('data-tour', 'attrs-grid')

    insertAttrsGridBetweenFirstDivs(container, grid)

    expect(only.nextElementSibling).toBe(grid)
  })
})

describe('waitForInsertPoint', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('resolves when a second child div appears', async () => {
    document.body.innerHTML = `
      <div class="space-y-6">
        <div class="first">First</div>
      </div>
    `

    const container = document.querySelector('.space-y-6')!
    const promise = waitForInsertPoint(container, { timeout: 1_000 })

    setTimeout(() => {
      const second = document.createElement('div')
      second.className = 'second'
      second.textContent = 'Second'
      container.append(second)
    }, 50)

    await promise

    expect(hasInsertPoint(container)).toBe(true)
  })
})
