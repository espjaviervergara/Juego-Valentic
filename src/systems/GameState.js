const STORAGE_KEY = 'ecos_bivalentes_v1';

const DEFAULT_PROGRESS = {
  unlockedDay: 1,
  completedDays: [],
  unlockedDiary: [],
  bestScores: {},
  settings: {
    muted: false,
    accessibleTimer: false,
    musicEnabled: true,
    voiceEnabled: true,
  },
};

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

class GameStateManager {
  constructor() {
    this.progress = this.loadProgress();
    this.dialogues = null;
    this.run = null;
  }

  loadProgress() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_PROGRESS);
      const parsed = JSON.parse(raw);
      return {
        ...structuredClone(DEFAULT_PROGRESS),
        ...parsed,
        settings: {
          ...DEFAULT_PROGRESS.settings,
          ...(parsed.settings || {}),
        },
      };
    } catch {
      return structuredClone(DEFAULT_PROGRESS);
    }
  }

  saveProgress() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch {
      // Ignorar si localStorage no está disponible en el navegador
    }
  }

  resetProgress() {
    this.progress = structuredClone(DEFAULT_PROGRESS);
    this.saveProgress();
  }

  toggleMuted() {
    this.progress.settings.muted = !this.progress.settings.muted;
    this.saveProgress();
    return this.progress.settings.muted;
  }

  toggleMusic() {
    this.progress.settings.musicEnabled = !this.progress.settings.musicEnabled;
    this.saveProgress();
    return this.progress.settings.musicEnabled;
  }

  toggleVoice() {
    this.progress.settings.voiceEnabled = !this.progress.settings.voiceEnabled;
    this.saveProgress();
    return this.progress.settings.voiceEnabled;
  }

  toggleAccessibleTimer() {
    this.progress.settings.accessibleTimer = !this.progress.settings.accessibleTimer;
    this.saveProgress();
    return this.progress.settings.accessibleTimer;
  }

  getShadowTimerSeconds() {
    return this.progress.settings.accessibleTimer ? 12 : 7;
  }

  startDay(dayNumber) {
    this.run = {
      day: dayNumber,
      sceneIndex: 0,
      clima: 100,
      tension: 0,
      vinculos: 3,
      autocuidado: 0,
      humorLatente: 0,
      shadowState: 'hostil', // 'hostil' | 'neutra' | 'protectora'
      stats: {
        decoderHits: 0,
        decoderMisses: 0,
        shadowTransmutations: 0,
        shadowSlips: 0,
        cnvPerfect: 0,
        cnvErrors: 0,
        reactions: [],
      },
      lastSceneOutcome: null,
    };
  }

  recordReaction(phase, reactionTimeSec, success, label) {
    if (!this.run) return;
    this.run.stats.reactions.push({
      phase,
      reactionTimeSec: Number(reactionTimeSec.toFixed(2)),
      success,
      label,
    });
  }

  applyDecoder(isCorrect, reactionTimeSec = 2.5) {
    if (!this.run) return;
    if (isCorrect) {
      this.run.clima = clamp(this.run.clima + 10, 0, 100);
      this.run.autocuidado += 1;
      this.run.stats.decoderHits += 1;
    } else {
      this.run.tension = clamp(this.run.tension + 10, 0, 100);
      this.run.stats.decoderMisses += 1;
    }
    this.recordReaction('Descodificador', reactionTimeSec, isCorrect, isCorrect ? 'Empatía' : 'Error lectura');
  }

  applyEmergencyPause() {
    if (!this.run) return;
    this.run.autocuidado += 1;
    this.run.tension = clamp(this.run.tension + 5, 0, 100);
  }

  applyShadow(transmuted, spentEnergy, reactionTimeSec = 3.0) {
    if (!this.run) return;
    if (transmuted) {
      if (spentEnergy && this.run.autocuidado > 0) {
        this.run.autocuidado -= 1;
      }
      this.run.clima = clamp(this.run.clima + 15, 0, 100);
      this.run.tension = clamp(this.run.tension - 15, 0, 100);
      this.run.stats.shadowTransmutations += 1;
      this.run.shadowState = this.run.stats.shadowTransmutations >= 2 ? 'protectora' : 'neutra';
    } else {
      this.run.clima = clamp(this.run.clima - 20, 0, 100);
      this.run.tension = clamp(this.run.tension + 20, 0, 100);
      this.run.stats.shadowSlips += 1;
      this.run.shadowState = 'hostil';
      this.run.humorLatente += 10;
    }
    this.recordReaction('Sombra', reactionTimeSec, transmuted, transmuted ? 'Transmutada' : 'Impulso');
  }

  applyCNV(isClean, reactionTimeSec = 4.0) {
    if (!this.run) return;
    if (isClean) {
      this.run.clima = clamp(this.run.clima + 25, 0, 100);
      this.run.tension = clamp(this.run.tension - 10, 0, 100);
      this.run.stats.cnvPerfect += 1;
    } else {
      this.run.clima = clamp(this.run.clima - 15, 0, 100);
      this.run.tension = clamp(this.run.tension + 15, 0, 100);
      this.run.stats.cnvErrors += 1;
      this.run.humorLatente += 10;
    }
    this.recordReaction('CNV', reactionTimeSec, isClean, isClean ? 'Asertiva' : 'Acusatoria');
  }

  applyLatentCarryover() {
    // Ingeniería STEAM: la tensión acumulada en casa afecta la entrada al siguiente entorno
    if (!this.run || this.run.humorLatente <= 0) return 0;
    const penalty = Math.min(15, this.run.humorLatente);
    this.run.tension = clamp(this.run.tension + penalty, 0, 100);
    this.run.humorLatente = 0;
    return penalty;
  }

  checkBreakdown() {
    if (!this.run) return { broken: false, dayFailed: false };
    if (this.run.tension >= 100 || this.run.clima <= 0) {
      this.run.vinculos -= 1;
      if (this.run.vinculos <= 0) {
        return { broken: true, dayFailed: true };
      }
      // Reinicio parcial de la escena crítica manteniendo aprendizaje
      this.run.clima = 70;
      this.run.tension = 30;
      return { broken: true, dayFailed: false };
    }
    return { broken: false, dayFailed: false };
  }

  isDayVictory() {
    if (!this.run) return false;
    return this.run.clima > 60 && this.run.stats.shadowTransmutations >= 1;
  }

  completeCurrentDay() {
    if (!this.run || !this.isDayVictory()) return false;
    const d = this.run.day;
    if (!this.progress.completedDays.includes(d)) {
      this.progress.completedDays.push(d);
    }
    if (!this.progress.unlockedDiary.includes(d)) {
      this.progress.unlockedDiary.push(d);
    }
    if (d < 5 && this.progress.unlockedDay < d + 1) {
      this.progress.unlockedDay = d + 1;
    }
    const prevBest = this.progress.bestScores[d];
    if (!prevBest || this.run.clima > prevBest.clima) {
      this.progress.bestScores[d] = {
        clima: this.run.clima,
        tension: this.run.tension,
        transmutaciones: this.run.stats.shadowTransmutations,
      };
    }
    this.saveProgress();
    return true;
  }
}

export const gameState = new GameStateManager();
