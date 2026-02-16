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
import { ref, computed, watch } from 'vue'
import { useVoice } from '../../composables/useVoice'
import { useFileUpload } from '../../composables/useFileUpload'
import { useI18n } from '../../i18n'

interface Props {
  placeholder?: string
  disabled?: boolean
  showVoice?: boolean
  voiceEnabled?: boolean  // false for STANDARD users - shows disabled mic icon
  showFileUpload?: boolean
  maxLength?: number
  sessionId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Mesajınızı yazın...',
  disabled: false,
  showVoice: true,
  voiceEnabled: true,  // Premium users have this enabled
  showFileUpload: true,
  maxLength: 4000,
  sessionId: null,
})

const { t } = useI18n()
const placeholderText = computed(() => props.placeholder || t.value.chat.placeholder)

const emit = defineEmits<{
  send: [message: string, fileIds?: string[]]
}>()

const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const { 
  isRecording, 
  fullTranscript, 
  isSupported: voiceSupported,
  startRecording, 
  stopRecording
} = useVoice()

const {
  pendingFiles,
  uploadedFiles,
  isUploading,
  hasPendingFiles,
  uploadedFileIds,
  addFiles,
  removePendingFile,
  clearAll: clearFiles,
  formatFileSize,
  getFileIcon,
} = useFileUpload()

const canSend = computed(() => {
  return (inputText.value.trim().length > 0 || uploadedFiles.value.length > 0) && 
         !props.disabled && 
         !isUploading.value
})

const characterCount = computed(() => inputText.value.length)

watch(fullTranscript, (newValue) => {
  if (newValue) {
    inputText.value = newValue
  }
})

function handleSend(): void {
  if (!canSend.value) return
  
  const message = inputText.value.trim()
  const fileIds = uploadedFileIds.value.length > 0 ? [...uploadedFileIds.value] : undefined
  
  emit('send', message, fileIds)
  
  inputText.value = ''
  clearFiles()
  adjustTextareaHeight()
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

function adjustTextareaHeight(): void {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 150) + 'px'
  }
}

function handleVoiceClick(): void {
  if (isRecording.value) {
    const transcript = stopRecording()
    if (transcript) {
      inputText.value = transcript
    }
  } else {
    startRecording()
  }
}

function handleFileSelect(event: Event): void {
  const target = event.target as HTMLInputElement
  if (target.files) {
    addFiles(target.files)
    target.value = ''
  }
}

function triggerFileInput(): void {
  fileInputRef.value?.click()
}
</script>

<template>
  <div class="liya-ai-chat-vuejs-chat-input">
    <!-- Pending files -->
    <div v-if="hasPendingFiles" class="liya-ai-chat-vuejs-chat-input__files">
      <div 
        v-for="file in pendingFiles" 
        :key="file.id" 
        class="liya-ai-chat-vuejs-file-chip"
        :class="{ 'liya-ai-chat-vuejs-file-chip--error': file.status === 'error' }"
      >
        <span class="liya-ai-chat-vuejs-file-chip__icon">{{ getFileIcon(file.file.type) }}</span>
        <span class="liya-ai-chat-vuejs-file-chip__name">{{ file.file.name }}</span>
        <span class="liya-ai-chat-vuejs-file-chip__size">{{ formatFileSize(file.file.size) }}</span>
        <button 
          type="button" 
          class="liya-ai-chat-vuejs-file-chip__remove"
          @click="removePendingFile(file.id)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Input area -->
    <div class="liya-ai-chat-vuejs-chat-input__wrapper">
      <!-- File upload button -->
      <button
        v-if="showFileUpload"
        type="button"
        class="liya-ai-chat-vuejs-chat-input__btn liya-ai-chat-vuejs-chat-input__btn--file"
        :disabled="disabled"
        @click="triggerFileInput"
        :title="t.file.upload"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
        </svg>
      </button>
      <input
        ref="fileInputRef"
        type="file"
        multiple
        class="liya-ai-chat-vuejs-chat-input__file-input"
        @change="handleFileSelect"
      />

      <!-- Text input -->
      <textarea
        ref="textareaRef"
        v-model="inputText"
        :placeholder="placeholderText"
        :disabled="disabled"
        :maxlength="maxLength"
        class="liya-ai-chat-vuejs-chat-input__textarea"
        rows="1"
        @input="adjustTextareaHeight"
        @keydown="handleKeydown"
      ></textarea>

      <!-- Voice button -->
      <button
        v-if="showVoice && voiceSupported"
        type="button"
        class="liya-ai-chat-vuejs-chat-input__btn liya-ai-chat-vuejs-chat-input__btn--voice"
        :class="{ 
          'liya-ai-chat-vuejs-chat-input__btn--recording': isRecording,
          'liya-ai-chat-vuejs-chat-input__btn--voice-disabled': !voiceEnabled
        }"
        :disabled="disabled || !voiceEnabled"
        @click="voiceEnabled ? handleVoiceClick() : null"
        :title="!voiceEnabled ? t.voice.voiceNotSupported : (isRecording ? t.voice.stopRecording : t.voice.startRecording)"
      >
        <!-- Disabled mic icon (with slash) for STANDARD users -->
        <svg v-if="!voiceEnabled" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
        </svg>
        <!-- Normal mic icon -->
        <svg v-else-if="!isRecording" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
        </svg>
        <!-- Recording stop icon -->
        <svg v-else viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M6 6h12v12H6z"/>
        </svg>
      </button>

      <!-- Send button -->
      <button
        type="button"
        class="liya-ai-chat-vuejs-chat-input__btn liya-ai-chat-vuejs-chat-input__btn--send"
        :disabled="!canSend"
        @click="handleSend"
        :title="t.chat.send"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>

    <!-- Character count -->
    <div v-if="characterCount > maxLength * 0.8" class="liya-ai-chat-vuejs-chat-input__count">
      {{ characterCount }} / {{ maxLength }}
    </div>
  </div>
