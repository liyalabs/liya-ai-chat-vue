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
import { ref } from 'vue'
import type { Session } from '../../types'
import { useI18n } from '../../i18n/useI18n'

const { t, locale, setLocale } = useI18n()

// Toggle language between TR and EN
function toggleLocale(): void {
  const newLocale = locale.value === 'tr' ? 'en' : 'tr'
  setLocale(newLocale)
}

interface Props {
  sessions: readonly Session[]
  currentSessionId?: string | null
  isLoading?: boolean
  assistantName?: string
}

withDefaults(defineProps<Props>(), {
  currentSessionId: null,
  isLoading: false,
  assistantName: 'Assistant',
})

const emit = defineEmits<{
  selectSession: [session: Session]
  createSession: []
  deleteSession: [sessionId: string]
}>()

// Delete confirmation modal state
const showDeleteModal = ref(false)
const sessionToDelete = ref<Session | null>(null)

function openDeleteModal(session: Session) {
  sessionToDelete.value = session
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  sessionToDelete.value = null
}

function confirmDelete() {
  if (sessionToDelete.value) {
    emit('deleteSession', sessionToDelete.value.id)
    closeDeleteModal()
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return 'Dün'
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  } else {
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<template>
  <div class="liya-ai-chat-vuejs-sidebar">
    <!-- Header -->
    <div class="liya-ai-chat-vuejs-sidebar__header">
      <div class="liya-ai-chat-vuejs-sidebar__logo">
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
        <span>{{ assistantName }}</span>
      </div>
      <div class="liya-ai-chat-vuejs-sidebar__header-actions">
        <!-- Language Toggle Button -->
        <button 
          class="liya-ai-chat-vuejs-sidebar__lang-btn"
          @click="toggleLocale"
          :title="locale === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'"
        >
          <span class="liya-ai-chat-vuejs-sidebar__lang-text">{{ locale === 'tr' ? 'EN' : 'TR' }}</span>
        </button>
        <button 
          class="liya-ai-chat-vuejs-sidebar__new-btn"
          @click="emit('createSession')"
          :title="t.app.newChat"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Session List -->
    <div class="liya-ai-chat-vuejs-sidebar__list">
      <div v-if="isLoading" class="liya-ai-chat-vuejs-sidebar__loading">
        <div class="liya-ai-chat-vuejs-sidebar__spinner"></div>
        <span>{{ t.app.loading }}</span>
      </div>

      <div v-else-if="sessions.length === 0" class="liya-ai-chat-vuejs-sidebar__empty">
        <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
        <p>{{ t.app.noChats }}</p>
        <button class="liya-ai-chat-vuejs-sidebar__start-btn" @click="emit('createSession')">
          {{ t.app.startNewChat }}
        </button>
      </div>

      <div
        v-for="session in sessions"
        :key="session.id"
        class="liya-ai-chat-vuejs-sidebar__item"
        :class="{ 'liya-ai-chat-vuejs-sidebar__item--active': session.id === currentSessionId }"
        @click="emit('selectSession', session)"
      >
        <div class="liya-ai-chat-vuejs-sidebar__item-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        </div>
        <div class="liya-ai-chat-vuejs-sidebar__item-content">
          <div class="liya-ai-chat-vuejs-sidebar__item-title">
            {{ truncateText(session.session_name, 28) }}
          </div>
          <div class="liya-ai-chat-vuejs-sidebar__item-meta">
            <span>{{ session.message_count }} {{ t.app.messages }}</span>
            <span>{{ formatDate(session.last_message_at || session.created_at) }}</span>
          </div>
        </div>
        <button 
          class="liya-ai-chat-vuejs-sidebar__item-delete"
          @click.stop="openDeleteModal(session)"
          :title="t.app.deleteChat"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition name="liya-ai-chat-vuejs-modal">
        <div v-if="showDeleteModal" class="liya-ai-chat-vuejs-delete-modal-overlay" @click.self="closeDeleteModal">
          <div class="liya-ai-chat-vuejs-delete-modal">
            <div class="liya-ai-chat-vuejs-delete-modal__icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </div>
            <h3 class="liya-ai-chat-vuejs-delete-modal__title">{{ t.app.deleteConfirmTitle }}</h3>
            <p class="liya-ai-chat-vuejs-delete-modal__message">
              <strong>"{{ sessionToDelete?.session_name }}"</strong> {{ t.app.deleteConfirmMessage }}
            </p>
            <div class="liya-ai-chat-vuejs-delete-modal__actions">
              <button class="liya-ai-chat-vuejs-delete-modal__btn liya-ai-chat-vuejs-delete-modal__btn--cancel" @click="closeDeleteModal">
                {{ t.app.cancel }}
              </button>
              <button class="liya-ai-chat-vuejs-delete-modal__btn liya-ai-chat-vuejs-delete-modal__btn--delete" @click="confirmDelete">
                {{ t.app.delete }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.liya-ai-chat-vuejs-sidebar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--liya-ai-chat-vuejs-glass-bg-primary, rgba(15, 23, 42, 0.6));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-right: 1px solid var(--liya-ai-chat-vuejs-glass-border, rgba(255, 255, 255, 0.08));
}

.liya-ai-chat-vuejs-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.1) 100%);
  border-bottom: 1px solid var(--liya-ai-chat-vuejs-glass-border, rgba(255, 255, 255, 0.08));
}

.liya-ai-chat-vuejs-sidebar__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 16px;
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
}

