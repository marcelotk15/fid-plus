import { destroyEvolutionItems, initEvolutionItems } from '~/modules/evolution-items/evolution-items-controller'

export default defineContentScript({
  matches: ['*://*.footballidentity.org/*'],
  runAt: 'document_idle',

  main(ctx) {
    initEvolutionItems()

    ctx.onInvalidated(() => {
      destroyEvolutionItems()
    })
  },
})
