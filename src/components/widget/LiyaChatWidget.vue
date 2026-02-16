/**
 * ==================================================
 * ██╗     ██╗██╗   ██╗ █████╗ 
 * ██║     ██║╚██╗ ██╔╝██╔══██╗
 * ██║     ██║ ╚████╔╝ ███████║
 * ██║     ██║  ╚██╔╝  ██╔══██║
 * ███████╗██║   ██║   ██║  ██║
 * ╚══════╝╚═╝   ╚═╝   ╚═╝  ╚═╝
 *        AI Assistant
 * ==================================================
 * Author / Creator : Mahmut Denizli (With help of LiyaAi)
 * License          : MIT
 * Connect          : liyalabs.com, info@liyalabs.com
 * ==================================================
 */
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ThemeConfig } from '../../types'
import { useChat } from '../../composables/useChat'
import { useFileUpload } from '../../composables/useFileUpload'
import { useVoice } from '../../composables/useVoice'
import { checkBrowserCompatibility } from '../../composables/useBrowserCompat'
import { useI18n } from '../../i18n/useI18n'
import { getConfig } from '../../api'
import MessageList from '../shared/MessageList.vue'
import ChatInput from '../shared/ChatInput.vue'

const { t, locale, setLocale } = useI18n()

// Toggle language between TR and EN
function toggleLocale(): void {
  const newLocale = locale.value === 'tr' ? 'en' : 'tr'
  setLocale(newLocale)
}

interface Props {
  position?: ThemeConfig['position']
  theme?: ThemeConfig
  welcomeMessage?: string
  placeholder?: string
  showBranding?: boolean
  showVoice?: boolean
  voiceEnabled?: boolean  // false for STANDARD users - shows disabled mic icon
  showFileUpload?: boolean
  offsetX?: number  // horizontal offset in pixels
  offsetY?: number  // vertical offset in pixels
  customIcon?: string  // custom icon URL or SVG
  startOpen?: boolean  // widget açık başlasın mı
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom-right',
  welcomeMessage: 'Bu chat hizmeti Liya AI tarafından sağlanmaktadır. Size bugün nasıl yardımcı olabilirim?',
  placeholder: 'Mesajınızı yazın...',
  showBranding: true,
  showVoice: true,
  voiceEnabled: true,
  showFileUpload: true,
  offsetX: 20,
  offsetY: 20,
  startOpen: false,
})

const pendingMessage = ref('')

const emit = defineEmits<{
  opened: []
  closed: []
  messageSent: [message: string]
  messageReceived: [message: string]
}>()

const isOpen = ref(props.startOpen)
const config = getConfig()

// Browser compatibility state
const isBrowserSupported = ref(true)

// Microphone permission state
const isMicPermissionPending = ref(false)

// Voice composable
const {
  isSupported: isVoiceSupported,
  checkMicPermission,
  requestMicPermission,
} = useVoice()

const {
  messages,
  isLoading,
  currentSessionId,
  sendMessage,
  initFromStorage,
  loadHistory,
} = useChat()

const { uploadFiles, clearAll: clearFiles } = useFileUpload()

const assistantName = computed(() => config.assistantName || 'Assistant')

const positionClasses = computed(() => ({
  'liya-ai-chat-vuejs-widget--bottom-right': props.position === 'bottom-right',
  'liya-ai-chat-vuejs-widget--bottom-left': props.position === 'bottom-left',
  'liya-ai-chat-vuejs-widget--top-right': props.position === 'top-right',
  'liya-ai-chat-vuejs-widget--top-left': props.position === 'top-left',
}))

