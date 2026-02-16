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
// Liya AI Chat - Main Entry Point
// Vue.js Chat Widget & Full App Component for AI Assistants

// Styles
import './styles/variables.css'
import './styles/liquid-glass.css'

// Plugin
export { LiyaChatPlugin, default } from './plugin'
export type { LiyaChatPluginOptions } from './plugin'

// Components
export { LiyaChatWidget } from './components/widget'
export { LiyaChatApp, SessionSidebar } from './components/app'
export { MessageBubble, MessageList, ChatInput } from './components/shared'

// Composables
export { useChat } from './composables/useChat'
export { useSessions } from './composables/useSessions'
export { useVoice } from './composables/useVoice'
export { useFileUpload } from './composables/useFileUpload'
export { useI18n } from './i18n'

// API
export {
  initializeClient,
  getClient,
  getConfig,
  isInitialized,
  sendMessage,
  getSessionHistory,
  getSessions,
  createSession,
  getSession,
  deleteSession,
  uploadFile,
  getAssistants,
  getAssistant,
} from './api'

// Types
export type {
  ChatMode,
  LiyaChatConfig,
  ThemeConfig,
  FeaturesConfig,
  ApiResponse,
  Assistant,
  Session,
  SessionListResponse,
  CreateSessionRequest,
  Message,
  MessageRole,
  SendMessageRequest,
  SendMessageResponse,
  SessionHistoryResponse,
  FileAttachment,
  UploadFileRequest,
  ChatWidgetProps,
  ChatAppProps,
  MessageBubbleProps,
  ChatInputProps,
  ChatState,
  SessionState,
  ChatEvents,
} from './types'

// i18n Types
export type { SupportedLocale, Translations } from './i18n'
