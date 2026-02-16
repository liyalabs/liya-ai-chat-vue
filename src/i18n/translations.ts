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
// Liya AI Chat - Internationalization Translations

export type SupportedLocale = 'tr' | 'en'

export interface Translations {
  // Widget general
  widget: {
    openChat: string
    closeChat: string
    online: string
    preparing: string
    speaking: string
  }
  // Browser compatibility
  browser: {
    unsupportedTitle: string
    unsupportedMessage: string
    recommendedBrowsers: string
    closeButton: string
  }
  // Microphone permission
  mic: {
    permissionRequired: string
    permissionMessage: string
    allowButton: string
    denied: string
  }
  // Chat
  chat: {
    placeholder: string
    send: string
    typing: string
    welcomeMessage: string
    welcomeSuggestions: string[]
  }
  // Voice
  voice: {
    startRecording: string
    stopRecording: string
    listening: string
    thinking: string
    speakToMic: string
    voiceNotSupported: string
  }
  // File upload
  file: {
    upload: string
    uploading: string
    uploadError: string
    maxSize: string
    invalidType: string
  }
  // Kiosk mode
  kiosk: {
    close: string
    cancel: string
    refresh: string
    ready: string
    listening: string
    preparing: string
    speaking: string
  }
  // Rotating preparing messages (long processing)
  preparingMessages: string[]
  // Branding
  branding: {
    poweredBy: string
  }
  // Errors
  errors: {
    connectionError: string
    sendError: string
    sessionError: string
    featureNotAvailable: string
    upgradeToPremium: string
    upgradeToPremiumPlus: string
  }
  // App / Session sidebar
  app: {
    newChat: string
    loading: string
    noChats: string
    startNewChat: string
    messages: string
    yesterday: string
    deleteChat: string
    deleteConfirmTitle: string
    deleteConfirmMessage: string
    cancel: string
    delete: string
    openMenu: string
    closeMenu: string
  }
}