.liya-ai-chat-vuejs-sidebar__logo svg {
  color: var(--liya-ai-chat-vuejs-primary-color, #6366f1);
  filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.5));
}

.liya-ai-chat-vuejs-sidebar__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.liya-ai-chat-vuejs-sidebar__lang-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.liya-ai-chat-vuejs-sidebar__lang-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.liya-ai-chat-vuejs-sidebar__lang-text {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.liya-ai-chat-vuejs-sidebar__new-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.liya-ai-chat-vuejs-sidebar__new-btn:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 1) 0%, rgba(79, 70, 229, 1) 100%);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
  transform: scale(1.05);
}

.liya-ai-chat-vuejs-sidebar__list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.liya-ai-chat-vuejs-sidebar__list::-webkit-scrollbar {
  width: 6px;
}

.liya-ai-chat-vuejs-sidebar__list::-webkit-scrollbar-track {
  background: transparent;
}

.liya-ai-chat-vuejs-sidebar__list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.liya-ai-chat-vuejs-sidebar__list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.liya-ai-chat-vuejs-sidebar__loading,
.liya-ai-chat-vuejs-sidebar__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--liya-ai-chat-vuejs-text-secondary, #94a3b8);
  text-align: center;
}

.liya-ai-chat-vuejs-sidebar__spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--liya-ai-chat-vuejs-primary-color, #6366f1);
  border-radius: 50%;
  animation: liya-ai-chat-vuejs-spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes liya-ai-chat-vuejs-spin {
  to { transform: rotate(360deg); }
}

.liya-ai-chat-vuejs-sidebar__empty svg {
  opacity: 0.4;
  margin-bottom: 12px;
  color: var(--liya-ai-chat-vuejs-primary-color, #6366f1);
}

.liya-ai-chat-vuejs-sidebar__empty p {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: var(--liya-ai-chat-vuejs-text-secondary, #94a3b8);
}

.liya-ai-chat-vuejs-sidebar__start-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.liya-ai-chat-vuejs-sidebar__start-btn:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 1) 0%, rgba(79, 70, 229, 1) 100%);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
  transform: scale(1.02);
}

.liya-ai-chat-vuejs-sidebar__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: transparent;
  border: 1px solid transparent;
}

.liya-ai-chat-vuejs-sidebar__item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.liya-ai-chat-vuejs-sidebar__item--active {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.1);
}

.liya-ai-chat-vuejs-sidebar__item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%);
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);
}

.liya-ai-chat-vuejs-sidebar__item-icon {
  flex-shrink: 0;
  color: var(--liya-ai-chat-vuejs-text-muted, #64748b);
  transition: color 0.2s ease;
}

.liya-ai-chat-vuejs-sidebar__item:hover .liya-ai-chat-vuejs-sidebar__item-icon,
.liya-ai-chat-vuejs-sidebar__item--active .liya-ai-chat-vuejs-sidebar__item-icon {
  color: var(--liya-ai-chat-vuejs-primary-color, #6366f1);
}

.liya-ai-chat-vuejs-sidebar__item-content {
  flex: 1;
  min-width: 0;
}

.liya-ai-chat-vuejs-sidebar__item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.liya-ai-chat-vuejs-sidebar__item-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--liya-ai-chat-vuejs-text-muted, #64748b);
  margin-top: 2px;
}

.liya-ai-chat-vuejs-sidebar__item-delete {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--liya-ai-chat-vuejs-text-muted, #64748b);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
}

.liya-ai-chat-vuejs-sidebar__item:hover .liya-ai-chat-vuejs-sidebar__item-delete {
  opacity: 1;
}

.liya-ai-chat-vuejs-sidebar__item-delete:hover {
  background: rgba(220, 38, 38, 0.2);
  color: #fca5a5;
}
</style>

<!-- Global styles for Teleported modal -->
<style>
.liya-ai-chat-vuejs-delete-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 20px;
}

.liya-ai-chat-vuejs-delete-modal {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.5),
    0 0 60px rgba(220, 38, 38, 0.1);
}

.liya-ai-chat-vuejs-delete-modal__icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(220, 38, 38, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #f87171;
}

.liya-ai-chat-vuejs-delete-modal__title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
}

.liya-ai-chat-vuejs-delete-modal__message {
  margin: 0 0 24px;
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.5;
}

.liya-ai-chat-vuejs-delete-modal__message strong {
  color: #f1f5f9;
}

.liya-ai-chat-vuejs-delete-modal__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.liya-ai-chat-vuejs-delete-modal__btn {
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.liya-ai-chat-vuejs-delete-modal__btn--cancel {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
  color: #94a3b8;
}

.liya-ai-chat-vuejs-delete-modal__btn--cancel:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #f1f5f9;
}

.liya-ai-chat-vuejs-delete-modal__btn--delete {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.liya-ai-chat-vuejs-delete-modal__btn--delete:hover {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
  transform: translateY(-1px);
}

/* Modal Transition */
.liya-ai-chat-vuejs-modal-enter-active,
.liya-ai-chat-vuejs-modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.liya-ai-chat-vuejs-modal-enter-from,
.liya-ai-chat-vuejs-modal-leave-to {
  opacity: 0;
}

.liya-ai-chat-vuejs-modal-enter-from .liya-ai-chat-vuejs-delete-modal,
.liya-ai-chat-vuejs-modal-leave-to .liya-ai-chat-vuejs-delete-modal {
  transform: scale(0.9) translateY(10px);
  opacity: 0;
}
</style>
