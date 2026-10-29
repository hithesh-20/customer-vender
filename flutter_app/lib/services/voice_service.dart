import 'dart:async';
import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter_tts/flutter_tts.dart';
import 'package:vendor_saathi/models/voice_command_model.dart';
import 'package:vendor_saathi/utils/constants.dart';

class VoiceService with ChangeNotifier {
  static final VoiceService _instance = VoiceService._internal();
  factory VoiceService() => _instance;
  VoiceService._internal();

  // Speech to Text
  final stt.SpeechToText _speechToText = stt.SpeechToText();
  bool _isListening = false;
  String _recognizedText = '';
  String _currentUtterance = '';

  // Text to Speech
  final FlutterTts _flutterTts = FlutterTts();
  bool _isSpeaking = false;
  String _currentSpeech = '';

  // Voice command processor
  final VoiceCommandProcessor _commandProcessor = VoiceCommandProcessor();

  // State
  bool get isListening => _isListening;
  bool get isSpeaking => _isSpeaking;
  String get recognizedText => _recognizedText;
  String get currentUtterance => _currentUtterance;
  String get currentSpeech => _currentSpeech;

  // Language settings
  String _language = 'kn-IN'; // Kannada by default
  String _voiceRate = '1.0';
  String _voicePitch = '1.0';
  String? _selectedVoice;

  // Initialize
  Future<void> initialize() async {
    await _initializeSpeechToText();
    await _initializeTextToSpeech();
  }

  // Initialize Speech to Text
  Future<void> _initializeSpeechToText() async {
    bool available = await _speechToText.initialize(
      onStatus: (status) => _onSpeechStatus(status),
      onError: (error) => _onSpeechError(error),
    );
    
    if (!available) {
      debugPrint('Speech to Text not available');
    }
    
    // Set language
    await _setSpeechLanguage(_language);
  }

  // Initialize Text to Speech
  Future<void> _initializeTextToSpeech() async {
    await _flutterTts.setLanguage(_language);
    await _flutterTts.setSpeechRate(double.parse(_voiceRate));
    await _flutterTts.setPitch(double.parse(_voicePitch));
    
    // Get available voices
    final voices = await _flutterTts.getVoices;
    debugPrint('Available voices: $voices');
    
    // Try to find a Kannada voice
    final kannadaVoices = voices.where((voice) => 
      voice.locale?.contains('kn') ?? false
    ).toList();
    
    if (kannadaVoices.isNotEmpty) {
      _selectedVoice = kannadaVoices.first.name;
      await _flutterTts.setVoice(_selectedVoice);
    }
    
    // Set up TTS callbacks
    _flutterTts.setStartHandler(() {
      _isSpeaking = true;
      notifyListeners();
    });
    
    _flutterTts.setCompletionHandler(() {
      _isSpeaking = false;
      _currentSpeech = '';
      notifyListeners();
    });
    
    _flutterTts.setCancelHandler(() {
      _isSpeaking = false;
      _currentSpeech = '';
      notifyListeners();
    });
    
    _flutterTts.setErrorHandler((error) {
      debugPrint('TTS Error: $error');
      _isSpeaking = false;
      notifyListeners();
    });
  }

  // Set speech language
  Future<void> _setSpeechLanguage(String language) async {
    _language = language;
    await _speechToText.setLocaleId(language);
  }