export const translations: Record<SupportedLocale, Translations> = {
  tr: {
    widget: {
      openChat: 'Sohbeti aç',
      closeChat: 'Sohbeti kapat',
      online: 'Çevrimiçi',
      preparing: 'Hazırlanıyor...',
      speaking: 'Konuşuyor...',
    },
    browser: {
      unsupportedTitle: 'Tarayıcı Desteklenmiyor',
      unsupportedMessage: 'Bu widget tarayıcınızda çalışmıyor. Lütfen güncel bir tarayıcı kullanın.',
      recommendedBrowsers: 'Önerilen: Chrome, Edge, Firefox, Safari',
      closeButton: 'Kapat',
    },
    mic: {
      permissionRequired: 'Mikrofon İzni Gerekli',
      permissionMessage: 'Sesli iletişim için mikrofon erişimine izin verin.',
      allowButton: 'İzin Ver',
      denied: 'Mikrofon izni reddedildi',
    },
    chat: {
      placeholder: 'Mesajınızı yazın...',
      send: 'Gönder',
      typing: 'Yazıyor...',
      welcomeMessage: 'Bu chat hizmeti Liya AI tarafından sağlanmaktadır. Size bugün nasıl yardımcı olabilirim?',
      welcomeSuggestions: [
        'Liya AI nedir?',
        'Liya AI hakkında bilgi ver',
        'Liyalabs şirketini tanıt'
      ],
    },
    voice: {
      startRecording: 'Konuşmaya başla',
      stopRecording: 'Dinlemeyi durdur',
      listening: 'Dinliyorum...',
      thinking: 'Düşünüyorum...',
      speakToMic: 'Konuşmak için mikrofona basın',
      voiceNotSupported: 'Ses tanıma desteklenmiyor',
    },
    file: {
      upload: 'Dosya yükle',
      uploading: 'Yükleniyor...',
      uploadError: 'Dosya yüklenirken hata oluştu',
      maxSize: 'Maksimum dosya boyutu: {size}MB',
      invalidType: 'Geçersiz dosya türü',
    },
    kiosk: {
      close: 'Kapat',
      cancel: 'İptal',
      refresh: 'Yenile',
      ready: 'Hazır',
      listening: 'Dinliyorum...',
      preparing: 'Hazırlanıyor...',
      speaking: 'Konuşuyor...',
    },
    preparingMessages: [
      'Hazırlanıyor...',
      'Düşünüyorum... 🤔',
      'Biraz daha bekleyin...',
      'Cevabı hazırlıyorum... ✍️',
      'Neredeyse bitti... ⏳',
      'Az kaldı, sabırlı olun... 😊',
      'Detaylı bir cevap geliyor...',
      'Hâlâ düşünüyorum... 🧠',
      'Bu güzel bir soru, biraz zaman alıyor...',
      'Son rötuşlar... ✨',
    ],
    branding: {
      poweredBy: 'Powered by',
    },
    errors: {
      connectionError: 'Bağlantı hatası oluştu',
      sendError: 'Mesaj gönderilemedi',
      sessionError: 'Oturum hatası',
      featureNotAvailable: 'Bu özellik mevcut planınızda kullanılamaz',
      upgradeToPremium: 'Premium veya Premium Plus planına yükseltin.',
      upgradeToPremiumPlus: 'Premium Plus planına yükseltin.',
    },
    app: {
      newChat: 'Yeni Sohbet',
      loading: 'Yükleniyor...',
      noChats: 'Henüz sohbet yok',
      startNewChat: 'Yeni Sohbet Başlat',
      messages: 'mesaj',
      yesterday: 'Dün',
      deleteChat: 'Sohbeti sil',
      deleteConfirmTitle: 'Sohbeti Sil',
      deleteConfirmMessage: 'sohbetini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      cancel: 'İptal',
      delete: 'Sil',
      openMenu: 'Menüyü Aç',
      closeMenu: 'Menüyü Kapat',
    },
  },
  en: {
    widget: {
      openChat: 'Open chat',
      closeChat: 'Close chat',
      online: 'Online',
      preparing: 'Preparing...',
      speaking: 'Speaking...',
    },
    browser: {
      unsupportedTitle: 'Browser Not Supported',
      unsupportedMessage: 'This widget does not work in your browser. Please use a modern browser.',
      recommendedBrowsers: 'Recommended: Chrome, Edge, Firefox, Safari',
      closeButton: 'Close',
    },
    mic: {
      permissionRequired: 'Microphone Permission Required',
      permissionMessage: 'Allow microphone access for voice communication.',
      allowButton: 'Allow',
      denied: 'Microphone permission denied',
    },
    chat: {
      placeholder: 'Type your message...',
      send: 'Send',
      typing: 'Typing...',
      welcomeMessage: 'This chat service is provided by Liya AI. How can I help you today?',
      welcomeSuggestions: [
        'What is Liya AI?',
        'Tell me about Liya AI',
        'Introduce Liyalabs company'
      ],
    },
    voice: {
      startRecording: 'Start speaking',
      stopRecording: 'Stop listening',
      listening: 'Listening...',
      thinking: 'Thinking...',
      speakToMic: 'Press the microphone to speak',
      voiceNotSupported: 'Voice recognition not supported',
    },
    file: {
      upload: 'Upload file',
      uploading: 'Uploading...',
      uploadError: 'Error uploading file',
      maxSize: 'Maximum file size: {size}MB',
      invalidType: 'Invalid file type',
    },
    kiosk: {
      close: 'Close',
      cancel: 'Cancel',
      refresh: 'Refresh',
      ready: 'Ready',
      listening: 'Listening...',
      preparing: 'Preparing...',
      speaking: 'Speaking...',
    },
    preparingMessages: [
      'Preparing...',
      'Thinking... 🤔',
      'Hold on a moment...',
      'Preparing the answer... ✍️',
      'Almost done... ⏳',
      'Just a bit more, please be patient... 😊',
      'A detailed answer is coming...',
      'Still thinking... 🧠',
      'Great question, it takes a moment...',
      'Final touches... ✨',
    ],
    branding: {
      poweredBy: 'Powered by',
    },
    errors: {
      connectionError: 'Connection error occurred',
      sendError: 'Failed to send message',
      sessionError: 'Session error',
      featureNotAvailable: 'This feature is not available in your current plan',
      upgradeToPremium: 'Upgrade to Premium or Premium Plus.',
      upgradeToPremiumPlus: 'Upgrade to Premium Plus.',
    },
    app: {
      newChat: 'New Chat',
      loading: 'Loading...',
      noChats: 'No chats yet',
      startNewChat: 'Start New Chat',
      messages: 'messages',
      yesterday: 'Yesterday',
      deleteChat: 'Delete chat',
      deleteConfirmTitle: 'Delete Chat',
      deleteConfirmMessage: 'Are you sure you want to delete this chat? This action cannot be undone.',
      cancel: 'Cancel',
      delete: 'Delete',
      openMenu: 'Open Menu',
      closeMenu: 'Close Menu',
    },
  },
}

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locale === 'tr' || locale === 'en'
}

export function detectBrowserLocale(): SupportedLocale {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'tr'
  }
  
  const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || ''
  const langCode = browserLang.split('-')[0].toLowerCase()
  
  if (isSupportedLocale(langCode)) {
    return langCode
  }
  
  return 'tr'
}
