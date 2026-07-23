import type { ReactNode } from 'react'

import { useState } from 'react'

import { cn } from '~/modules/shared/react/utils/cn'

type AccordionProps = {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

export function Accordion({ title, children, defaultOpen = true, className }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section data-testid="accordion" className={cn('border-b border-black/10', className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 border-0 bg-transparent px-0 py-2 cursor-pointer text-left"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
        <span
          className={cn('shrink-0 text-[10px] transition-transform duration-200', open ? 'rotate-180' : 'rotate-0')}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {open ? <div className="pb-1">{children}</div> : null}
    </section>
  )
}