const cssVars = computed(() => {
  const theme = props.theme || {}
  return {
    '--liya-ai-chat-vuejs-primary-color': theme.primaryColor || '#6366f1',
    '--liya-ai-chat-vuejs-primary-hover': theme.primaryColor ? adjustColor(theme.primaryColor, -10) : '#4f46e5',
    '--liya-ai-chat-vuejs-secondary-color': theme.secondaryColor || '#e5e7eb',
    '--liya-ai-chat-vuejs-bg-color': theme.backgroundColor || '#0f172a',
    '--liya-ai-chat-vuejs-bg-secondary': '#1e293b',
    '--liya-ai-chat-vuejs-text-color': theme.textColor || '#f1f5f9',
    '--liya-ai-chat-vuejs-text-muted': '#94a3b8',
    '--liya-ai-chat-vuejs-border-color': 'rgba(255, 255, 255, 0.08)',
    '--liya-ai-chat-vuejs-border-radius': theme.borderRadius || '16px',
    '--liya-ai-chat-vuejs-font-family': theme.fontFamily || 'system-ui, -apple-system, sans-serif',
    '--liya-ai-chat-vuejs-z-index': theme.zIndex || 9999,
    '--liya-ai-chat-vuejs-offset-x': `${props.offsetX}px`,
    '--liya-ai-chat-vuejs-offset-y': `${props.offsetY}px`,
  }
})

function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)
}

function toggleWidget(): void {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    emit('opened')
  } else {
    emit('closed')
  }
}

async function handleSend(message: string, fileIds?: string[]): Promise<void> {
  if (!message.trim() && (!fileIds || fileIds.length === 0)) return

  // Upload pending files first if we have a session
  let uploadedFileIds = fileIds
  if (currentSessionId.value && fileIds && fileIds.length > 0) {
    const uploaded = await uploadFiles(currentSessionId.value)
    uploadedFileIds = uploaded.map(f => f.id)
  }

  emit('messageSent', message)
  
  const response = await sendMessage(message, uploadedFileIds)
  
  if (response?.assistant_message?.content || response?.response) {
    emit('messageReceived', response.assistant_message?.content || response.response || '')
  }
  
  clearFiles()
}

function handleSuggestionClick(suggestion: string): void {
  pendingMessage.value = suggestion
  // Trigger send with the suggestion
  handleSend(suggestion)
}

// Handle mic permission request
async function handleMicPermissionRequest(): Promise<void> {
  const granted = await requestMicPermission()
  isMicPermissionPending.value = false
  if (!granted) {
    // Permission denied, continue without voice
  }
}

onMounted(async () => {
  // Check browser compatibility first
  const compat = checkBrowserCompatibility()
  isBrowserSupported.value = compat.supported
  
  if (!compat.supported) return
  
  initFromStorage()
  
  // Load history if we have a stored session
  const storedSessionId = currentSessionId.value
  if (storedSessionId) {
    loadHistory(storedSessionId)
  }
  
  // Check mic permission if voice is supported
  if (isVoiceSupported.value) {
    const status = await checkMicPermission()
    if (status === 'prompt') {
      isMicPermissionPending.value = true
    }
  }
})
</script>

