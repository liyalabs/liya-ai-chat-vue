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
import type { ThemeConfig, Session } from '../../types'
import { useChat } from '../../composables/useChat'
import { useSessions } from '../../composables/useSessions'
import { useFileUpload } from '../../composables/useFileUpload'
import { useI18n } from '../../i18n/useI18n'
import { getConfig } from '../../api'
import SessionSidebar from './SessionSidebar.vue'
import MessageList from '../shared/MessageList.vue'
import ChatInput from '../shared/ChatInput.vue'

const { t } = useI18n()

interface Props {
  theme?: ThemeConfig
  showSidebar?: boolean
  sidebarWidth?: string
  welcomeMessage?: string
  placeholder?: string
  showVoice?: boolean
  voiceEnabled?: boolean  // false for STANDARD users - shows disabled mic icon
  showFileUpload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSidebar: true,
  sidebarWidth: '300px',
  welcomeMessage: 'Merhaba! Size nasıl yardımcı olabilirim?',
  placeholder: 'Mesajınızı yazın...',
  showVoice: true,
  voiceEnabled: true,
  showFileUpload: true,
})

const emit = defineEmits<{
  sessionCreated: [session: Session]
  sessionSelected: [session: Session]
  sessionDeleted: [sessionId: string]
  messageSent: [message: string]
  messageReceived: [message: string]
}>()

const config = getConfig()
const isMobileSidebarOpen = ref(false)
const isSidebarCollapsed = ref(false)

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const {
  messages,
  isLoading: isChatLoading,
  currentSessionId,
  sendMessage,
  loadHistory,
  clearMessages,
  setSessionId,
} = useChat()

const {
  sessions,
  currentSession,
  isLoading: isSessionsLoading,
  loadSessions,
  createSession,
  deleteSession,
  selectSession,
} = useSessions()

const { uploadFiles, clearAll: clearFiles } = useFileUpload()

const assistantName = computed(() => config.assistantName || 'Assistant')