  // Start listening
  Future<void> startListening({
    String? language,
    Function(String)? onRecognition,
    Function(VoiceCommand)? onCommandRecognized,
    Function(String)? onError,
  }) async {
    if (_isListening || _isSpeaking) return;
    
    if (language != null) {
      await _setSpeechLanguage(language);
    }
    
    _recognizedText = '';
    _currentUtterance = '';
    _isListening = true;
    notifyListeners();
    
    try {
      await _speechToText.listen(
        onResult: (result) {
          _currentUtterance = result.recognizedWords;
          _recognizedText += result.recognizedWords + ' ';
          notifyListeners();
          
          if (onRecognition != null) {
            onRecognition(result.recognizedWords);
          }
          
          // Process command
          final command = VoiceCommand(
            text: result.recognizedWords,
            language: _language,
            timestamp: DateTime.now(),
          );
          
          final processedCommand = _commandProcessor.process(command);
          if (processedCommand != null && onCommandRecognized != null) {
            onCommandRecognized(processedCommand);
          }
        },
        listenFor: const Duration(seconds: 30),
        pauseFor: const Duration(seconds: 5),
        partialResults: true,
        localeId: language ?? _language,
        onSoundLevelChange: (level) {
          // Can be used for visual feedback
        },
        cancelOnError: true,
        listenMode: stt.ListenMode.confirmation,
      );
    } catch (e) {
      debugPrint('Error starting speech recognition: $e');
      _isListening = false;
      if (onError != null) {
        onError(e.toString());
      }
      notifyListeners();
    }
  }

  // Stop listening
  Future<void> stopListening() async {
    if (!_isListening) return;
    
    await _speechToText.stop();
    _isListening = false;
    notifyListeners();
  }

  // Cancel listening
  Future<void> cancelListening() async {
    if (!_isListening) return;
    
    await _speechToText.cancel();
    _isListening = false;
    _recognizedText = '';
    _currentUtterance = '';
    notifyListeners();
  }

  // Speak text
  Future<void> speak({
    required String text,
    String? language,
    double? rate,
    double? pitch,
    Function? onStart,
    Function? onComplete,
    Function? onError,
  }) async {
    if (_isSpeaking) {
      await stopSpeaking();
    }
    
    _currentSpeech = text;
    _isSpeaking = true;
    notifyListeners();
    
    try {
      if (onStart != null) onStart();
      
      await _flutterTts.speak(text);
      
      if (onComplete != null) onComplete();
    } catch (e) {
      debugPrint('Error speaking: $e');
      if (onError != null) onError();
    } finally {
      _isSpeaking = false;
      notifyListeners();
    }
  }

  // Speak Kannada
  Future<void> speakKannada(String kannadaText) async {
    await speak(text: kannadaText, language: 'kn-IN');
  }

  // Speak English
  Future<void> speakEnglish(String englishText) async {
    await speak(text: englishText, language: 'en-US');
  }

  // Stop speaking
  Future<void> stopSpeaking() async {
    if (!_isSpeaking) return;
    
    await _flutterTts.stop();
    _isSpeaking = false;
    _currentSpeech = '';
    notifyListeners();
  }

  // Pause speaking
  Future<void> pauseSpeaking() async {
    if (!_isSpeaking) return;
    
    await _flutterTts.pause();
    notifyListeners();
  }

  // Resume speaking
  Future<void> resumeSpeaking() async {
    if (_isSpeaking) {
      await _flutterTts.resume();
      notifyListeners();
    }
  }

  // Set language
  Future<void> setLanguage(String language) async {
    _language = language;
    await _setSpeechLanguage(language);
    await _flutterTts.setLanguage(language);
    notifyListeners();
  }

  // Set voice rate
  Future<void> setVoiceRate(double rate) async {
    _voiceRate = rate.toString();
    await _flutterTts.setSpeechRate(rate);
    notifyListeners();
  }

  // Set voice pitch
  Future<void> setVoicePitch(double pitch) async {
    _voicePitch = pitch.toString();
    await _flutterTts.setPitch(pitch);
    notifyListeners();
  }

  // Set voice
  Future<void> setVoice(String? voice) async {
    _selectedVoice = voice;
    if (voice != null) {
      await _flutterTts.setVoice(voice);
    }
    notifyListeners();
  }

  // Get available languages for speech recognition
  Future<List<String>> getAvailableLanguages() async {
    return _speechToText.locales();
  }

  // Get available voices for TTS
  Future<List<dynamic>> getAvailableVoices() async {
    return await _flutterTts.getVoices;
  }

  // Check if speech recognition is available
  Future<bool> isSpeechAvailable() async {
    return await _speechToText.initialize();
  }

  // Check if TTS is available
  Future<bool> isTtsAvailable() async {
    return await _flutterTts.getVoices != null;
  }

