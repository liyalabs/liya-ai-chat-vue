// Liya AI Chat - useChat Composable
import { ref, computed, readonly } from 'vue'
import type { Message, SendMessageResponse } from '../types'
import { sendMessage as apiSendMessage, getSessionHistory } from '../api'

const messages = ref<Message[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const currentSessionId = ref<string | null>(null)

export function useChat() {
  const hasMessages = computed(() => messages.value.length > 0)
  const lastMessage = computed(() => messages.value[messages.value.length - 1] || null)

  async function sendMessage(
    content: string,
    fileIds?: string[]
  ): Promise<SendMessageResponse | null> {
    if (!content.trim()) return null

    isLoading.value = true
    error.value = null

    // Optimistic update - add user message immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      content: content.trim(),
      role: 'user',
      created_at: new Date().toISOString(),
    }
    messages.value.push(tempUserMessage)

    try {
      const response = await apiSendMessage(
        content.trim(),
        currentSessionId.value || undefined,
        fileIds
      )

      // Update session ID if new session was created
      if (response.session_id) {
        currentSessionId.value = response.session_id
        // Persist to localStorage
        saveSessionToStorage(response.session_id)
      }

      // Replace temp message with real one if available
      if (response.user_message) {
        const tempIndex = messages.value.findIndex((m) => m.id === tempUserMessage.id)
        if (tempIndex !== -1) {
          messages.value[tempIndex] = response.user_message
        }
      }

      // Add assistant message
      if (response.assistant_message) {
        messages.value.push(response.assistant_message)
      } else if (response.response) {
        // Fallback for simple response format
        messages.value.push({
          id: response.message_id || `msg-${Date.now()}`,
          content: response.response,
          role: 'assistant',
          created_at: new Date().toISOString(),
          response_time: response.response_time,
        })
      }

      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send message'
      // Remove temp message on error
      messages.value = messages.value.filter((m) => m.id !== tempUserMessage.id)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function loadHistory(sessionId: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await getSessionHistory(sessionId)
      messages.value = response.messages
      currentSessionId.value = sessionId
      saveSessionToStorage(sessionId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load history'
    } finally {
      isLoading.value = false
    }
  }

  function clearMessages(): void {
    messages.value = []
    currentSessionId.value = null
    clearSessionFromStorage()
  }

  function setSessionId(sessionId: string | null): void {
    currentSessionId.value = sessionId
    if (sessionId) {
      saveSessionToStorage(sessionId)
    } else {
      clearSessionFromStorage()
    }
  }

  // LocalStorage helpers
  function saveSessionToStorage(sessionId: string): void {
    try {
      localStorage.setItem('liya_chat_session_id', sessionId)
    } catch {
      // localStorage not available
    }
  }

  function clearSessionFromStorage(): void {
    try {
      localStorage.removeItem('liya_chat_session_id')
    } catch {
      // localStorage not available
    }
  }

  function getStoredSessionId(): string | null {
    try {
      return localStorage.getItem('liya_chat_session_id')
    } catch {
      return null
    }
  }

  // Initialize from storage
  function initFromStorage(): void {
    const storedSessionId = getStoredSessionId()
    if (storedSessionId) {
      currentSessionId.value = storedSessionId
    }
  }

  return {
    // State
    messages: readonly(messages),
    isLoading: readonly(isLoading),
    error: readonly(error),
    currentSessionId: readonly(currentSessionId),
    
    // Computed
    hasMessages,
    lastMessage,
    
    // Actions
    sendMessage,
    loadHistory,
    clearMessages,
    setSessionId,
    initFromStorage,
    getStoredSessionId,
  }
}