const cssVars = computed(() => {
  const theme = props.theme || {}
  return {
    '--liya-ai-chat-vuejs-primary-color': theme.primaryColor || '#6366f1',
    '--liya-ai-chat-vuejs-primary-hover': theme.primaryColor ? adjustColor(theme.primaryColor, -10) : '#4f46e5',
    '--liya-ai-chat-vuejs-secondary-color': theme.secondaryColor || '#e5e7eb',
    '--liya-ai-chat-vuejs-bg-color': theme.backgroundColor || '#ffffff',
    '--liya-ai-chat-vuejs-bg-secondary': '#f3f4f6',
    '--liya-ai-chat-vuejs-text-color': theme.textColor || '#374151',
    '--liya-ai-chat-vuejs-text-muted': '#9ca3af',
    '--liya-ai-chat-vuejs-border-color': '#e5e7eb',
    '--liya-ai-chat-vuejs-border-radius': theme.borderRadius || '12px',
    '--liya-ai-chat-vuejs-font-family': theme.fontFamily || 'system-ui, -apple-system, sans-serif',
    '--liya-ai-chat-vuejs-sidebar-width': props.sidebarWidth,
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

async function handleSelectSession(session: Session): Promise<void> {
  selectSession(session)
  setSessionId(session.id)
  await loadHistory(session.id)
  isMobileSidebarOpen.value = false
  emit('sessionSelected', session)
}

async function handleCreateSession(): Promise<void> {
  const session = await createSession()
  if (session) {
    selectSession(session)
    setSessionId(session.id)
    clearMessages()
    isMobileSidebarOpen.value = false
    emit('sessionCreated', session)
  }
}

async function handleDeleteSession(sessionId: string): Promise<void> {
  const success = await deleteSession(sessionId)
  if (success) {
    if (currentSessionId.value === sessionId) {
      clearMessages()
      setSessionId(null)
      selectSession(null)
    }
    emit('sessionDeleted', sessionId)
  }
}

async function handleSend(message: string, fileIds?: string[]): Promise<void> {
  if (!message.trim() && (!fileIds || fileIds.length === 0)) return

  // Create session if none exists
  if (!currentSessionId.value) {
    const session = await createSession(message.substring(0, 30))
    if (session) {
      selectSession(session)
      setSessionId(session.id)
      emit('sessionCreated', session)
    }
  }

  // Upload pending files
  let uploadedIds = fileIds
  if (currentSessionId.value && fileIds && fileIds.length > 0) {
    const uploaded = await uploadFiles(currentSessionId.value)
    uploadedIds = uploaded.map(f => f.id)
  }

  emit('messageSent', message)
  
  const response = await sendMessage(message, uploadedIds)
  
  if (response?.assistant_message?.content || response?.response) {
    emit('messageReceived', response.assistant_message?.content || response.response || '')
  }
  
  clearFiles()
  
  // Refresh sessions list
  loadSessions()
}

function toggleMobileSidebar(): void {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

function handleSuggestionClick(suggestion: string): void {
  handleSend(suggestion)
}

onMounted(async () => {
  await loadSessions()
})
</script>

<template>
  <div class="liya-ai-chat-vuejs-app" :style="cssVars">
    <!-- Mobile Header -->
    <div class="liya-ai-chat-vuejs-app__mobile-header">
      <button class="liya-ai-chat-vuejs-app__menu-btn" @click="toggleMobileSidebar">
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>
      <span class="liya-ai-chat-vuejs-app__mobile-title">
        {{ currentSession?.session_name || assistantName }}
      </span>
      <button class="liya-ai-chat-vuejs-app__new-btn" @click="handleCreateSession">
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    </div>

    <!-- Sidebar Toggle Button (always visible) -->
    <button 
      v-if="showSidebar"
      class="liya-ai-chat-vuejs-app__sidebar-toggle"
      :class="{ 'liya-ai-chat-vuejs-app__sidebar-toggle--collapsed': isSidebarCollapsed }"
      @click="toggleSidebar"
      :title="isSidebarCollapsed ? t.app.openMenu : t.app.closeMenu"
    >
      <svg v-if="isSidebarCollapsed" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
      </svg>
    </button>

    <!-- Sidebar -->
    <aside 
      v-if="showSidebar" 
      class="liya-ai-chat-vuejs-app__sidebar"
      :class="{ 
        'liya-ai-chat-vuejs-app__sidebar--open': isMobileSidebarOpen,
        'liya-ai-chat-vuejs-app__sidebar--collapsed': isSidebarCollapsed
      }"
    >
      <SessionSidebar
        :sessions="sessions"
        :current-session-id="currentSessionId"
        :is-loading="isSessionsLoading"
        :assistant-name="assistantName"
        @select-session="handleSelectSession"
        @create-session="handleCreateSession"
        @delete-session="handleDeleteSession"
      />
    </aside>

    <!-- Overlay for mobile -->
    <div 
      v-if="isMobileSidebarOpen" 
      class="liya-ai-chat-vuejs-app__overlay"
      @click="isMobileSidebarOpen = false"
    ></div>

    <!-- Main Chat Area -->
    <main class="liya-ai-chat-vuejs-app__main">
      <!-- Chat Header -->
      <div class="liya-ai-chat-vuejs-app__header">
        <div class="liya-ai-chat-vuejs-app__header-info">
          <div class="liya-ai-chat-vuejs-app__avatar">
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
          <div class="liya-ai-chat-vuejs-app__header-text">
            <h2 class="liya-ai-chat-vuejs-app__title">
              {{ currentSession?.session_name || assistantName }}
            </h2>
            <span class="liya-ai-chat-vuejs-app__status">
              {{ currentSession ? `${currentSession.message_count} ${t.app.messages}` : t.app.startNewChat }}
            </span>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <MessageList
        :messages="messages"
        :is-loading="isChatLoading"
        :assistant-name="assistantName"
        :welcome-message="welcomeMessage"
        @suggestion-click="handleSuggestionClick"
      />

      <!-- Input -->
      <ChatInput
        :placeholder="placeholder"
        :disabled="isChatLoading"
        :show-voice="showVoice"
        :voice-enabled="voiceEnabled"
        :show-file-upload="showFileUpload"
        :session-id="currentSessionId"
        @send="handleSend"
      />
    </main>
  </div>
</template>

<style scoped>
.liya-ai-chat-vuejs-app {
  display: flex;
  height: 100%;
  width: 100%;
  background: var(--liya-ai-chat-vuejs-glass-bg-primary, rgba(15, 23, 42, 0.95));
  font-family: var(--liya-ai-chat-vuejs-font-family);
  position: relative;
  overflow: hidden;
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
}

.liya-ai-chat-vuejs-app__mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--liya-ai-chat-vuejs-glass-bg-secondary, rgba(30, 41, 59, 0.8));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--liya-ai-chat-vuejs-glass-border, rgba(255, 255, 255, 0.08));
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  z-index: 100;
}

