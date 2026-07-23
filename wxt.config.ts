import { defineConfig } from 'wxt'

const iconMap = {
  16: '/icon.png',
  32: '/icon.png',
  48: '/icon.png',
  64: '/icon.png',
  128: '/icon.png',
} as const

function versions() {
  return {
    ...(process.env.EXTENSION_VERSION && {
      version: process.env.EXTENSION_VERSION,
    }),
    ...(process.env.EXTENSION_VERSION_NAME && {
      version_name: process.env.EXTENSION_VERSION_NAME,
    }),
  }
}

export default defineConfig({
  webExt: {
    binaries: {
      edge: String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
    },
  },
  srcDir: 'src',
  manifest: () => ({
    name: 'FID Plus',
    description: 'Automatiza a resolução dos quizzes diários do Football Identity.',
    icons: iconMap,
    action: {
      default_icon: iconMap,
    },
    ...versions(),
  }),
})
