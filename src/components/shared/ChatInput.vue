<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useVoice } from '../../composables/useVoice'
import { useFileUpload } from '../../composables/useFileUpload'

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
  <div class="liya-chat-input">
    <!-- Pending files -->
    <div v-if="hasPendingFiles" class="liya-chat-input__files">
      <div 
        v-for="file in pendingFiles" 
        :key="file.id" 
        class="liya-file-chip"
        :class="{ 'liya-file-chip--error': file.status === 'error' }"
      >
        <span class="liya-file-chip__icon">{{ getFileIcon(file.file.type) }}</span>
        <span class="liya-file-chip__name">{{ file.file.name }}</span>
        <span class="liya-file-chip__size">{{ formatFileSize(file.file.size) }}</span>
        <button 
          type="button" 
          class="liya-file-chip__remove"
          @click="removePendingFile(file.id)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Input area -->
    <div class="liya-chat-input__wrapper">
      <!-- File upload button -->
      <button
        v-if="showFileUpload"
        type="button"
        class="liya-chat-input__btn liya-chat-input__btn--file"
        :disabled="disabled"
        @click="triggerFileInput"
        title="Dosya ekle"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
        </svg>
      </button>
      <input
        ref="fileInputRef"
        type="file"
        multiple
        class="liya-chat-input__file-input"
        @change="handleFileSelect"
      />

      <!-- Text input -->
      <textarea
        ref="textareaRef"
        v-model="inputText"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxLength"
        class="liya-chat-input__textarea"
        rows="1"
        @input="adjustTextareaHeight"
        @keydown="handleKeydown"
      ></textarea>

      <!-- Voice button -->
      <button
        v-if="showVoice && voiceSupported"
        type="button"
        class="liya-chat-input__btn liya-chat-input__btn--voice"
        :class="{ 
          'liya-chat-input__btn--recording': isRecording,
          'liya-chat-input__btn--voice-disabled': !voiceEnabled
        }"
        :disabled="disabled || !voiceEnabled"
        @click="voiceEnabled ? handleVoiceClick() : null"
        :title="!voiceEnabled ? 'Sesli yazma özelliği Premium üyelik gerektirir' : (isRecording ? 'Kaydı durdur' : 'Sesle yaz')"
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
        class="liya-chat-input__btn liya-chat-input__btn--send"
        :disabled="!canSend"
        @click="handleSend"
        title="Gönder"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>

    <!-- Character count -->
    <div v-if="characterCount > maxLength * 0.8" class="liya-chat-input__count">
      {{ characterCount }} / {{ maxLength }}
    </div>
  </div>
</template>

<style scoped>
.liya-chat-input {
  padding: 12px 16px;
  border-top: 1px solid var(--liya-border-color, #e5e7eb);
  background: var(--liya-bg-color, #ffffff);
}

.liya-chat-input__files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.liya-file-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--liya-bg-secondary, #f3f4f6);
  border-radius: 8px;
  font-size: 12px;
}

.liya-file-chip--error {
  background: #fef2f2;
  color: #dc2626;
}

.liya-file-chip__icon {
  font-size: 14px;
}

.liya-file-chip__name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.liya-file-chip__size {
  color: var(--liya-text-muted, #9ca3af);
}

.liya-file-chip__remove {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: var(--liya-text-muted, #9ca3af);
  display: flex;
  align-items: center;
  justify-content: center;
}

.liya-file-chip__remove:hover {
  color: var(--liya-text-color, #374151);
}

.liya-chat-input__wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: var(--liya-bg-secondary, #f3f4f6);
  border-radius: 24px;
  padding: 8px 12px;
}

.liya-chat-input__file-input {
  display: none;
}

.liya-chat-input__textarea {
  flex: 1;
  border: none;
  background: transparent;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  max-height: 150px;
  color: var(--liya-text-color, #374151);
  font-family: inherit;
}

.liya-chat-input__textarea:focus {
  outline: none;
}

.liya-chat-input__textarea::placeholder {
  color: var(--liya-text-muted, #9ca3af);
}

.liya-chat-input__btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: transparent;
  color: var(--liya-text-muted, #9ca3af);
}

.liya-chat-input__btn:hover:not(:disabled) {
  background: var(--liya-bg-color, #ffffff);
  color: var(--liya-text-color, #374151);
}

.liya-chat-input__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.liya-chat-input__btn--send {
  background: var(--liya-primary-color, #6366f1);
  color: white;
}

.liya-chat-input__btn--send:hover:not(:disabled) {
  background: var(--liya-primary-hover, #4f46e5);
  color: white;
}

.liya-chat-input__btn--recording {
  background: #dc2626;
  color: white;
  animation: liya-pulse 1.5s infinite;
}

.liya-chat-input__btn--voice-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: transparent;
  color: var(--liya-text-muted, #9ca3af);
}

.liya-chat-input__btn--voice-disabled:hover {
  background: transparent;
  color: var(--liya-text-muted, #9ca3af);
}

@keyframes liya-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.liya-chat-input__count {
  text-align: right;
  font-size: 11px;
  color: var(--liya-text-muted, #9ca3af);
  margin-top: 4px;
}
</style>
