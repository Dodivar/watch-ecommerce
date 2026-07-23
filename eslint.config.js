import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfig([
  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  // Configuration JavaScript recommandée (appliquée globalement)
  js.configs.recommended,

  // Configuration pour les fichiers serverless dans api/
  {
    files: ['api/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Configuration pour les fichiers backend Node.js
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Configuration Node pour tooling Vite / scripts (évite globals navigateur sur import.meta Vite)
  {
    files: ['vite/**/*.{js,mjs}', 'scripts/**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Tests e2e Playwright (config + specs) : contexte Node.
  {
    files: ['playwright.config.js', 'tests/e2e/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Configuration par défaut pour le reste du projet
  {
    files: ['**/*.{js,mjs,jsx,vue}'],
    ignores: ['vite/**', 'scripts/**', 'api/**', 'backend/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Configuration Vue.js
  ...pluginVue.configs['flat/essential'],
  
  // Configuration Prettier
  skipFormatting,
])