</template>

<style scoped>
.liya-ai-chat-vuejs-chat-input {
  padding: 12px 16px;
  background: transparent;
  border-top: 1px solid var(--liya-ai-chat-vuejs-glass-border, rgba(255, 255, 255, 0.08));
}

.liya-ai-chat-vuejs-chat-input__files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.liya-ai-chat-vuejs-file-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--liya-ai-chat-vuejs-glass-bg-tertiary, rgba(51, 65, 85, 0.4));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--liya-ai-chat-vuejs-glass-border, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  font-size: 12px;
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
}

.liya-ai-chat-vuejs-file-chip--error {
  background: rgba(220, 38, 38, 0.2);
  border-color: rgba(220, 38, 38, 0.3);
  color: #fca5a5;
}

.liya-ai-chat-vuejs-file-chip__icon {
  font-size: 14px;
}

.liya-ai-chat-vuejs-file-chip__name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.liya-ai-chat-vuejs-file-chip__size {
  color: var(--liya-ai-chat-vuejs-text-muted, #64748b);
  font-size: 11px;
}

.liya-ai-chat-vuejs-file-chip__remove {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: var(--liya-ai-chat-vuejs-text-muted, #64748b);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.liya-ai-chat-vuejs-file-chip__remove:hover {
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
}

.liya-ai-chat-vuejs-chat-input__wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: var(--liya-ai-chat-vuejs-glass-bg-input, rgba(15, 23, 42, 0.8));
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--liya-ai-chat-vuejs-glass-border, rgba(255, 255, 255, 0.08));
  border-radius: 24px;
  padding: 8px 12px;
  transition: all 0.3s ease;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.2);
}

.liya-ai-chat-vuejs-chat-input__wrapper:focus-within {
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(99, 102, 241, 0.15);
}

.liya-ai-chat-vuejs-chat-input__file-input {
  display: none;
}

.liya-ai-chat-vuejs-chat-input__textarea {
  flex: 1;
  border: none;
  background: transparent;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  max-height: 150px;
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
  font-family: inherit;
  padding: 6px 4px;
}

.liya-ai-chat-vuejs-chat-input__textarea:focus {
  outline: none;
}

.liya-ai-chat-vuejs-chat-input__textarea::placeholder {
  color: var(--liya-ai-chat-vuejs-text-muted, #64748b);
}

.liya-ai-chat-vuejs-chat-input__btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: transparent;
  color: var(--liya-ai-chat-vuejs-text-secondary, #94a3b8);
  position: relative;
  z-index: 10;
}

.liya-ai-chat-vuejs-chat-input__btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--liya-ai-chat-vuejs-text-primary, #f1f5f9);
  transform: scale(1.05);
}

.liya-ai-chat-vuejs-chat-input__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.liya-ai-chat-vuejs-chat-input__btn--send {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.liya-ai-chat-vuejs-chat-input__btn--send:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(99, 102, 241, 1) 0%, rgba(79, 70, 229, 1) 100%);
  color: white;
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
  transform: scale(1.05);
}

.liya-ai-chat-vuejs-chat-input__btn--recording {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%);
  color: white;
  animation: liya-ai-chat-vuejs-pulse 1.5s infinite;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.liya-ai-chat-vuejs-chat-input__btn--voice-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: transparent;
  color: var(--liya-ai-chat-vuejs-text-muted, #64748b);
}

.liya-ai-chat-vuejs-chat-input__btn--voice-disabled:hover {
  background: transparent;
  color: var(--liya-ai-chat-vuejs-text-muted, #64748b);
  transform: none;
}

@keyframes liya-ai-chat-vuejs-pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 4px 20px rgba(220, 38, 38, 0.5);
  }
}

.liya-ai-chat-vuejs-chat-input__count {
  text-align: right;
  font-size: 11px;
  color: var(--liya-ai-chat-vuejs-text-muted, #64748b);
  margin-top: 4px;
}
</style>
