<script setup lang="ts">
import { computed } from 'vue'
import type { Message, ParsedResponse } from '../../types'

interface Props {
  message: Message
  showAvatar?: boolean
  assistantName?: string
}

const props = withDefaults(defineProps<Props>(), {
  showAvatar: true,
  assistantName: 'Assistant',
})

const emit = defineEmits<{
  (e: 'suggestion-click', suggestion: string): void
  (e: 'suggestion-edit', suggestion: string): void
}>()

const isUser = props.message.role === 'user'

// Fields to exclude from preview
const excludedPreviewFields = ['metadata', 'source', 'sources', 'raw_response', 'id', 'created_at', 'updated_at', 'session_id', 'message_id']

// Check if content is JSON
function isJsonContent(content: string): boolean {
  const trimmed = content.trim()
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed)
      return true
    } catch {
      return false
    }
  }
  return false
}

// Parse JSON content
function parseJsonContent(content: string): any {
  try {
    return JSON.parse(content.trim())
  } catch {
    return null
  }
}

// Check if value is an array of objects (table data)
function isTableData(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null
}

// Get object keys for table headers
function getTableHeaders(arr: any[]): string[] {
  if (!arr.length) return []
  return Object.keys(arr[0])
}

// Format cell value
function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toLocaleString('tr-TR')
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır'
  return String(value)
}

// Filter object to remove excluded fields
function filterPreviewData(data: Record<string, any>): Record<string, any> {
  const filtered: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    if (!excludedPreviewFields.includes(key.toLowerCase())) {
      filtered[key] = value
    }
  }
  return filtered
}

// Get plain text from item (for suggestions)
function getItemText(item: any): string {
  if (typeof item === 'object') return JSON.stringify(item)
  return String(item)
}

// Parse JSON response if available
const parsedResponse = computed<ParsedResponse | null>(() => {
  if (isUser) return null
  
  const content = props.message.raw_response || props.message.content
  if (!content) return null
  
  try {
    let jsonStr = content.trim()
    
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }
    
    const parsed = JSON.parse(jsonStr)
    
    if (parsed && typeof parsed.response === 'string') {
      return parsed as ParsedResponse
    }
    return null
  } catch {
    return null
  }
})

// Check if message has JSON content for preview
const hasJsonContent = computed(() => {
  if (isUser) return false
  // If message has parsedResponse format (response + suggestions), don't show JSON preview
  if (parsedResponse.value) return false
  return isJsonContent(props.message.content)
})

// Get parsed JSON data
const jsonData = computed(() => {
  if (!hasJsonContent.value) return null
  return parseJsonContent(props.message.content)
})

// Simple markdown to HTML converter
function parseMarkdown(text: string): string {
  if (!text) return ''
  
  let html = text
  
  // Escape HTML first
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  
  // Code blocks (```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
  
  // Inline code (`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // Bold text that starts a new section/paragraph (**Title** — or **Title**: at start of line or after period)
  // Convert "**text**" at the beginning of a sentence to a new paragraph with bold
  html = html.replace(/(?:^|[.!?]\s+)(\*\*[^*]+\*\*)/gm, '</p><p><strong class="liya-ai-chat-vuejs-section-title">$1</strong>')
  
  // Bold (**text** or __text__)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  
  // Clean up nested strong tags from section title conversion
  html = html.replace(/<strong class="liya-ai-chat-vuejs-section-title"><strong>([^<]+)<\/strong><\/strong>/g, '<strong class="liya-ai-chat-vuejs-section-title">$1</strong>')
  
  // Italic (*text* or _text_)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>')
  
  // Strikethrough (~~text~~)
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  
  // Headers (# ## ### etc)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  
  // Unordered lists (- or *)
  html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
  
  // Ordered lists (1. 2. etc)
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  
  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  
  // Em dash (—) as section separator - create new paragraph
  html = html.replace(/\s*—\s*/g, '</p><p>')
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>')
  html = html.replace(/\n/g, '<br>')
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/^<\/p>/, '')
  
  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>'
  }
  
  // Ensure proper paragraph wrapping
  if (!html.endsWith('</p>') && !html.endsWith('</pre>') && !html.endsWith('</ul>')) {
    html = html + '</p>'
  }
  
  return html
}

