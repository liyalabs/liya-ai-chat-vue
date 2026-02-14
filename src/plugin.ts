// Liya AI Chat - Vue Plugin
import type { App } from 'vue'
import type { LiyaChatConfig } from './types'
import { initializeClient } from './api'
import { LiyaChatWidget } from './components/widget'
import { LiyaChatApp } from './components/app'

export interface LiyaChatPluginOptions extends LiyaChatConfig {}

export const LiyaChatPlugin = {
  install(app: App, options: LiyaChatPluginOptions) {
    // Validate required options
    if (!options.apiKey) {
      console.error('[LiyaChat] apiKey is required')
      return
    }
    if (!options.baseUrl) {
      console.error('[LiyaChat] baseUrl is required')
      return
    }
    if (!options.assistantId) {
      console.error('[LiyaChat] assistantId is required')
      return
    }

    // Initialize API client
    initializeClient(options)

    // Register components globally based on mode
    if (options.mode === 'widget') {
      app.component('LiyaChatWidget', LiyaChatWidget)
    } else if (options.mode === 'app') {
      app.component('LiyaChatApp', LiyaChatApp)
    } else {
      // Register both if mode not specified
      app.component('LiyaChatWidget', LiyaChatWidget)
      app.component('LiyaChatApp', LiyaChatApp)
    }

    // Provide config globally
    app.provide('liyaChatConfig', options)

    // Add global properties
    app.config.globalProperties.$liyaChat = {
      config: options,
    }
  },
}

export default LiyaChatPlugin