.liya-ai-chat-vuejs-app__menu-btn,
.liya-ai-chat-vuejs-app__new-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.liya-ai-chat-vuejs-app__menu-btn:hover,
.liya-ai-chat-vuejs-app__new-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.liya-ai-chat-vuejs-app__mobile-title {
  font-weight: 600;
  font-size: 16px;
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.liya-ai-chat-vuejs-app__sidebar-toggle {
  position: absolute;
  top: 20px;
  left: calc(var(--liya-ai-chat-vuejs-sidebar-width) - 12px);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--liya-ai-chat-vuejs-glass-bg-secondary, rgba(30, 41, 59, 0.95));
  border: 1px solid var(--liya-ai-chat-vuejs-glass-border, rgba(255, 255, 255, 0.15));
  color: var(--liya-ai-chat-vuejs-text-secondary, #94a3b8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 250;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.liya-ai-chat-vuejs-app__sidebar-toggle:hover {
  background: var(--liya-ai-chat-vuejs-primary-color, #6366f1);
  color: white;
  transform: scale(1.1);
}

.liya-ai-chat-vuejs-app__sidebar-toggle--collapsed {
  left: 12px;
}

.liya-ai-chat-vuejs-app__sidebar {
  width: var(--liya-ai-chat-vuejs-sidebar-width);
  flex-shrink: 0;
  height: 100%;
  background: var(--liya-ai-chat-vuejs-glass-bg-secondary, rgba(30, 41, 59, 0.5));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-right: 1px solid var(--liya-ai-chat-vuejs-glass-border, rgba(255, 255, 255, 0.08));
  position: relative;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.liya-ai-chat-vuejs-app__sidebar--collapsed {
  width: 0;
  border-right: none;
}

.liya-ai-chat-vuejs-app__overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 199;
}

.liya-ai-chat-vuejs-app__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  background: transparent;
}

.liya-ai-chat-vuejs-app__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.1) 100%);
  border-bottom: 1px solid var(--liya-ai-chat-vuejs-glass-border, rgba(255, 255, 255, 0.08));
  position: relative;
  overflow: hidden;
}

.liya-ai-chat-vuejs-app__header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
  opacity: 0.6;
  pointer-events: none;
}

.liya-ai-chat-vuejs-app__header-info {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.liya-ai-chat-vuejs-app__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.liya-ai-chat-vuejs-app__header-text {
  display: flex;
  flex-direction: column;
}

.liya-ai-chat-vuejs-app__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
}

.liya-ai-chat-vuejs-app__status {
  font-size: 13px;
  color: var(--liya-ai-chat-vuejs-text-secondary, #94a3b8);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .liya-ai-chat-vuejs-app__mobile-header {
    display: flex;
  }

  .liya-ai-chat-vuejs-app__sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 300px;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .liya-ai-chat-vuejs-app__sidebar--open {
    transform: translateX(0);
  }

  .liya-ai-chat-vuejs-app__overlay {
    display: block;
  }

  .liya-ai-chat-vuejs-app__main {
    padding-top: 56px;
  }

  .liya-ai-chat-vuejs-app__header {
    display: none;
  }
}
</style>
