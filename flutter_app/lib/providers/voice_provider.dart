import 'package:flutter/material.dart';
import 'package:vendor_saathi/services/api_service.dart';
import 'package:vendor_saathi/services/voice_service.dart';

class VoiceProvider with ChangeNotifier {
  final VoiceService _voiceService = VoiceService();
  final ApiService _api = ApiService();

  bool _isListening = false;
  String _lastTranscript = '';
  String _lastResponseKannada = '';
  String _lastResponseEnglish = '';
  String _language = 'kn_IN';

  bool get isListening => _isListening;
  String get lastTranscript => _lastTranscript;
  String get lastResponseKannada => _lastResponseKannada;
  String get lastResponseEnglish => _lastResponseEnglish;
  String get language => _language;

  void toggleLanguage() {
    _language = _language == 'kn_IN' ? 'en_IN' : 'kn_IN';
    notifyListeners();
  }

  Future<Map<String, dynamic>?> executeTranscript(String transcript) async {
    _lastTranscript = transcript;
    notifyListeners();
    try {
      final response = await _api.post<Map<String, dynamic>>(
        '/voice/execute',
        data: {'transcript': transcript, 'execute': true},
        fromJson: (json) => Map<String, dynamic>.from(json),
      );
      if (response.success && response.data != null) {
        _lastResponseKannada = response.data!['responseKannada'] ?? '';
        _lastResponseEnglish = response.data!['responseEnglish'] ?? '';
        final spoken = _language.startsWith('kn')
            ? _lastResponseKannada
            : _lastResponseEnglish;
        await _voiceService.speak(spoken);
        notifyListeners();
        return response.data;
      }
    } catch (_) {}
    return null;
  }

  Future<void> startListening() async {
    _isListening = true;
    notifyListeners();
    await _voiceService.startListening(
      onResult: (recognized) async {
        _isListening = false;
        await executeTranscript(recognized);
      },
    );
  }

  Future<void> stopListening() async {
    await _voiceService.stopListening();
    _isListening = false;
    notifyListeners();
  }
}
