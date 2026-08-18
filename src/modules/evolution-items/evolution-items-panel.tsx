import { useEffect, useState } from 'react'

import { getAttributeLabel } from '~/modules/shared/attribute-labels'
import { APP_NAME, STORE_ITEMS } from '~/modules/shared/consts'
import { useDebounce } from '~/modules/shared/react/hooks'
import { cn } from '~/modules/shared/react/utils/cn'
import { formatMoney } from '~/modules/weekly-earnings/format-currency'

import type { StoreItem, StoreItemBonus } from './store-items.types'

import { EVOLUTION_ITEMS_HOST_ID } from './attribute-dom'
import { readEvolutionItemsPanelState, writeEvolutionItemsPanelState } from './evolution-items-panel.storage'
import { ensureEvolutionItemsPanelStyles } from './evolution-items-panel.styles'
import {
  EMPTY_SELECTION,
  filterItemsByName,
  mergeBonuses,
  resolveSelectedItems,
  selectSlot,
  type SelectedItems,
} from './item-selection'
import { partitionStoreItems } from './store-items-api'
import { useStoreItems } from './use-store-items'

type Tab = 'equipavel' | 'estudo'

type EvolutionItemsPanelProps = {
  initialSelected?: SelectedItems
  onSelectionChange: (selected: SelectedItems, bonuses: Record<string, number>) => void
}

function getErrorMessage(error: NonNullable<ReturnType<typeof useStoreItems>['error']>): string {
  switch (error) {
    case 'no_token':
      return 'Sessão inválida. Faça login novamente no FID.'
    case 'http':
      return 'Não foi possível carregar os itens da loja.'
    case 'parse':
      return 'Resposta inválida ao carregar os itens da loja.'
    case 'network':
      return 'Erro de rede ao carregar os itens da loja.'
  }
}

function GearIcon() {
  return (
    <svg className="size-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function ChevronDownIcon({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      data-fid-plus-chevron
      data-open={open ? 'true' : 'false'}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function BonusChip({ bonus }: { bonus: StoreItemBonus }) {
  const positive = bonus.value > 0

  return (
    <span
      className={cn(
        'rounded-md border px-1.5 py-0.5 text-[10px] font-display font-bold tabular-nums',
        positive ? 'border-emerald-500/40 text-emerald-400' : 'border-destructive/40 text-destructive',
      )}
    >
      {positive ? '+' : ''}
      {bonus.value} {getAttributeLabel(bonus.attr)}
    </span>
  )
}

function ItemRow({ item, selected, onToggle }: { item: StoreItem; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        'w-full text-left hover:bg-muted/50 rounded-md p-2 pl-2 transition-colors cursor-pointer border-l-4',
        selected ? 'border-emerald-500 bg-emerald-500/10' : 'border-transparent',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 font-display text-sm font-semibold">{item.name}</span>
        <span className="shrink-0 text-xs font-display font-bold tabular-nums text-muted-foreground">
          {formatMoney(item.price)}
        </span>
      </div>
      {item.bonuses.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {item.bonuses.map((bonus) => (
            <BonusChip key={`${item.id}-${bonus.attr}-${bonus.value}`} bonus={bonus} />
          ))}
        </div>
      ) : null}
    </button>
  )
}

export function EvolutionItemsPanel({
  initialSelected = EMPTY_SELECTION,
  onSelectionChange,
}: EvolutionItemsPanelProps) {
  ensureEvolutionItemsPanelStyles()

  const { items, loading, error } = useStoreItems()
  const [open, setOpen] = useState(() => readEvolutionItemsPanelState()?.open ?? true)
  const [tab, setTab] = useState<Tab>('equipavel')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query)
  const [selected, setSelected] = useState<SelectedItems>(initialSelected)
  const { equipavel, estudo } = partitionStoreItems(items)
  const categoryItems = tab === 'equipavel' ? equipavel : estudo
  const visibleItems = filterItemsByName(categoryItems, debouncedQuery)

  useEffect(() => {
    onSelectionChange(selected, mergeBonuses(resolveSelectedItems(items, selected)))
  }, [items, onSelectionChange, selected])

  useEffect(() => {
    document.getElementById(EVOLUTION_ITEMS_HOST_ID)?.setAttribute('data-fid-plus-panel-open', open ? 'true' : 'false')
  }, [open])

  function persistOpen(nextOpen: boolean) {
    writeEvolutionItemsPanelState(globalThis.localStorage, { open: nextOpen })
    document
      .getElementById(EVOLUTION_ITEMS_HOST_ID)
      ?.setAttribute('data-fid-plus-panel-open', nextOpen ? 'true' : 'false')
  }

  function handleToggleOpen(event: { preventDefault: () => void; stopPropagation: () => void }) {
    event.preventDefault()
    event.stopPropagation()

    setOpen((current) => {
      const nextOpen = !current
      persistOpen(nextOpen)
      return nextOpen
    })
  }

  function handleToggle(item: StoreItem) {
    const slot = item.category === STORE_ITEMS.CATEGORY_EQUIPAVEL ? 'equipavel' : 'estudo'
    setSelected((current) => selectSlot(current, slot, item.id))
  }

  return (
    <div data-testid="evolution-items-panel" className="stat-card">
      <div className="mb-3">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent p-0 text-left"
          aria-expanded={open}
          onClick={handleToggleOpen}
        >
          <span className="flex items-center gap-2">
            <GearIcon />
            <span className="font-display text-sm font-semibold">Simular itens</span>
          </span>
          <ChevronDownIcon className="lucide lucide-chevron-down h-4 w-4 text-muted-foreground" open={open} />
        </button>
        <p className="mt-0.5 mb-0 text-[10px] text-emerald-400">Oferecimento de {APP_NAME}</p>
      </div>
      <p className={cn('text-xs text-muted-foreground', open ? 'mb-3' : 'mb-0')}>
        Simulação local: um equipável e um estudo por vez. Não compra nem equipa no jogo.
      </p>

      <div
        data-testid="evolution-items-panel-content"
        data-fid-plus-body
        hidden={!open}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="mb-3 flex gap-0 border-b border-border">
          <button
            type="button"
            className={cn(
              'relative min-h-11 rounded-none border border-transparent border-b-border bg-transparent px-4 py-2 font-display text-sm font-bold',
              tab === 'equipavel'
                ? 'z-10 border-border border-b-background bg-background text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-selected={tab === 'equipavel'}
            onClick={() => setTab('equipavel')}
          >
            Equipável
          </button>
          <button
            type="button"
            className={cn(
              'relative min-h-11 rounded-none border border-transparent border-b-border bg-transparent px-4 py-2 font-display text-sm font-bold',
              tab === 'estudo'
                ? 'z-10 border-border border-b-background bg-background text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-selected={tab === 'estudo'}
            onClick={() => setTab('estudo')}
          >
            Estudo
          </button>
        </div>

        {loading ? (
          <p className="m-0 text-sm text-muted-foreground">Carregando itens...</p>
        ) : error ? (
          <p className="m-0 text-sm text-muted-foreground">{getErrorMessage(error)}</p>
        ) : (
          <>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar item..."
              aria-label="Buscar modificador"
              className="mb-3 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
            {categoryItems.length === 0 ? (
              <p className="m-0 text-sm text-muted-foreground">Nenhum item disponível nesta categoria.</p>
            ) : visibleItems.length === 0 ? (
              <p className="m-0 text-sm text-muted-foreground">Nenhum item encontrado.</p>
            ) : (
              <div className="max-h-72 space-y-1 overflow-auto">
                {visibleItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    selected={item.id === selected[tab]}
                    onToggle={() => handleToggle(item)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
