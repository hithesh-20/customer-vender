import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:vendor_saathi/services/voice_service.dart';

part 'voice_command_model.freezed.dart';
part 'voice_command_model.g.dart';

@freezed
class VoiceCommand with _$VoiceCommand {
  const factory VoiceCommand({
    String? id,
    String? text,
    String? processedText,
    String? kannadaText,
    String? language,
    VoiceIntent? intent,
    String? action,
    Map<String, dynamic>? parameters,
    double? confidence,
    bool? isRecognized,
    bool? isProcessed,
    DateTime? timestamp,
    DateTime? processedAt,
    String? responseText,
    String? responseKannada,
    String? error,
    Map<String, dynamic>? metadata,
    // Context
    String? screenContext,
    String? previousCommandId,
    List<String>? followUpCommands,
  }) = _VoiceCommand;

  factory VoiceCommand.fromJson(Map<String, dynamic> json) => 
      _$VoiceCommandFromJson(json);
}

// Voice Command Response
@freezed
class VoiceCommandResponse with _$VoiceCommandResponse {
  const factory VoiceCommandResponse({
    String? commandId,
    bool? success,
    String? message,
    String? kannadaMessage,
    VoiceIntent? intent,
    String? action,
    Map<String, dynamic>? data,
    Map<String, dynamic>? parameters,
    String? error,
    DateTime? timestamp,
  }) = _VoiceCommandResponse;

  factory VoiceCommandResponse.fromJson(Map<String, dynamic> json) => 
      _$VoiceCommandResponseFromJson(json);
}

