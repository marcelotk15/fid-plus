import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'wxt'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

const iconMap = {
  16: '/icon.png',
  32: '/icon.png',
  48: '/icon.png',
  64: '/icon.png',
  128: '/icon.png',
} as const

function versions() {
  return {
    version: process.env.EXTENSION_VERSION ?? pkg.version,
    ...(process.env.EXTENSION_VERSION_NAME && {
      version_name: process.env.EXTENSION_VERSION_NAME,
    }),
  }
}

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
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
    web_accessible_resources: [
      {
        matches: ['*://*.footballidentity.org/*'],
        resources: [iconMap[128]],
      },
    ],
    ...versions(),
  }),
})