  // Process voice command
  VoiceCommand? processCommand(String text) {
    final command = VoiceCommand(
      text: text,
      language: _language,
      timestamp: DateTime.now(),
    );
    return _commandProcessor.process(command);
  }

  // Speech status callback
  void _onSpeechStatus(String status) {
    debugPrint('Speech status: $status');
    
    if (status == 'done') {
      _isListening = false;
      notifyListeners();
    } else if (status == 'notListening') {
      _isListening = false;
      notifyListeners();
    }
  }

  // Speech error callback
  void _onSpeechError(String error) {
    debugPrint('Speech error: $error');
    _isListening = false;
    notifyListeners();
  }

  // Dispose
  @override
  void dispose() {
    _speechToText.stop();
    _speechToText.cancel();
    _flutterTts.stop();
    super.dispose();
  }
}

// Voice Command Processor
class VoiceCommandProcessor {
  final Map<String, VoiceCommandIntent> _commandMap = {
    // Kannada commands
    'ನನ್ನ ಉತ್ಪನ್ನಗಳನ್ನು ತೋರಿಸಿ': VoiceCommandIntent(
      intent: VoiceIntent.showProducts,
      kannada: 'ನನ್ನ ಉತ್ಪನ್ನಗಳನ್ನು ತೋರಿಸಿ',
      english: 'Show my products',
      action: 'show_products',
      parameters: {},
    ),
    'ಹೊಸ ಉತ್ಪನ್ನ ಸೃಷ್ಟಿಸಿ': VoiceCommandIntent(
      intent: VoiceIntent.createProduct,
      kannada: 'ಹೊಸ ಉತ್ಪನ್ನ ಸೃಷ್ಟಿಸಿ',
      english: 'Create new product',
      action: 'create_product',
      parameters: {},
    ),
    'ಉತ್ಪನ್ನ ಅಳಿಸಿ': VoiceCommandIntent(
      intent: VoiceIntent.deleteProduct,
      kannada: 'ಉತ್ಪನ್ನ ಅಳಿಸಿ',
      english: 'Delete product',
      action: 'delete_product',
      parameters: {},
    ),
    'ಹೊಸ ಆರ್ಡರ್ ಸೃಷ್ಟಿಸಿ': VoiceCommandIntent(
      intent: VoiceIntent.createOrder,
      kannada: 'ಹೊಸ ಆರ್ಡರ್ ಸೃಷ್ಟಿಸಿ',
      english: 'Create new order',
      action: 'create_order',
      parameters: {},
    ),
    'ಆರ್ಡರ್ ಪಟ್ಟಿ ತೋರಿಸಿ': VoiceCommandIntent(
      intent: VoiceIntent.showOrders,
      kannada: 'ಆರ್ಡರ್ ಪಟ್ಟಿ ತೋರಿಸಿ',
      english: 'Show orders',
      action: 'show_orders',
      parameters: {},
    ),
    'ಇಂದಿನ ಮಾರಾಟ ವರದಿ': VoiceCommandIntent(
      intent: VoiceIntent.showSalesReport,
      kannada: 'ಇಂದಿನ ಮಾರಾಟ ವರದಿ',
      english: 'Show today sales report',
      action: 'show_sales_report',
      parameters: {'date': 'today'},
    ),
    'ರೂಟ್ ಆಪ್ಟಿಮೈಜ್ ಮಾಡಿ': VoiceCommandIntent(
      intent: VoiceIntent.optimizeRoute,
      kannada: 'ರೂಟ್ ಆಪ್ಟಿಮೈಜ್ ಮಾಡಿ',
      english: 'Optimize route',
      action: 'optimize_route',
      parameters: {},
    ),
    'ನನ್ನ ಸ್ಥಳ ತೋರಿಸಿ': VoiceCommandIntent(
      intent: VoiceIntent.showLocation,
      kannada: 'ನನ್ನ ಸ್ಥಳ ತೋರಿಸಿ',
      english: 'Show my location',
      action: 'show_location',
      parameters: {},
    ),
    'ಹಣ ಪಾವತಿ ಮಾಡಿ': VoiceCommandIntent(
      intent: VoiceIntent.makePayment,
      kannada: 'ಹಣ ಪಾವತಿ ಮಾಡಿ',
      english: 'Make payment',
      action: 'make_payment',
      parameters: {},
    ),
    'ಉಧಾರ್ ಮಾಹಿತಿ ತೋರಿಸಿ': VoiceCommandIntent(
      intent: VoiceIntent.showUdhaar,
      kannada: 'ಉಧಾರ್ ಮಾಹಿತಿ ತೋರಿಸಿ',
      english: 'Show Udhaar information',
      action: 'show_udhaar',
      parameters: {},
    ),
    'ಹವಾಮಾನ ಮಾಹಿತಿ ತೋರಿಸಿ': VoiceCommandIntent(
      intent: VoiceIntent.showWeather,
      kannada: 'ಹವಾಮಾನ ಮಾಹಿತಿ ತೋರಿಸಿ',
      english: 'Show weather information',
      action: 'show_weather',
      parameters: {},
    ),
    'ವಿವರಗಳನ್ನು ತೋರಿಸಿ': VoiceCommandIntent(
      intent: VoiceIntent.showDetails,
      kannada: 'ವಿವರಗಳನ್ನು ತೋರಿಸಿ',
      english: 'Show details',
      action: 'show_details',
      parameters: {},
    ),
    'ಹಿಂತಿರುಗಿ': VoiceCommandIntent(
      intent: VoiceIntent.goBack,
      kannada: 'ಹಿಂತಿರುಗಿ',
      english: 'Go back',
      action: 'go_back',
      parameters: {},
    ),
    'ಮುಖಪುಟ': VoiceCommandIntent(
      intent: VoiceIntent.goHome,
      kannada: 'ಮುಖಪುಟ',
      english: 'Go to home',
      action: 'go_home',
      parameters: {},
    ),
    'ಸೆಟ್ಟಿಂಗ್‍ಗಳು': VoiceCommandIntent(
      intent: VoiceIntent.openSettings,
      kannada: 'ಸೆಟ್ಟಿಂಗ್‍ಗಳು',
      english: 'Open settings',
      action: 'open_settings',
      parameters: {},
    ),
    'ಸಹಾಯ': VoiceCommandIntent(
      intent: VoiceIntent.help,
      kannada: 'ಸಹಾಯ',
      english: 'Help',
      action: 'help',
      parameters: {},
    ),
    
    // English commands
    'show my products': VoiceCommandIntent(
      intent: VoiceIntent.showProducts,
      kannada: 'ನನ್ನ ಉತ್ಪನ್ನಗಳನ್ನು ತೋರಿಸಿ',
      english: 'Show my products',
      action: 'show_products',
      parameters: {},
    ),
    'create new product': VoiceCommandIntent(
      intent: VoiceIntent.createProduct,
      kannada: 'ಹೊಸ ಉತ್ಪನ್ನ ಸೃಷ್ಟಿಸಿ',
      english: 'Create new product',
      action: 'create_product',
      parameters: {},
    ),
    'show orders': VoiceCommandIntent(
      intent: VoiceIntent.showOrders,
      kannada: 'ಆರ್ಡರ್ ಪಟ್ಟಿ ತೋರಿಸಿ',
      english: 'Show orders',
      action: 'show_orders',
      parameters: {},
    ),
    'create order': VoiceCommandIntent(
      intent: VoiceIntent.createOrder,
      kannada: 'ಹೊಸ ಆರ್ಡರ್ ಸೃಷ್ಟಿಸಿ',
      english: 'Create order',
      action: 'create_order',
      parameters: {},
    ),
    'show sales report': VoiceCommandIntent(
      intent: VoiceIntent.showSalesReport,
      kannada: 'ಮಾರಾಟ ವರದಿ ತೋರಿಸಿ',
      english: 'Show sales report',
      action: 'show_sales_report',
      parameters: {},
    ),
    'today sales': VoiceCommandIntent(
      intent: VoiceIntent.showSalesReport,
      kannada: 'ಇಂದಿನ ಮಾರಾಟ',
      english: 'Today sales',
      action: 'show_sales_report',
      parameters: {'date': 'today'},
    ),
    'optimize route': VoiceCommandIntent(
      intent: VoiceIntent.optimizeRoute,
      kannada: 'ರೂಟ್ ಆಪ್ಟಿಮೈಜ್ ಮಾಡಿ',
      english: 'Optimize route',
      action: 'optimize_route',
      parameters: {},
    ),
    'show location': VoiceCommandIntent(
      intent: VoiceIntent.showLocation,
      kannada: 'ನನ್ನ ಸ್ಥಳ ತೋರಿಸಿ',
      english: 'Show location',
      action: 'show_location',
      parameters: {},
    ),
    'make payment': VoiceCommandIntent(
      intent: VoiceIntent.makePayment,
      kannada: 'ಹಣ ಪಾವತಿ ಮಾಡಿ',
      english: 'Make payment',
      action: 'make_payment',
      parameters: {},
    ),
    'show udhaar': VoiceCommandIntent(
      intent: VoiceIntent.showUdhaar,
      kannada: 'ಉಧಾರ್ ಮಾಹಿತಿ ತೋರಿಸಿ',
      english: 'Show Udhaar',
      action: 'show_udhaar',
      parameters: {},
    ),
    'show weather': VoiceCommandIntent(
      intent: VoiceIntent.showWeather,
      kannada: 'ಹವಾಮಾನ ಮಾಹಿತಿ ತೋರಿಸಿ',
      english: 'Show weather',
      action: 'show_weather',
      parameters: {},
    ),
    'show details': VoiceCommandIntent(
      intent: VoiceIntent.showDetails,
      kannada: 'ವಿವರಗಳನ್ನು ತೋರಿಸಿ',
      english: 'Show details',
      action: 'show_details',
      parameters: {},
    ),
    'go back': VoiceCommandIntent(
      intent: VoiceIntent.goBack,
      kannada: 'ಹಿಂತಿರುಗಿ',
      english: 'Go back',
      action: 'go_back',
      parameters: {},
    ),
    'home': VoiceCommandIntent(
      intent: VoiceIntent.goHome,
      kannada: 'ಮುಖಪುಟ',
      english: 'Home',
      action: 'go_home',
      parameters: {},
    ),
    'settings': VoiceCommandIntent(
      intent: VoiceIntent.openSettings,
      kannada: 'ಸೆಟ್ಟಿಂಗ್‍ಗಳು',
      english: 'Settings',
      action: 'open_settings',
      parameters: {},
    ),
    'help': VoiceCommandIntent(
      intent: VoiceIntent.help,
      kannada: 'ಸಹಾಯ',
      english: 'Help',
      action: 'help',
      parameters: {},
    ),
  };