// Voice Command History
@freezed
class VoiceCommandHistory with _$VoiceCommandHistory {
  const factory VoiceCommandHistory({
    String? id,
    String? userId,
    List<VoiceCommand>? commands,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _VoiceCommandHistory;

  factory VoiceCommandHistory.fromJson(Map<String, dynamic> json) => 
      _$VoiceCommandHistoryFromJson(json);
}

// Voice Settings
@freezed
class VoiceSettings with _$VoiceSettings {
  const factory VoiceSettings({
    String? id,
    String? userId,
    String? primaryLanguage,
    List<String>? supportedLanguages,
    String? defaultLanguage,
    double? speechRate,
    double? speechPitch,
    String? selectedVoice,
    bool? autoDetectLanguage,
    bool? continuousListening,
    bool? showTranscript,
    bool? playConfirmationSound,
    bool? vibrateOnRecognition,
    bool? useKannadaForResponses,
    int? recognitionTimeout,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _VoiceSettings;

  factory VoiceSettings.fromJson(Map<String, dynamic> json) => 
      _$VoiceSettingsFromJson(json);
}

// Voice Guidance
@freezed
class VoiceGuidance with _$VoiceGuidance {
  const factory VoiceGuidance({
    String? id,
    String? screen,
    String? element,
    String? title,
    String? kannadaTitle,
    String? description,
    String? kannadaDescription,
    String? voiceCommand,
    String? kannadaVoiceCommand,
    String? action,
    Map<String, dynamic>? parameters,
    int? priority,
    bool? isActive,
    DateTime? createdAt,
  }) = _VoiceGuidance;

  factory VoiceGuidance.fromJson(Map<String, dynamic> json) => 
      _$VoiceGuidanceFromJson(json);
}

// Predefined Voice Commands for different screens
class VoiceCommands {
  static const Map<String, List<VoiceGuidance>> screenCommands = {
    'dashboard': [
      VoiceGuidance(
        id: 'dashboard_sales',
        screen: 'dashboard',
        element: 'sales_card',
        title: 'Today Sales',
        kannadaTitle: 'ಇಂದಿನ ಮಾರಾಟ',
        description: 'Say "Show today sales" to view today\'s sales report',
        kannadaDescription: '"ಇಂದಿನ ಮಾರಾಟ ವರದಿ ತೋರಿಸಿ" ಎಂದರೆ ಇಂದಿನ ಮಾರಾಟ ವರದಿ ತೋರಿಸುತ್ತದೆ',
        voiceCommand: 'Show today sales',
        kannadaVoiceCommand: 'ಇಂದಿನ ಮಾರಾಟ ವರದಿ ತೋರಿಸಿ',
        action: 'show_sales_report',
        parameters: {'date': 'today'},
        priority: 1,
        isActive: true,
      ),
      VoiceGuidance(
        id: 'dashboard_orders',
        screen: 'dashboard',
        element: 'orders_card',
        title: 'Recent Orders',
        kannadaTitle: 'ಇತ್ತೀಚಿನ ಆರ್ಡರ್‍ಗಳು',
        description: 'Say "Show orders" to view recent orders',
        kannadaDescription: '"ಆರ್ಡರ್ ಪಟ್ಟಿ ತೋರಿಸಿ" ಎಂದರೆ ಇತ್ತೀಚಿನ ಆರ್ಡರ್‍ಗಳನ್ನು ತೋರಿಸುತ್ತದೆ',
        voiceCommand: 'Show orders',
        kannadaVoiceCommand: 'ಆರ್ಡರ್ ಪಟ್ಟಿ ತೋರಿಸಿ',
        action: 'show_orders',
        parameters: {},
        priority: 1,
        isActive: true,
      ),
      VoiceGuidance(
        id: 'dashboard_route',
        screen: 'dashboard',
        element: 'route_card',
        title: 'Today Route',
        kannadaTitle: 'ಇಂದಿನ ರೂಟ್',
        description: 'Say "Optimize route" to optimize today\'s delivery route',
        kannadaDescription: '"ರೂಟ್ ಆಪ್ಟಿಮೈಜ್ ಮಾಡಿ" ಎಂದರೆ ಇಂದಿನ ಡಿಲಿವರಿ ರೂಟ್ ಆಪ್ಟಿಮೈಜ್ ಆಗುತ್ತದೆ',
        voiceCommand: 'Optimize route',
        kannadaVoiceCommand: 'ರೂಟ್ ಆಪ್ಟಿಮೈಜ್ ಮಾಡಿ',
        action: 'optimize_route',
        parameters: {},
        priority: 1,
        isActive: true,
      ),
    ],
    'products': [
      VoiceGuidance(
        id: 'products_list',
        screen: 'products',
        element: 'product_list',
        title: 'Product List',
        kannadaTitle: 'ಉತ್ಪನ್ನ ಪಟ್ಟಿ',
        description: 'Say "Show my products" to refresh product list',
        kannadaDescription: '"ನನ್ನ ಉತ್ಪನ್ನಗಳನ್ನು ತೋರಿಸಿ" ಎಂದರೆ ಉತ್ಪನ್ನ ಪಟ್ಟಿ ರಿಫ್ರೆಶ್ ಆಗುತ್ತದೆ',
        voiceCommand: 'Show my products',
        kannadaVoiceCommand: 'ನನ್ನ ಉತ್ಪನ್ನಗಳನ್ನು ತೋರಿಸಿ',
        action: 'refresh_products',
        parameters: {},
        priority: 1,
        isActive: true,
      ),
      VoiceGuidance(
        id: 'products_add',
        screen: 'products',
        element: 'add_button',
        title: 'Add Product',
        kannadaTitle: 'ಉತ್ಪನ್ನ ಸೇರಿಸಿ',
        description: 'Say "Create new product" to add a new product',
        kannadaDescription: '"ಹೊಸ ಉತ್ಪನ್ನ ಸೃಷ್ಟಿಸಿ" ಎಂದರೆ ಹೊಸ ಉತ್ಪನ್ನ ಸೇರಿಸಬಹುದು',
        voiceCommand: 'Create new product',
        kannadaVoiceCommand: 'ಹೊಸ ಉತ್ಪನ್ನ ಸೃಷ್ಟಿಸಿ',
        action: 'create_product',
        parameters: {},
        priority: 1,
        isActive: true,
      ),
    ],
    'orders': [
      VoiceGuidance(
        id: 'orders_create',
        screen: 'orders',
        element: 'create_button',
        title: 'Create Order',
        kannadaTitle: 'ಆರ್ಡರ್ ಸೃಷ್ಟಿಸಿ',
        description: 'Say "Create new order" to create a new order',
        kannadaDescription: '"ಹೊಸ ಆರ್ಡರ್ ಸೃಷ್ಟಿಸಿ" ಎಂದರೆ ಹೊಸ ಆರ್ಡರ್ ಸೃಷ್ಟಿಸಬಹುದು',
        voiceCommand: 'Create new order',
        kannadaVoiceCommand: 'ಹೊಸ ಆರ್ಡರ್ ಸೃಷ್ಟಿಸಿ',
        action: 'create_order',
        parameters: {},
        priority: 1,
        isActive: true,
      ),
      VoiceGuidance(
        id: 'orders_filter',
        screen: 'orders',
        element: 'filter',
        title: 'Filter Orders',
        kannadaTitle: 'ಆರ್ಡರ್ ಫಿಲ್ಟರ್ ಮಾಡಿ',
        description: 'Say "Show today orders" to filter today\'s orders',
        kannadaDescription: '"ಇಂದಿನ ಆರ್ಡರ್‍ಗಳನ್ನು ತೋರಿಸಿ" ಎಂದರೆ ಇಂದಿನ ಆರ್ಡರ್‍ಗಳು ಫಿಲ್ಟರ್ ಆಗುತ್ತವೆ',
        voiceCommand: 'Show today orders',
        kannadaVoiceCommand: 'ಇಂದಿನ ಆರ್ಡರ್‍ಗಳನ್ನು ತೋರಿಸಿ',
        action: 'filter_orders',
        parameters: {'filter': 'today'},
        priority: 1,
        isActive: true,
      ),
    ],
    'settings': [
      VoiceGuidance(
        id: 'settings_help',
        screen: 'settings',
        element: 'help',
        title: 'Help',
        kannadaTitle: 'ಸಹಾಯ',
        description: 'Say "Help" to get assistance',
        kannadaDescription: '"ಸಹಾಯ" ಎಂದರೆ ಸಹಾಯ ಸಿಗುತ್ತದೆ',
        voiceCommand: 'Help',
        kannadaVoiceCommand: 'ಸಹಾಯ',
        action: 'show_help',
        parameters: {},
        priority: 1,
        isActive: true,
      ),
    ],
  };
}
