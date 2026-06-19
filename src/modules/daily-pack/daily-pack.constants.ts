export const DAILY_PACK_TOAST = {
  TITLE: 'Daily Pack disponível',
  MESSAGE: 'Seu pacote diário já pode ser aberto.',
  GO_ACTION_LABEL: 'Ir até lá',
  AUTO_DISMISS_MS: 8_000,
} as const

export const DAILY_PACK_SIDEBAR_MENU = {
  HREF: '/packs',
  SELECTOR: 'ul[data-sidebar="menu"] a[data-sidebar="menu-button"][href="/packs"]',
  HIGHLIGHT_ATTR: 'data-fid-plus-daily-pack-highlight',
  STYLE_ID: 'fid-plus-daily-pack-menu-style',
  GLITTER_CLASS: 'fid-plus-daily-pack-glitter',
  GLITTER_PARTICLE_COUNT: 14,
} as const

export const DAILY_PACK_SIDEBAR_MENU_CSS = `
a[${DAILY_PACK_SIDEBAR_MENU.HIGHLIGHT_ATTR}='true'] {
  position: relative !important;
  overflow: hidden !important;
  background-color: rgba(251, 191, 36, 0.18) !important;
  border: 1px solid rgba(251, 191, 36, 0.9) !important;
  box-shadow: 0 0 14px rgba(251, 191, 36, 0.28) !important;
}

a[${DAILY_PACK_SIDEBAR_MENU.HIGHLIGHT_ATTR}='true']:hover {
  background-color: rgba(251, 191, 36, 0.28) !important;
}

.${DAILY_PACK_SIDEBAR_MENU.GLITTER_CLASS} {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

.${DAILY_PACK_SIDEBAR_MENU.GLITTER_CLASS} span {
  position: absolute;
  top: -10%;
  width: 3px;
  height: 3px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #fde68a 0%, #fbbf24 45%, #f59e0b 100%);
  box-shadow: 0 0 5px rgba(251, 191, 36, 0.95);
  opacity: 0;
  animation: fid-plus-glitter-fall linear infinite;
}

@keyframes fid-plus-glitter-fall {
  0% {
    transform: translateY(-20%) translateX(0) rotate(0deg) scale(0.6);
    opacity: 0;
  }

  12% {
    opacity: 1;
  }

  100% {
    transform: translateY(420%) translateX(6px) rotate(240deg) scale(1);
    opacity: 0;
  }
}
`.trim()