<template>
  <!-- Browser Not Supported Card -->
  <div v-if="!isBrowserSupported" class="liya-ai-chat-vuejs-unsupported" :style="cssVars">
    <div class="liya-ai-chat-vuejs-unsupported__card">
      <div class="liya-ai-chat-vuejs-unsupported__icon">
        <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>
      <h3 class="liya-ai-chat-vuejs-unsupported__title">{{ t.browser.unsupportedTitle }}</h3>
      <p class="liya-ai-chat-vuejs-unsupported__message">{{ t.browser.unsupportedMessage }}</p>
      <p class="liya-ai-chat-vuejs-unsupported__browsers">{{ t.browser.recommendedBrowsers }}</p>
    </div>
  </div>

  <div v-else class="liya-ai-chat-vuejs-widget" :class="positionClasses" :style="cssVars">
    <!-- Toggle Button -->
    <button 
      class="liya-ai-chat-vuejs-widget__toggle"
      :class="{ 'liya-ai-chat-vuejs-widget__toggle--open': isOpen }"
      @click="toggleWidget"
      :aria-label="isOpen ? t.widget.closeChat : t.widget.openChat"
    >
      <svg v-if="!isOpen" viewBox="0 0 80 92" fill="none" width="28" height="28">
        <rect x="0" y="0" width="80" height="80" rx="18" fill="#6366F1"/>
        <path d="M22 80 L34 80 L28 92 Z" fill="#6366F1"/>
        <path d="M36 26 V58 H56" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
        <circle cx="36" cy="26" r="3" fill="#FFFFFF"/>
        <circle cx="36" cy="58" r="3" fill="#FFFFFF"/>
        <circle cx="56" cy="58" r="3" fill="#FFFFFF"/>
        <text x="40" y="52" font-size="12" font-weight="600" font-family="system-ui, sans-serif" fill="#FFFFFF">ai</text>
        <path d="M58 16 L60 20 L64 22 L60 24 L58 28 L56 24 L52 22 L56 20 Z" fill="#FFFFFF"/>
        <path d="M66 30 L67.5 33 L71 34.5 L67.5 36 L66 39 L64.5 36 L61 34.5 L64.5 33 Z" fill="#FFFFFF"/>
        <path d="M50 18 L51.5 21 L55 22.5 L51.5 24 L50 27 L48.5 24 L45 22.5 L48.5 21 Z" fill="#FFFFFF"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>

    <!-- Chat Panel -->
    <Transition name="liya-ai-chat-vuejs-slide">
      <div v-if="isOpen" class="liya-ai-chat-vuejs-widget__panel">
        <!-- Mic Permission Banner -->
        <div v-if="isMicPermissionPending" class="liya-ai-chat-vuejs-mic-permission">
          <div class="liya-ai-chat-vuejs-mic-permission__icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
          <div class="liya-ai-chat-vuejs-mic-permission__text">
            <span class="liya-ai-chat-vuejs-mic-permission__title">{{ t.mic.permissionRequired }}</span>
            <span class="liya-ai-chat-vuejs-mic-permission__desc">{{ t.mic.permissionMessage }}</span>
          </div>
          <button 
            class="liya-ai-chat-vuejs-mic-permission__btn"
            @click="handleMicPermissionRequest"
          >
            {{ t.mic.allowButton }}
          </button>
        </div>

        <!-- Header -->
        <div class="liya-ai-chat-vuejs-widget__header">
          <div class="liya-ai-chat-vuejs-widget__header-info">
            <div class="liya-ai-chat-vuejs-widget__avatar">
              <svg viewBox="0 0 80 92" fill="none" width="28" height="28">
                <rect x="0" y="0" width="80" height="80" rx="18" fill="#6366F1"/>
                <path d="M22 80 L34 80 L28 92 Z" fill="#6366F1"/>
                <path d="M36 26 V58 H56" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
                <circle cx="36" cy="26" r="3" fill="#FFFFFF"/>
                <circle cx="36" cy="58" r="3" fill="#FFFFFF"/>
                <circle cx="56" cy="58" r="3" fill="#FFFFFF"/>
                <text x="40" y="52" font-size="12" font-weight="600" font-family="system-ui, sans-serif" fill="#FFFFFF">ai</text>
                <path d="M58 16 L60 20 L64 22 L60 24 L58 28 L56 24 L52 22 L56 20 Z" fill="#FFFFFF"/>
                <path d="M66 30 L67.5 33 L71 34.5 L67.5 36 L66 39 L64.5 36 L61 34.5 L64.5 33 Z" fill="#FFFFFF"/>
                <path d="M50 18 L51.5 21 L55 22.5 L51.5 24 L50 27 L48.5 24 L45 22.5 L48.5 21 Z" fill="#FFFFFF"/>
              </svg>
            </div>
            <div class="liya-ai-chat-vuejs-widget__header-text">
              <h3 class="liya-ai-chat-vuejs-widget__title">{{ assistantName }}</h3>
              <span class="liya-ai-chat-vuejs-widget__status">{{ t.widget.online }}</span>
            </div>
          </div>
          <div class="liya-ai-chat-vuejs-widget__header-actions">
            <!-- Language Toggle Button -->
            <button 
              class="liya-ai-chat-vuejs-widget__lang-btn"
              @click="toggleLocale"
              :title="locale === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'"
            >
              <span class="liya-ai-chat-vuejs-widget__lang-text">{{ locale === 'tr' ? 'EN' : 'TR' }}</span>
            </button>
            <button class="liya-ai-chat-vuejs-widget__close" @click="toggleWidget">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <MessageList
          :messages="messages"
          :is-loading="isLoading"
          :assistant-name="assistantName"
          :welcome-message="welcomeMessage"
          @suggestion-click="handleSuggestionClick"
        />

        <!-- Input -->
        <ChatInput
          :placeholder="placeholder"
          :disabled="isLoading"
          :show-voice="showVoice"
          :voice-enabled="voiceEnabled"
          :show-file-upload="showFileUpload"
          :session-id="currentSessionId"
          @send="handleSend"
        />

        <!-- Branding -->
        <div v-if="showBranding" class="liya-ai-chat-vuejs-widget__branding">
          Powered by <a href="https://liyalabs.com" target="_blank" rel="noopener">Liya AI</a>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.liya-ai-chat-vuejs-widget {
  position: fixed;
  z-index: var(--liya-ai-chat-vuejs-z-index, 9999);
  font-family: var(--liya-ai-chat-vuejs-font-family);
  pointer-events: auto;
}

