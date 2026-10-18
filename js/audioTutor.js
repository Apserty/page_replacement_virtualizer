/**
 * Audio Tutor — Page Replacement Explainer
 * 
 * Web Speech API Controller for pedagogical voice narration
 * Principles of Operating Systems Project
 */

export class AudioTutor {
  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.synth = this.isSupported ? window.speechSynthesis : null;
    
    this.voices = [];
    this.selectedVoiceIndex = 0;
    this.hasUserManuallySelectedVoice = false;
    this.rate = 1.0; // Default speaking rate at 1.0x
    this.pitch = 1.0; // Comfortable pitch near 1.0
    this.isMuted = false;
    
    this.status = 'ready'; // 'ready' | 'speaking' | 'paused' | 'stopped' | 'muted' | 'unsupported'
    this.currentText = '';
    this.currentUtterance = null;
    this.activeStepIndex = -1;
    
    // Narrate-all state
    this.isNarratingAll = false;
    this.narrateAllSteps = [];
    this.narrateAllCurrentIndex = 0;
    this.narrateAllCallback = null;
    this.narrateAllCompleteCallback = null;

    this.onStateChangeCallbacks = new Set();
    
    if (this.isSupported) {
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    } else {
      this.status = 'unsupported';
    }
  }

  /**
   * Registers a listener for tutor state changes (speaking, paused, stopped, voice, etc.)
   * @param {Function} cb
   */
  subscribe(cb) {
    if (typeof cb === 'function') {
      this.onStateChangeCallbacks.add(cb);
      // Immediately notify of current state
      cb(this.getState());
    }
    return () => this.onStateChangeCallbacks.delete(cb);
  }

  notifyStateChange() {
    const state = this.getState();
    this.onStateChangeCallbacks.forEach(cb => {
      try { cb(state); } catch (e) { console.error('AudioTutor callback error:', e); }
    });
  }

  getState() {
    return {
      isSupported: this.isSupported,
      status: this.isMuted ? 'muted' : this.status,
      isSpeaking: this.status === 'speaking',
      isPaused: this.status === 'paused',
      isMuted: this.isMuted,
      rate: this.rate,
      pitch: this.pitch,
      voices: this.voices,
      selectedVoiceIndex: this.selectedVoiceIndex,
      currentText: this.currentText,
      activeStepIndex: this.activeStepIndex,
      isNarratingAll: this.isNarratingAll,
      narrateAllCurrentIndex: this.narrateAllCurrentIndex
    };
  }

  /**
   * Selects the best available English voice following the priority order:
   * 1. A clear natural English voice available in the browser
   * 2. Prefer en-IN for Indian English educational presentation
   * 3. Otherwise en-US or en-GB
   * 
   * @param {SpeechSynthesisVoice[]} voices
   * @returns {number} Selected index
   */
  findBestEnglishVoice(voices) {
    if (!voices || voices.length === 0) return 0;
    const normLang = v => (v.lang || '').toLowerCase().replace('_', '-');

    // 1. Top priority: "Microsoft Neerja Online (Natural) - English (India)" (en-IN)
    const neerjaIndex = voices.findIndex(v => {
      const name = (v.name || '').toLowerCase();
      return name.includes('neerja');
    });
    if (neerjaIndex !== -1) return neerjaIndex;

    // 2. Next: any other en-IN (Indian English) voice when available
    const enInIndex = voices.findIndex(v => normLang(v) === 'en-in' || normLang(v).startsWith('en-in'));
    if (enInIndex !== -1) return enInIndex;

    // 2. High-quality natural English voice in en-US or en-GB
    const naturalEnIndex = voices.findIndex(v => {
      const lang = normLang(v);
      const name = (v.name || '').toLowerCase();
      return lang.startsWith('en') && (
        name.includes('natural') || name.includes('google') || name.includes('neural') ||
        name.includes('samantha') || name.includes('daniel') || name.includes('david') ||
        name.includes('karen') || name.includes('rishi') || name.includes('veena') || name.includes('heera')
      );
    });
    if (naturalEnIndex !== -1) return naturalEnIndex;

    // 3. Any en-US or en-GB voice
    const standardEnIndex = voices.findIndex(v => {
      const lang = normLang(v);
      return lang === 'en-us' || lang === 'en-gb';
    });
    if (standardEnIndex !== -1) return standardEnIndex;

    // 4. Any English voice
    const anyEnIndex = voices.findIndex(v => normLang(v).startsWith('en'));
    if (anyEnIndex !== -1) return anyEnIndex;

    return 0;
  }

  /**
   * Loads browser voices and dynamically applies the priority selection
   */
  loadVoices() {
    if (!this.isSupported || !this.synth) return;
    const available = this.synth.getVoices() || [];
    this.voices = available;

    if (this.voices.length > 0 && !this.hasUserManuallySelectedVoice) {
      this.selectedVoiceIndex = this.findBestEnglishVoice(this.voices);
    }
    this.notifyStateChange();
  }

  setVoice(index) {
    const idx = Number(index);
    if (!isNaN(idx) && idx >= 0 && idx < this.voices.length) {
      this.selectedVoiceIndex = idx;
      this.hasUserManuallySelectedVoice = true;
      this.notifyStateChange();
    }
  }

  setRate(rate) {
    const r = parseFloat(rate);
    if (!isNaN(r) && r >= 0.5 && r <= 2.0) {
      this.rate = r;
      this.notifyStateChange();
    }
  }

  setPitch(pitch) {
    const p = parseFloat(pitch);
    if (!isNaN(p) && p >= 0.5 && p <= 2.0) {
      this.pitch = p;
      this.notifyStateChange();
    }
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    if (this.isMuted && this.status === 'speaking') {
      this.stop();
    }
    this.notifyStateChange();
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Speaks an explanation text string.
   * Cancels any prior active speech cleanly before beginning.
   * 
   * @param {string} text - Educational spoken text to speak.
   * @param {Object} [options]
   * @param {number} [options.stepIndex] - Step index this explanation belongs to.
   * @param {Function} [options.onStart] - Callback when speech begins.
   * @param {Function} [options.onEnd] - Callback when speech ends normally.
   * @param {Function} [options.onError] - Callback on error.
   */
  speak(text, options = {}) {
    this.stopSpeakingOnly();

    if (!text || typeof text !== 'string') return;
    this.currentText = text;
    this.activeStepIndex = options.stepIndex ?? -1;

    if (!this.isSupported) {
      this.status = 'unsupported';
      this.notifyStateChange();
      if (options.onStart) options.onStart();
      if (options.onEnd) options.onEnd();
      return;
    }

    if (this.isMuted) {
      this.status = 'muted';
      this.notifyStateChange();
      if (options.onStart) options.onStart();
      if (options.onEnd) {
        // Fast completion for muted playback so timers advance naturally
        const mockDuration = Math.min(Math.max(text.length * 15, 600), 2000);
        setTimeout(options.onEnd, mockDuration);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voices[this.selectedVoiceIndex]) {
      utterance.voice = this.voices[this.selectedVoiceIndex];
    }
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = 1.0;

    this.currentUtterance = utterance;

    utterance.onstart = () => {
      this.status = 'speaking';
      this.notifyStateChange();
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      if (this.currentUtterance === utterance) {
        this.status = 'stopped';
        this.currentUtterance = null;
        this.notifyStateChange();
      }
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      // 'interrupted' or 'canceled' are common when user clicks next step or stop
      if (this.currentUtterance === utterance) {
        this.status = 'stopped';
        this.currentUtterance = null;
        this.notifyStateChange();
      }
      if (options.onError) options.onError(e);
      else if (options.onEnd) options.onEnd();
    };

    this.synth.speak(utterance);
  }

  /**
   * Pauses active narration
   */
  pause() {
    if (!this.isSupported || !this.synth) return;
    if (this.status === 'speaking') {
      try {
        this.synth.pause();
        this.status = 'paused';
        this.notifyStateChange();
      } catch (e) {
        console.warn('SpeechSynthesis pause error:', e);
      }
    }
  }

  /**
   * Resumes paused narration
   */
  resume() {
    if (!this.isSupported || !this.synth) return;
    if (this.status === 'paused') {
      try {
        this.synth.resume();
        this.status = 'speaking';
        this.notifyStateChange();
      } catch (e) {
        console.warn('SpeechSynthesis resume error:', e);
      }
    }
  }

  /**
   * Stops active speech utterance without canceling full narration sequence if narrating all
   */
  stopSpeakingOnly() {
    if (this.currentUtterance) {
      this.currentUtterance.onend = null;
      this.currentUtterance.onerror = null;
    }
    if (this.isSupported && this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        console.warn('SpeechSynthesis cancel error:', e);
      }
    }
    this.currentUtterance = null;
  }

  /**
   * Stops all active narration, clears queue, resets status
   */
  stop() {
    this.isNarratingAll = false;
    this.narrateAllSteps = [];
    this.narrateAllCurrentIndex = 0;
    this.narrateAllCallback = null;
    this.narrateAllCompleteCallback = null;

    this.stopSpeakingOnly();
    this.status = 'stopped';
    this.notifyStateChange();
  }

  /**
   * Replays the currently displayed explanation from the beginning
   */
  replay() {
    if (this.currentText) {
      this.speak(this.currentText, { stepIndex: this.activeStepIndex });
    }
  }

  /**
   * Reads all stored simulation step explanations in sequence without re-animating or running the simulation.
   * 
   * @param {Array<Object>} steps - Stored step objects
   * @param {Function} [onStepStart] - Called when a new step's narration begins
   * @param {Function} [onComplete] - Called when all steps finish
   */
  narrateAll(steps, onStepStart = null, onComplete = null) {
    if (!steps || steps.length === 0) return;

    this.stop();
    this.isNarratingAll = true;
    this.narrateAllSteps = steps;
    this.narrateAllCurrentIndex = 0;
    this.narrateAllCallback = onStepStart;
    this.narrateAllCompleteCallback = onComplete;

    this.playNextInNarrateAll();
  }

  playNextInNarrateAll() {
    if (!this.isNarratingAll) return;

    if (this.narrateAllCurrentIndex >= this.narrateAllSteps.length) {
      this.isNarratingAll = false;
      this.status = 'stopped';
      this.notifyStateChange();
      if (this.narrateAllCompleteCallback) {
        this.narrateAllCompleteCallback();
      }
      return;
    }

    const currentStep = this.narrateAllSteps[this.narrateAllCurrentIndex];
    const stepNumber = this.narrateAllCurrentIndex + 1;
    this.activeStepIndex = this.narrateAllCurrentIndex;

    if (this.narrateAllCallback) {
      this.narrateAllCallback(this.narrateAllCurrentIndex, currentStep);
    }

    const textToSpeak = currentStep.audioNarration || currentStep.explanation || `Step ${stepNumber}: Page ${currentStep.page}`;

    this.speak(textToSpeak, {
      stepIndex: this.narrateAllCurrentIndex,
      onEnd: () => {
        if (!this.isNarratingAll) return;
        this.narrateAllCurrentIndex++;
        setTimeout(() => {
          if (this.isNarratingAll) {
            this.playNextInNarrateAll();
          }
        }, 500);
      },
      onError: () => {
        if (!this.isNarratingAll) return;
        this.narrateAllCurrentIndex++;
        setTimeout(() => {
          if (this.isNarratingAll) {
            this.playNextInNarrateAll();
          }
        }, 300);
      }
    });
  }
}

// Export singleton instance for unified access across components
export const audioTutor = new AudioTutor();