  VoiceCommand? process(VoiceCommand command) {
    final lowerText = command.text.toLowerCase().trim();
    
    // Check exact matches first
    for (final entry in _commandMap.entries) {
      if (entry.key.toLowerCase() == lowerText) {
        return command.copyWith(
          intent: entry.value.intent,
          action: entry.value.action,
          parameters: entry.value.parameters,
          processedText: entry.value.english,
          kannadaText: entry.value.kannada,
          confidence: 1.0,
          isRecognized: true,
        );
      }
    }
    
    // Check for partial matches
    for (final entry in _commandMap.entries) {
      if (lowerText.contains(entry.key.toLowerCase())) {
        return command.copyWith(
          intent: entry.value.intent,
          action: entry.value.action,
          parameters: entry.value.parameters,
          processedText: entry.value.english,
          kannadaText: entry.value.kannada,
          confidence: 0.8,
          isRecognized: true,
        );
      }
    }
    
    // Try to extract intent from text
    final intent = _extractIntent(lowerText);
    if (intent != null) {
      return command.copyWith(
        intent: intent,
        isRecognized: true,
        confidence: 0.7,
      );
    }
    
    // Not recognized
    return command.copyWith(
      isRecognized: false,
      confidence: 0.0,
    );
  }

  VoiceIntent? _extractIntent(String text) {
    // Check for product-related intents
    if (text.contains('product') || text.contains('ಉತ್ಪನ್ನ')) {
      if (text.contains('show') || text.contains('ತೋರಿಸಿ') || text.contains('list')) {
        return VoiceIntent.showProducts;
      } else if (text.contains('create') || text.contains('ಸೃಷ್ಟಿಸಿ') || text.contains('add') || text.contains('ಸೇರಿಸಿ')) {
        return VoiceIntent.createProduct;
      } else if (text.contains('delete') || text.contains('ಅಳಿಸಿ') || text.contains('remove')) {
        return VoiceIntent.deleteProduct;
      }
    }
    
    // Check for order-related intents
    if (text.contains('order') || text.contains('ಆರ್ಡರ್')) {
      if (text.contains('show') || text.contains('ತೋರಿಸಿ') || text.contains('list')) {
        return VoiceIntent.showOrders;
      } else if (text.contains('create') || text.contains('ಸೃಷ್ಟಿಸಿ') || text.contains('new')) {
        return VoiceIntent.createOrder;
      }
    }
    
    // Check for sales-related intents
    if (text.contains('sales') || text.contains('ಮಾರಾಟ') || text.contains('report') || text.contains('ವರದಿ')) {
      return VoiceIntent.showSalesReport;
    }
    
    // Check for route-related intents
    if (text.contains('route') || text.contains('ರೂಟ್') || text.contains('optimize') || text.contains('ಆಪ್ಟಿಮೈಜ್')) {
      return VoiceIntent.optimizeRoute;
    }
    
    // Check for location-related intents
    if (text.contains('location') || text.contains('ಸ್ಥಳ') || text.contains('where') || text.contains('ಎಲ್ಲಿ')) {
      return VoiceIntent.showLocation;
    }
    
    // Check for payment-related intents
    if (text.contains('payment') || text.contains('ಪಾವತಿ') || text.contains('pay') || text.contains('ಪಾವತಿಸಿ')) {
      return VoiceIntent.makePayment;
    }
    
    // Check for udhaar-related intents
    if (text.contains('udhaar') || text.contains('ಉಧಾರ್') || text.contains('credit') || text.contains('ಸಾಲ')) {
      return VoiceIntent.showUdhaar;
    }
    
    // Check for weather-related intents
    if (text.contains('weather') || text.contains('ಹವಾಮಾನ') || text.contains('climate')) {
      return VoiceIntent.showWeather;
    }
    
    // Check for navigation intents
    if (text.contains('back') || text.contains('ಹಿಂತಿರುಗಿ') || text.contains('go back')) {
      return VoiceIntent.goBack;
    }
    
    if (text.contains('home') || text.contains('ಮುಖಪುಟ') || text.contains('main')) {
      return VoiceIntent.goHome;
    }
    
    // Check for settings
    if (text.contains('settings') || text.contains('ಸೆಟ್ಟಿಂಗ್') || text.contains('preferences')) {
      return VoiceIntent.openSettings;
    }
    
    // Check for help
    if (text.contains('help') || text.contains('ಸಹಾಯ') || text.contains('support')) {
      return VoiceIntent.help;
    }
    
    return null;
  }
}

// Voice Intent enum
enum VoiceIntent {
  showProducts,
  createProduct,
  editProduct,
  deleteProduct,
  showOrders,
  createOrder,
  editOrder,
  showOrderDetails,
  showSalesReport,
  showDashboard,
  optimizeRoute,
  showLocation,
  makePayment,
  showUdhaar,
  showWeather,
  showDetails,
  goBack,
  goHome,
  openSettings,
  help,
  search,
  filter,
  sort,
  refresh,
  share,
  export,
  print,
  call,
  message,
  unknown,
}

// Voice Command Intent
class VoiceCommandIntent {
  final VoiceIntent intent;
  final String kannada;
  final String english;
  final String action;
  final Map<String, dynamic> parameters;

  VoiceCommandIntent({
    required this.intent,
    required this.kannada,
    required this.english,
    required this.action,
    required this.parameters,
  });
}