.liya-ai-chat-vuejs-widget--bottom-right {
  bottom: var(--liya-ai-chat-vuejs-offset-y, 20px);
  right: var(--liya-ai-chat-vuejs-offset-x, 20px);
}

.liya-ai-chat-vuejs-widget--bottom-left {
  bottom: var(--liya-ai-chat-vuejs-offset-y, 20px);
  left: var(--liya-ai-chat-vuejs-offset-x, 20px);
}

.liya-ai-chat-vuejs-widget--top-right {
  top: var(--liya-ai-chat-vuejs-offset-y, 20px);
  right: var(--liya-ai-chat-vuejs-offset-x, 20px);
}

.liya-ai-chat-vuejs-widget--top-left {
  top: var(--liya-ai-chat-vuejs-offset-y, 20px);
  left: var(--liya-ai-chat-vuejs-offset-x, 20px);
}

.liya-ai-chat-vuejs-widget__toggle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 4px 16px rgba(99, 102, 241, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.liya-ai-chat-vuejs-widget__toggle::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: conic-gradient(from 0deg, transparent, rgba(99, 102, 241, 0.5), transparent 30%);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
  animation: liya-ai-chat-vuejs-widget-rotate 3s linear infinite;
}

.liya-ai-chat-vuejs-widget__toggle:hover::before {
  opacity: 1;
}

.liya-ai-chat-vuejs-widget__toggle:hover {
  transform: scale(1.05);
  box-shadow: 
    0 6px 24px rgba(99, 102, 241, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset;
}

@keyframes liya-ai-chat-vuejs-widget-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.liya-ai-chat-vuejs-widget__toggle--open {
  background: rgba(148, 163, 184, 0.8);
}

.liya-ai-chat-vuejs-widget__panel {
  position: absolute;
  width: 380px;
  height: 550px;
  max-height: calc(100vh - 100px);
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.liya-ai-chat-vuejs-widget--bottom-right .liya-ai-chat-vuejs-widget__panel,
.liya-ai-chat-vuejs-widget--bottom-left .liya-ai-chat-vuejs-widget__panel {
  bottom: 70px;
}

.liya-ai-chat-vuejs-widget--top-right .liya-ai-chat-vuejs-widget__panel,
.liya-ai-chat-vuejs-widget--top-left .liya-ai-chat-vuejs-widget__panel {
  top: 70px;
}

.liya-ai-chat-vuejs-widget--bottom-right .liya-ai-chat-vuejs-widget__panel,
.liya-ai-chat-vuejs-widget--top-right .liya-ai-chat-vuejs-widget__panel {
  right: 0;
}

.liya-ai-chat-vuejs-widget--bottom-left .liya-ai-chat-vuejs-widget__panel,
.liya-ai-chat-vuejs-widget--top-left .liya-ai-chat-vuejs-widget__panel {
  left: 0;
}

.liya-ai-chat-vuejs-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.85), rgba(79, 70, 229, 0.65));
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  overflow: hidden;
}