// Get display content - either parsed response text or original content
const displayContent = computed(() => {
  let content = ''
  if (parsedResponse.value) {
    content = parsedResponse.value.response
  } else {
    content = props.message.content || ''
  }
  
  // Parse markdown for assistant messages
  if (!isUser && content) {
    return parseMarkdown(content)
  }
  
  return content
})

// Get suggestions from parsed response - convert to strings
const suggestions = computed(() => {
  const rawSuggestions = parsedResponse.value?.suggestions || []
  return rawSuggestions.map((s: any) => typeof s === 'object' ? JSON.stringify(s) : String(s))
})

function handleSuggestionClick(suggestion: string): void {
  emit('suggestion-click', suggestion)
}

function handleSuggestionEdit(suggestion: string): void {
  emit('suggestion-edit', suggestion)
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div 
    class="liya-ai-chat-vuejs-message" 
    :class="{ 'liya-ai-chat-vuejs-message--user': isUser, 'liya-ai-chat-vuejs-message--assistant': !isUser }"
  >
    <div v-if="showAvatar && !isUser" class="liya-ai-chat-vuejs-message__avatar">
      <div class="liya-ai-chat-vuejs-avatar liya-ai-chat-vuejs-avatar--assistant">
        <svg viewBox="0 0 80 92" fill="none" width="24" height="24">
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
    </div>
    
    <div class="liya-ai-chat-vuejs-message__content">
      <div class="liya-ai-chat-vuejs-message__bubble">
        <!-- JSON Preview for assistant messages -->
        <div v-if="hasJsonContent && jsonData" class="liya-ai-chat-vuejs-json-preview">
          <!-- Array of objects - render as table -->
          <template v-if="Array.isArray(jsonData)">
            <div v-if="isTableData(jsonData)" class="liya-ai-chat-vuejs-table-container">
              <table class="liya-ai-chat-vuejs-table">
                <thead>
                  <tr>
                    <th v-for="header in getTableHeaders(jsonData)" :key="header">
                      {{ header }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in jsonData" :key="idx">
                    <td v-for="header in getTableHeaders(jsonData)" :key="header">
                      {{ formatCellValue(row[header]) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Simple array as clickable suggestions -->
            <div v-else class="liya-ai-chat-vuejs-suggestions-grid">
              <div v-for="(item, idx) in jsonData" :key="idx" class="liya-ai-chat-vuejs-suggestion-item">
                <button class="liya-ai-chat-vuejs-suggestion-btn" @click="handleSuggestionClick(getItemText(item))">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                    <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
                  </svg>
                  <span>{{ getItemText(item) }}</span>
                </button>
                <button class="liya-ai-chat-vuejs-edit-btn" @click="handleSuggestionEdit(getItemText(item))">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
              </div>
            </div>
          </template>
          
          <!-- Object - render as key-value cards -->
          <template v-else-if="typeof jsonData === 'object' && jsonData !== null">
            <div class="liya-ai-chat-vuejs-cards-container">
              <template v-for="(value, key) in filterPreviewData(jsonData)" :key="key">
                <!-- Nested array (table data) -->
                <div v-if="isTableData(value)" class="liya-ai-chat-vuejs-card">
                  <div class="liya-ai-chat-vuejs-card__header">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                      <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4-8h6v2h-6V7zm0 4h6v2h-6v-2zm0 4h6v2h-6v-2z"/>
                    </svg>
                    <span>{{ key }}</span>
                  </div>
                  <div class="liya-ai-chat-vuejs-table-container">
                    <table class="liya-ai-chat-vuejs-table">
                      <thead>
                        <tr>
                          <th v-for="header in getTableHeaders(value)" :key="header">
                            {{ header }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(row, idx) in value" :key="idx">
                          <td v-for="header in getTableHeaders(value)" :key="header">
                            {{ formatCellValue(row[header]) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <!-- Simple array as clickable suggestions -->
                <div v-else-if="Array.isArray(value)" class="liya-ai-chat-vuejs-card">
                  <div class="liya-ai-chat-vuejs-suggestions-grid">
                    <div v-for="(item, idx) in value" :key="idx" class="liya-ai-chat-vuejs-suggestion-item">
                      <button class="liya-ai-chat-vuejs-suggestion-btn" @click="handleSuggestionClick(getItemText(item))">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                          <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
                        </svg>
                        <span>{{ getItemText(item) }}</span>
                      </button>
                      <button class="liya-ai-chat-vuejs-edit-btn" @click="handleSuggestionEdit(getItemText(item))">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Nested object -->
                <div v-else-if="typeof value === 'object' && value !== null" class="liya-ai-chat-vuejs-card">
                  <div class="liya-ai-chat-vuejs-card__header">{{ key }}</div>
                  <div class="liya-ai-chat-vuejs-card__grid">
                    <div v-for="(subVal, subKey) in value" :key="subKey" class="liya-ai-chat-vuejs-card__item">
                      <div class="liya-ai-chat-vuejs-card__label">{{ subKey }}</div>
                      <div class="liya-ai-chat-vuejs-card__value">{{ formatCellValue(subVal) }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- Simple key-value -->
                <div v-else class="liya-ai-chat-vuejs-card liya-ai-chat-vuejs-card--simple">
                  <div class="liya-ai-chat-vuejs-card__text">{{ formatCellValue(value) }}</div>
                </div>
              </template>
            </div>
          </template>
        </div>
        
        <!-- Regular text content -->
        <div v-else class="liya-ai-chat-vuejs-message__text" v-html="displayContent"></div>
      </div>
      
      <!-- Suggestions from parsed response -->
      <div v-if="suggestions.length > 0" class="liya-ai-chat-vuejs-message__suggestions">
        <button
          v-for="(suggestion, index) in suggestions"
          :key="index"
          class="liya-ai-chat-vuejs-suggestion"
          @click="handleSuggestionClick(suggestion)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
          </svg>
          {{ suggestion }}
        </button>
      </div>
      
      <div class="liya-ai-chat-vuejs-message__meta">
        <span class="liya-ai-chat-vuejs-message__time">{{ formatTime(message.created_at) }}</span>
        <span v-if="message.response_time" class="liya-ai-chat-vuejs-message__response-time">
          {{ message.response_time.toFixed(1) }}s
        </span>
      </div>
    </div>
    
    <div v-if="showAvatar && isUser" class="liya-ai-chat-vuejs-message__avatar">
      <div class="liya-ai-chat-vuejs-avatar liya-ai-chat-vuejs-avatar--user">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.liya-ai-chat-vuejs-message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  max-width: 85%;
}

.liya-ai-chat-vuejs-message--user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.liya-ai-chat-vuejs-message--assistant {
  margin-right: auto;
}

.liya-ai-chat-vuejs-message__avatar {
  flex-shrink: 0;
}

.liya-ai-chat-vuejs-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.liya-ai-chat-vuejs-avatar--assistant {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.liya-ai-chat-vuejs-avatar--user {
  background: var(--liya-ai-chat-vuejs-glass-bg-tertiary, rgba(51, 65, 85, 0.4));
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.liya-ai-chat-vuejs-message__content {
  flex: 1;
  min-width: 0;
}

.liya-ai-chat-vuejs-message__bubble {
  padding: 12px 16px;
  border-radius: var(--liya-ai-chat-vuejs-radius-lg, 16px);
  word-wrap: break-word;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.liya-ai-chat-vuejs-message--user .liya-ai-chat-vuejs-message__bubble {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(79, 70, 229, 0.75) 100%);
  color: white;
  border-bottom-right-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 4px 16px rgba(99, 102, 241, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.liya-ai-chat-vuejs-message--assistant .liya-ai-chat-vuejs-message__bubble {
  background: var(--liya-ai-chat-vuejs-glass-bg-secondary, rgba(30, 41, 59, 0.5));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--liya-ai-chat-vuejs-glass-border, rgba(255, 255, 255, 0.08));
}

.liya-ai-chat-vuejs-message__text {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.liya-ai-chat-vuejs-message__text :deep(p) {
  margin: 0 0 8px 0;
}

.liya-ai-chat-vuejs-message__text :deep(p:last-child) {
  margin-bottom: 0;
}

.liya-ai-chat-vuejs-message__text :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
}

.liya-ai-chat-vuejs-message__text :deep(pre) {
  background: rgba(15, 23, 42, 0.6);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.liya-ai-chat-vuejs-message__text :deep(pre code) {
  background: none;
  padding: 0;
  color: #e2e8f0;
}

.liya-ai-chat-vuejs-message__meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 11px;
  color: var(--liya-ai-chat-vuejs-text-muted, #64748b);
}

.liya-ai-chat-vuejs-message--user .liya-ai-chat-vuejs-message__meta {
  justify-content: flex-end;
}

.liya-ai-chat-vuejs-message__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.liya-ai-chat-vuejs-suggestion {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 13px;
  font-family: inherit;
  color: rgba(165, 180, 252, 0.9);
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.liya-ai-chat-vuejs-suggestion:hover {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.5);
  color: #a5b4fc;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.2);
}

.liya-ai-chat-vuejs-suggestion svg {
  flex-shrink: 0;
}

/* JSON Preview Styles */
.liya-ai-chat-vuejs-json-preview {
  width: 100%;
}

.liya-ai-chat-vuejs-table-container {
  overflow-x: auto;
  border-radius: 12px;
  background: var(--liya-ai-chat-vuejs-glass-bg-tertiary, rgba(51, 65, 85, 0.4));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--liya-ai-chat-vuejs-glass-border, rgba(255, 255, 255, 0.08));
}

.liya-ai-chat-vuejs-table {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}

.liya-ai-chat-vuejs-table thead {
  background: rgba(99, 102, 241, 0.15);
}

.liya-ai-chat-vuejs-table th {
  padding: 10px 12px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--liya-ai-chat-vuejs-text-secondary, #94a3b8);
}

.liya-ai-chat-vuejs-table td {
  padding: 10px 12px;
  border-top: 1px solid var(--liya-ai-chat-vuejs-glass-border, rgba(255, 255, 255, 0.08));
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
}

.liya-ai-chat-vuejs-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.liya-ai-chat-vuejs-cards-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.liya-ai-chat-vuejs-card {
  border-radius: 12px;
  background: var(--liya-ai-chat-vuejs-glass-bg-tertiary, rgba(51, 65, 85, 0.4));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--liya-ai-chat-vuejs-glass-border, rgba(255, 255, 255, 0.08));
  overflow: hidden;
}

.liya-ai-chat-vuejs-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(99, 102, 241, 0.15);
  border-bottom: 1px solid var(--liya-ai-chat-vuejs-glass-border, rgba(255, 255, 255, 0.08));
  font-size: 13px;
  font-weight: 600;
  color: rgba(165, 180, 252, 0.9);
}

.liya-ai-chat-vuejs-card__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  padding: 12px;
}

.liya-ai-chat-vuejs-card__item {
  padding: 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
}

.liya-ai-chat-vuejs-card__label {
  font-size: 11px;
  color: var(--liya-ai-chat-vuejs-text-muted, #64748b);
  margin-bottom: 4px;
}

.liya-ai-chat-vuejs-card__value {
  font-size: 13px;
  font-weight: 500;
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
}

.liya-ai-chat-vuejs-card--simple {
  padding: 12px;
}

.liya-ai-chat-vuejs-card__text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
}

.liya-ai-chat-vuejs-suggestions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
}

.liya-ai-chat-vuejs-suggestion-item {
  display: flex;
  align-items: center;
  border-radius: 20px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  overflow: hidden;
  transition: all 0.2s ease;
}

.liya-ai-chat-vuejs-suggestion-item:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.5);
}

.liya-ai-chat-vuejs-suggestion-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 12px;
  font-family: inherit;
  font-weight: 500;
  color: rgba(165, 180, 252, 0.9);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.liya-ai-chat-vuejs-suggestion-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #a5b4fc;
}

.liya-ai-chat-vuejs-suggestion-btn span {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.liya-ai-chat-vuejs-edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  color: rgba(99, 102, 241, 0.6);
  background: transparent;
  border: none;
  border-left: 1px solid rgba(99, 102, 241, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.liya-ai-chat-vuejs-edit-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  color: rgba(165, 180, 252, 0.9);
}
</style>
