import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TtsService {
  private synth = window.speechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  
  isSpeaking = signal(false);

  // Deteksi karakter Jepang
  private jpRegex = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    this.voices = this.synth.getVoices();
  }

  /**
   * Ucapkan teks biasa. Untuk kanji/vocab gunakan speakWord() agar pelafalan tepat.
   */
  speak(text: string, defaultLang: 'id-ID' | 'ja-JP' = 'id-ID') {
    if (!text) return;
    this.cancel();
    
    let processedText = text;
    const blankPattern = /([_＿\s　★☆]*[_＿]+[_＿\s　★☆]*)/g;
    processedText = processedText.replace(blankPattern, ' ... ');
    if (defaultLang === 'id-ID') {
      processedText = processedText.replace(/\//g, ' atau ');
    }

    const segments = this.segmentText(processedText, defaultLang);
    segments.forEach((seg, index) => {
      const utterance = new SpeechSynthesisUtterance(seg.text);
      utterance.lang = seg.lang;
      utterance.rate = seg.lang === 'ja-JP' ? 0.85 : 0.9;
      const voice = this.getBestVoice(seg.lang);
      if (voice) utterance.voice = voice;
      if (index === 0) utterance.onstart = () => this.isSpeaking.set(true);
      if (index === segments.length - 1) {
        utterance.onend = () => this.isSpeaking.set(false);
        utterance.onerror = () => this.isSpeaking.set(false);
      }
      this.synth.speak(utterance);
    });
  }

  /**
   * Ucapkan sebuah kata Jepang menggunakan KANA (hiragana/katakana) sebagai prioritas.
   * Ini mencegah TTS membaca kanji dengan kunyomi yang salah konteks.
   * 
   * @param kanji  Teks asli (boleh berupa kanji)
   * @param kana   Bacaan kana yang benar (hiragana/katakana)
   */
  speakWord(kanji: string, kana?: string) {
    if (!kanji && !kana) return;
    // Gunakan kana jika tersedia, karena kana PASTI dibaca sesuai pelafalan
    const textToSpeak = kana || kanji;
    this.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;
    const voice = this.getBestVoice('ja-JP');
    if (voice) utterance.voice = voice;
    utterance.onstart = () => this.isSpeaking.set(true);
    utterance.onend = () => this.isSpeaking.set(false);
    utterance.onerror = () => this.isSpeaking.set(false);
    this.synth.speak(utterance);
  }

  /**
   * Ucapkan kalimat Jepang dari data contoh.
   * Jika romaji tersedia, gunakan romaji untuk memastikan TTS membaca dengan benar.
   * 
   * @param japanese  Kalimat Jepang asli (untuk diucapkan penuh)
   * @param romaji    Romaji kalimat (opsional, untuk fallback kecepatan konsisten)
   */
  speakSentence(japanese: string, _romaji?: string) {
    if (!japanese) return;
    // Ucapkan kalimat Jepang langsung - TTS ja-JP membaca hiragana/kanji dengan benar dalam konteks kalimat
    this.speak(japanese, 'ja-JP');
  }

  cancel() {
    if (this.synth.speaking) {
      this.synth.cancel();
      this.isSpeaking.set(false);
    }
  }

  private segmentText(text: string, baseLang: string): { text: string, lang: string }[] {
    const segments: { text: string, lang: string }[] = [];
    let currentText = '';
    let currentIsJp = false;

    const isJpChar = (char: string) => this.jpRegex.test(char);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const isJp = isJpChar(char);

      if (i === 0) {
        currentIsJp = isJp;
        currentText += char;
        continue;
      }

      const charCode = char.charCodeAt(0);
      const isNeutral = (charCode >= 0 && charCode <= 64) || 
                        (charCode >= 91 && charCode <= 96) || 
                        (charCode >= 123 && charCode <= 126);

      if (isNeutral) {
        currentText += char;
      } else {
        if (isJp !== currentIsJp) {
          segments.push({ text: currentText, lang: currentIsJp ? 'ja-JP' : baseLang });
          currentText = char;
          currentIsJp = isJp;
        } else {
          currentText += char;
        }
      }
    }

    if (currentText.length > 0) {
      segments.push({ text: currentText, lang: currentIsJp ? 'ja-JP' : baseLang });
    }

    return segments;
  }

  private getBestVoice(lang: string): SpeechSynthesisVoice | null {
    const available = this.voices.filter(v => v.lang.replace('_', '-').includes(lang));
    if (available.length === 0) return null;
    let best = available.find(v => v.name.includes('Google'));
    if (!best) best = available.find(v => v.name.includes('Microsoft'));
    if (!best) best = available.find(v => v.name.includes('Siri') || v.name.includes('Kyoko') || v.name.includes('Damayanti'));
    return best || available[0];
  }
}