.liya-ai-chat-vuejs-widget__header::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  pointer-events: none;
}

.liya-ai-chat-vuejs-widget__header-info {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.liya-ai-chat-vuejs-widget__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.liya-ai-chat-vuejs-widget__header-text {
  display: flex;
  flex-direction: column;
}

.liya-ai-chat-vuejs-widget__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.liya-ai-chat-vuejs-widget__status {
  font-size: 12px;
  opacity: 0.9;
}

.liya-ai-chat-vuejs-widget__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.liya-ai-chat-vuejs-widget__lang-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  transition: all 0.2s;
}

.liya-ai-chat-vuejs-widget__lang-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.25);
}

.liya-ai-chat-vuejs-widget__lang-text {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.liya-ai-chat-vuejs-widget__close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: all 0.2s;
  position: relative;
  z-index: 1;
}

.liya-ai-chat-vuejs-widget__close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.2);
}

.liya-ai-chat-vuejs-widget__branding {
  padding: 10px;
  text-align: center;
  font-size: 11px;
  color: rgba(148, 163, 184, 0.8);
  background: rgba(15, 23, 42, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.liya-ai-chat-vuejs-widget__branding a {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
}

.liya-ai-chat-vuejs-widget__branding a:hover {
  text-decoration: underline;
  color: #818cf8;
}

/* Transitions */
.liya-ai-chat-vuejs-slide-enter-active,
.liya-ai-chat-vuejs-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.liya-ai-chat-vuejs-slide-enter-from,
.liya-ai-chat-vuejs-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* Mobile responsive */
@media (max-width: 480px) {
  .liya-ai-chat-vuejs-widget__panel {
    width: calc(100vw - 40px);
    height: calc(100vh - 100px);
    max-height: none;
    border-radius: 16px;
  }
  
  .liya-ai-chat-vuejs-widget--bottom-right,
  .liya-ai-chat-vuejs-widget--bottom-left {
    bottom: 10px;
    right: 10px;
    left: 10px;
  }
  
  .liya-ai-chat-vuejs-widget--bottom-right .liya-ai-chat-vuejs-widget__panel,
  .liya-ai-chat-vuejs-widget--bottom-left .liya-ai-chat-vuejs-widget__panel {
    right: 0;
    left: 0;
  }
}

/* Browser Not Supported Card */
.liya-ai-chat-vuejs-unsupported {
  position: fixed;
  bottom: var(--liya-ai-chat-vuejs-offset-y, 20px);
  right: var(--liya-ai-chat-vuejs-offset-x, 20px);
  z-index: var(--liya-ai-chat-vuejs-z-index, 9999);
  font-family: var(--liya-ai-chat-vuejs-font-family);
}

.liya-ai-chat-vuejs-unsupported__card {
  width: 320px;
  padding: 24px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  text-align: center;
}

.liya-ai-chat-vuejs-unsupported__icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
}

.liya-ai-chat-vuejs-unsupported__title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.liya-ai-chat-vuejs-unsupported__message {
  margin: 0 0 12px 0;
  font-size: 13px;
  line-height: 1.5;
  color: #94a3b8;
}

.liya-ai-chat-vuejs-unsupported__browsers {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

/* Mic Permission Banner */
.liya-ai-chat-vuejs-mic-permission {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
  border-bottom: 1px solid rgba(99, 102, 241, 0.2);
}

.liya-ai-chat-vuejs-mic-permission__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a5b4fc;
  flex-shrink: 0;
}

.liya-ai-chat-vuejs-mic-permission__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.liya-ai-chat-vuejs-mic-permission__title {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
}

.liya-ai-chat-vuejs-mic-permission__desc {
  font-size: 11px;
  color: #94a3b8;
}

.liya-ai-chat-vuejs-mic-permission__btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.liya-ai-chat-vuejs-mic-permission__btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}
</style>
