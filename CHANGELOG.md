# Changelog

## [1.0.5] - 2025-02-24

### Fixed
- Safari/iOS SpeechRecognition support — removed iOS guard, allow API if available (iPadOS 16+, macOS Ventura+)
- Microphone permission request now works independently of SpeechRecognition support
- Graceful fallback when SpeechRecognition fails on a platform

## [1.0.4] - 2025-02-20

### Added
- Initial public release
