import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vendor_saathi/providers/voice_provider.dart';

class VoiceCommandScreen extends StatefulWidget {
  const VoiceCommandScreen({super.key});

  @override
  State<VoiceCommandScreen> createState() => _VoiceCommandScreenState();
}

class _VoiceCommandScreenState extends State<VoiceCommandScreen> {
  final _textCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final voice = context.watch<VoiceProvider>();
    const samples = [
      '2 ಕೆಜಿ ಟೊಮ್ಯಾಟೋ ಬಿಲ್ ಮಾಡಿ',
      '15 ಕೆಜಿ ಬಾಸ್ಮತಿ ಅಕ್ಕಿ ಸ್ಟಾಕ್ ಸೇರಿಸಿ',
      'ಇಂದಿನ ಮಾರಾಟ ವರದಿ ತೋರಿಸಿ',
      'ಒಟ್ಟು ಉದಾರ್ ಬಾಕಿ ಎಷ್ಟಿದೆ?',
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Kannada & English Voice AI'),
        actions: [
          TextButton(
            onPressed: voice.toggleLanguage,
            child: Text(voice.language.startsWith('kn') ? 'ಕನ್ನಡ' : 'English'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: GestureDetector(
              onTap: voice.isListening ? voice.stopListening : voice.startListening,
              child: CircleAvatar(
                radius: 44,
                backgroundColor: voice.isListening ? Colors.red : const Color(0xFF059669),
                child: Icon(voice.isListening ? Icons.stop : Icons.mic, size: 38, color: Colors.white),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _textCtrl,
                  decoration: const InputDecoration(
                    hintText: 'Or type Kannada / English command...',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: () => voice.executeTranscript(_textCtrl.text),
                child: const Text('Run'),
              ),
            ],
          ),
          if (voice.lastResponseKannada.isNotEmpty) ...[
            const SizedBox(height: 20),
            Card(
              color: Colors.green.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(voice.lastResponseKannada, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 6),
                    Text(voice.lastResponseEnglish),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 20),
          const Text('Quick Voice Commands:', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...samples.map(
            (s) => Card(
              child: ListTile(
                leading: const Icon(Icons.record_voice_over, color: Color(0xFF059669)),
                title: Text(s),
                onTap: () => voice.executeTranscript(s),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
