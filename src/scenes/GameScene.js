import { gameState } from '../systems/GameState.js';
import { soundManager } from '../systems/SoundManager.js';
import { HUD } from '../ui/HUD.js';
import { SemaforoWidget } from '../ui/Semaforo.js';
import { createPixelButton, drawPanel, shuffleArray } from '../ui/UIHelpers.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const { width, height } = this.scale;
    soundManager.attachPhaser(this);
    this.events.once('shutdown', () => soundManager.stopVoice());

    const run = gameState.run;
    if (!run) {
      gameState.startDay(1);
    }

    this.dayData = gameState.dialogues.days.find((d) => d.day === gameState.run.day)
      || gameState.dialogues.days[0];
    this.sceneData = this.dayData.scenes[gameState.run.sceneIndex];
    this.sceneBgmKey = (this.sceneData.bgKey === 'bg_hogar' || this.sceneData.bgKey === 'bg_cuarto')
      ? 'bgm_hogar'
      : 'bgm_colegio';
    soundManager.playBGM(this.sceneBgmKey);

    // Fondo unificado con tinte de horario/ambiente
    this.bgImage = this.add.image(width / 2, height / 2, this.sceneData.bgKey).setDisplaySize(width, height);
    if (this.sceneData.bgTint && this.sceneData.bgTint !== '0xffffff') {
      this.bgImage.setTint(Number(this.sceneData.bgTint));
    }
    this.add.rectangle(width / 2, height / 2, width, height, 0x050811, 0.16);

    // Personajes en escena
    this.shadowSprite = this.add.image(96, 362, 'sombra_hostil').setOrigin(0.5, 1).setScale(0.9);
    this.alexSprite = this.add.image(204, 366, 'alex_tense').setOrigin(0.5, 1).setScale(0.94);

    if (this.sceneData.characterKey === 'sombra_hostil') {
      this.interlocutorSprite = this.add.image(760, 362, 'sombra_hostil').setOrigin(0.5, 1).setScale(1.05);
      this.shadowSprite.setVisible(false);
    } else {
      this.interlocutorSprite = this.add.image(760, 366, this.sceneData.characterKey).setOrigin(0.5, 1).setScale(0.95);
    }

    // Viñeta roja para momentos críticos
    this.alertOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0xdc2626, 0).setDepth(20);

    // HUD y Semáforo de Valentic
    this.hud = new HUD(this, {
      onOpenDiary: () => {
        this.scene.pause();
        this.scene.launch('DiaryScene', {
          returnTo: 'GameScene',
          isOverlay: true,
          day: gameState.run.day,
        });
      },
      onBackMenu: () => {
        this.scene.start('MenuScene');
      },
    });
    this.hud.setSceneMeta(
      this.dayData.dayName,
      this.sceneData.locationLabel,
      gameState.run.sceneIndex,
      this.dayData.scenes.length
    );

    this.semaforo = new SemaforoWidget(this, 442, 18);

    // Caja de diálogo inferior fija para narrativa y provocación
    this.dialogueGroup = this.add.container(0, 0).setDepth(25);
    this.dialoguePanel = drawPanel(this, 18, 356, width - 36, 170, 0x0f172a, 0.94, 0x64748b);
    this.speakerBadge = drawPanel(this, 32, 336, 260, 32, 0x1e3a8a, 1, 0x93c5fd);
    this.speakerText = this.add.text(46, 352, 'Narrador', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    this.dialogueText = this.add.text(42, 382, '', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '17px',
      color: '#f8fafc',
      wordWrap: { width: width - 90 },
      lineSpacing: 6,
    });

    this.replayBtn = createPixelButton(this, width - 270, 492, 122, 36, '▶ Repetir voz', {
      fillColor: 0x0f766e,
      hoverColor: 0x0d9488,
      borderColor: 0x99f6e4,
      fontSize: '13px',
      onClick: () => soundManager.replayLastVoice(),
    });

    this.nextBtn = createPixelButton(this, width - 118, 492, 160, 36, 'Continuar ▸', {
      fillColor: 0x2563eb,
      hoverColor: 0x3b82f6,
      onClick: () => this.advanceNarrative(),
    });

    this.dialogueGroup.add([
      this.dialoguePanel,
      this.speakerBadge,
      this.speakerText,
      this.dialogueText,
      this.replayBtn,
      this.nextBtn,
    ]);

    // Contenedor modal para las fases interactivas del SRC
    this.phaseLayer = this.add.container(0, 0).setDepth(28);

    // Estado de fase actual
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.holdActive = false;
    this.breathProgress = 0;
    this.shadowTimerActive = false;
    this.shadowTimeRemaining = 0;
    this.shadowTimeTotal = 7;
    this.lastTickSecond = -1;
    this.phaseStartMs = performance.now();

    // Efecto de Humor Latente STEAM al pasar de casa al colegio
    if (gameState.run.sceneIndex > 0) {
      const carryover = gameState.applyLatentCarryover();
      if (carryover > 0) {
        this.showCarryoverToast(carryover);
      }
    }

    this.refreshCharactersVisual();
    this.hud.refresh();

    const sid = this.sceneData.id;
    this.narrativeQueue = [
      ...this.sceneData.introLines.map((line, idx) => ({
        speaker: 'Situación',
        text: line,
        isProvocation: false,
        voiceKey: `${sid}_intro_${idx}`,
      })),
      {
        speaker: this.sceneData.provocation.speaker,
        text: this.sceneData.provocation.text,
        isProvocation: true,
        voiceKey: `${sid}_prov`,
      },
    ];
    this.narrativeIndex = -1;
    this.advanceNarrative();
  }

  showCarryoverToast(penalty) {
    const toast = this.add.container(480, 114).setDepth(40);
    toast.add(drawPanel(this, -250, -18, 500, 36, 0x7f1d1d, 0.94, 0xfca5a5));
    toast.add(this.add.text(0, 0, `⚙ Sistema Dinámico (STEAM): Tensión previa del hogar (+${penalty}% Tensión)`, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fecaca',
    }).setOrigin(0.5));
    this.time.delayedCall(3400, () => toast.destroy());
  }

  refreshCharactersVisual() {
    const run = gameState.run;
    if (!run) return;
    const isTense = run.tension >= 30 || run.shadowState === 'hostil';
    this.alexSprite.setTexture(isTense ? 'alex_tense' : 'alex_calm');

    if (run.shadowState === 'protectora') {
      this.shadowSprite.setTexture('sombra_protectora').setAlpha(0.95);
      if (this.sceneData.characterKey === 'sombra_hostil') {
        this.interlocutorSprite.setTexture('sombra_protectora');
      }
    } else if (run.shadowState === 'neutra') {
      this.shadowSprite.setTexture('sombra_hostil').setAlpha(0.45).setTint(0x93c5fd);
    } else {
      this.shadowSprite.setTexture('sombra_hostil').setAlpha(0.88).clearTint();
    }
  }

  clearPhaseLayer() {
    this.holdActive = false;
    this.shadowTimerActive = false;
    this.phaseLayer.removeAll(true);
  }

  advanceNarrative() {
    this.narrativeIndex += 1;
    if (this.narrativeIndex >= this.narrativeQueue.length) {
      this.startRedPausePhase();
      return;
    }

    const item = this.narrativeQueue[this.narrativeIndex];
    this.speakerText.setText(item.speaker);
    this.dialogueText.setText(item.text);
    soundManager.playVoice(item.voiceKey);

    if (item.isProvocation) {
      soundManager.playAlert();
      this.semaforo.setState('red', '¡Detente antes de reaccionar!');
      this.dialogueText.setColor('#fecaca');
      this.tweens.add({
        targets: this.alertOverlay,
        alpha: 0.24,
        duration: 280,
        yoyo: true,
        repeat: 1,
      });
      this.nextBtn.setLabel('Activar Pausa ▸');
    } else {
      this.semaforo.setState(null, 'Observando contexto...');
      this.dialogueText.setColor('#f8fafc');
      this.nextBtn.setLabel('Continuar ▸');
    }
  }

  // ==========================================================
  // FASE 1 — LUZ ROJA (¡ALTO! · Pausa Activa Somática)
  // ==========================================================
  startRedPausePhase() {
    this.dialogueGroup.setVisible(false);
    this.clearPhaseLayer();
    this.semaforo.setState('red', 'LUZ ROJA: ¡ALTO!');
    soundManager.playVoice('valentic_red');
    this.alertOverlay.setAlpha(0.18);
    this.breathProgress = 0;

    const { width } = this.scale;
    this.phaseLayer.add(drawPanel(this, 44, 108, width - 88, 408, 0x0f172a, 0.96, 0xef4444));

    // Valentic guía el semáforo en rojo
    this.phaseLayer.add(this.add.image(154, 342, 'valentic').setScale(1.38));

    this.phaseLayer.add(this.add.text(276, 134, 'FASE 1 · LUZ ROJA: ¡ALTO Y RESPIRA!', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#fca5a5',
    }));

    this.phaseLayer.add(this.add.text(276, 168, `Provocación: ${this.sceneData.provocation.text}`, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '14px',
      fontStyle: 'italic',
      color: '#e2e8f0',
      wordWrap: { width: 590 },
    }));

    // Caja de Ciencia STEAM
    this.phaseLayer.add(drawPanel(this, 276, 222, 594, 72, 0x172554, 1, 0x38bdf8));
    this.phaseLayer.add(this.add.text(292, 234, `🧠 ${this.sceneData.pauseTip.scienceNote}`, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      color: '#bae6fd',
      wordWrap: { width: 562 },
    }));

    // Círculo expansivo de respiración
    this.breathRing = this.add.circle(420, 368, 28, 0x38bdf8, 0.25).setStrokeStyle(3, 0x38bdf8);
    this.breathStatus = this.add.text(490, 344, 'Mantén presionado el botón o la tecla ESPACIO (3s)', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#f8fafc',
      wordWrap: { width: 380 },
    });

    const barTrack = this.add.rectangle(490, 388, 340, 20, 0x1e293b).setOrigin(0, 0.5).setStrokeStyle(1.5, 0x64748b);
    this.breathBar = this.add.rectangle(492, 388, 2, 16, 0x38bdf8).setOrigin(0, 0.5);

    this.phaseLayer.add([this.breathRing, this.breathStatus, barTrack, this.breathBar]);

    // Botón táctil/ratón de mantener presionado
    const holdBg = this.add.rectangle(575, 456, 360, 48, 0xdc2626).setStrokeStyle(2, 0xfca5a5);
    holdBg.setInteractive({ useHandCursor: true });
    const holdTxt = this.add.text(575, 456, 'MANTÉN PARA RESPIRAR (O ESPACIO)', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    holdBg.on('pointerdown', () => {
      if (!this.holdActive) soundManager.playBreatheIn();
      this.holdActive = true;
      holdBg.setFillStyle(0x0284c7);
    });
    const release = () => {
      this.holdActive = false;
      holdBg.setFillStyle(0xdc2626);
    };
    holdBg.on('pointerup', release);
    holdBg.on('pointerout', release);

    this.phaseLayer.add([holdBg, holdTxt]);
    this.activePhase = 'RED_PAUSE';
  }

  // ==========================================================
  // FASE 2A — LUZ AMARILLA (¡PENSAR! · Descodificador)
  // ==========================================================
  startDecoderPhase() {
    this.clearPhaseLayer();
    this.activePhase = 'YELLOW_DECODER';
    this.phaseStartMs = performance.now();
    this.alertOverlay.setAlpha(0);
    this.semaforo.setState('yellow', 'AMARILLO: Descodifica');
    soundManager.playVoice('valentic_yellow');

    const { width } = this.scale;
    this.phaseLayer.add(drawPanel(this, 44, 108, width - 88, 408, 0x0f172a, 0.96, 0xf59e0b));
    this.phaseLayer.add(this.add.image(154, 342, 'valentic').setScale(1.38));

    this.phaseLayer.add(this.add.text(276, 134, 'FASE 2A · LUZ AMARILLA: DESCODIFICADOR DE HOSTILIDAD', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#fcd34d',
    }));

    this.phaseLayer.add(this.add.text(276, 166, `🔍 ${this.sceneData.decoder.prompt}`, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#f8fafc',
      wordWrap: { width: 590 },
    }));

    const options = shuffleArray(this.sceneData.decoder.options);
    const feedbackText = this.add.text(276, 424, '', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#fde68a',
      wordWrap: { width: 590 },
    });
    this.phaseLayer.add(feedbackText);

    let answered = false;
    const optionBtns = [];

    options.forEach((opt, idx) => {
      const y = 240 + idx * 58;
      const btn = createPixelButton(this, 570, y, 590, 48, opt.text, {
        fillColor: 0x1e293b,
        hoverColor: 0x334155,
        borderColor: 0xf59e0b,
        fontSize: '14px',
        onClick: () => {
          if (answered) return;
          answered = true;
          const elapsed = (performance.now() - this.phaseStartMs) / 1000;
          gameState.applyDecoder(opt.isCorrect, elapsed);
          this.hud.refresh();
          this.refreshCharactersVisual();

          if (opt.isCorrect) {
            soundManager.playSuccess();
            feedbackText.setColor('#86efac').setText(`✓ ${opt.feedback}`);
          } else {
            soundManager.playError();
            feedbackText.setColor('#fca5a5').setText(`✗ ${opt.feedback}`);
          }

          optionBtns.forEach((b) => b.setAlpha(0.55));
          btn.setAlpha(1);

          const bd = gameState.checkBreakdown();
          const nextStepBtn = createPixelButton(this, 760, 480, 210, 38, 'Enfrentar Sombra ▸', {
            fillColor: 0xd97706,
            hoverColor: 0xf59e0b,
            onClick: () => {
              if (bd.broken) {
                this.handleBreakdown(bd.dayFailed);
              } else {
                this.startShadowPhase();
              }
            },
          });
          this.phaseLayer.add(nextStepBtn);
        },
      });
      optionBtns.push(btn);
      this.phaseLayer.add(btn);
    });
  }

  // ==========================================================
  // FASE 2B — LUZ AMARILLA (¡PENSAR! · Transmutación de la Sombra)
  // ==========================================================
  startShadowPhase() {
    this.clearPhaseLayer();
    this.activePhase = 'YELLOW_SHADOW';
    this.phaseStartMs = performance.now();
    this.semaforo.setState('yellow', 'AMARILLO: ¡Modula Sombra!');
    soundManager.playBGM('bgm_tenso');
    soundManager.playVoice(`${this.sceneData.id}_shadow`);

    const { width } = this.scale;
    this.phaseLayer.add(drawPanel(this, 44, 108, width - 88, 408, 0x090d16, 0.97, 0xa855f7));

    // La Sombra en primer plano a la izquierda
    this.modalShadow = this.add.image(154, 344, 'sombra_hostil').setScale(0.88);
    this.phaseLayer.add(this.modalShadow);

    this.phaseLayer.add(this.add.text(276, 132, 'FASE 2B · TRANSMUTACIÓN DE LA SOMBRA (DIÁLOGO INTERNO)', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#d8b4fe',
    }));

    this.phaseLayer.add(this.add.text(276, 162, `La Sombra susurra: ${this.sceneData.shadow.whisper}`, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '14px',
      fontStyle: 'italic',
      color: '#fecaca',
      wordWrap: { width: 590 },
    }));

    // Barra temporizador
    this.shadowTimeTotal = gameState.getShadowTimerSeconds();
    this.shadowTimeRemaining = this.shadowTimeTotal;
    this.lastTickSecond = Math.ceil(this.shadowTimeRemaining);
    this.shadowTimerActive = true;

    this.timerLabel = this.add.text(276, 208, `⏱ Impulso en: ${this.shadowTimeTotal.toFixed(1)}s  |  ⚡ Autocuidado disponible: ${gameState.run.autocuidado}`, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#fde047',
    });
    const timerTrack = this.add.rectangle(276, 228, 590, 10, 0x1e293b).setOrigin(0, 0.5);
    this.shadowTimerBar = this.add.rectangle(276, 228, 590, 10, 0xef4444).setOrigin(0, 0.5);
    this.phaseLayer.add([this.timerLabel, timerTrack, this.shadowTimerBar]);

    this.shadowFeedback = this.add.text(276, 430, '', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#e2e8f0',
      wordWrap: { width: 590 },
    });
    this.phaseLayer.add(this.shadowFeedback);

    this.shadowResolved = false;

    const renderRefutationCards = () => {
      const refs = shuffleArray(this.sceneData.shadow.refutations);
      refs.forEach((ref, idx) => {
        const y = 266 + idx * 54;
        const btn = createPixelButton(this, 570, y, 590, 46, ref.text, {
          fillColor: 0x1e1b4b,
          hoverColor: 0x312e81,
          borderColor: 0xa855f7,
          fontSize: '13.5px',
          onClick: () => this.resolveShadow(ref.isCorrect, ref.feedback, true),
        });
        this.phaseLayer.add(btn);
      });
    };

    if (gameState.run.autocuidado >= 1) {
      renderRefutationCards();
    } else {
      // Si el jugador falló el descodificador y tiene 0 energía, Valentic ofrece recarga rápida para evitar bloqueo
      this.shadowTimerActive = false;
      this.timerLabel.setText('⚡ Sin Energía de Autocuidado (0) — Valentic pausa el reloj brevemente');
      this.phaseLayer.add(this.add.text(276, 256, 'Fallaste la descodificación anterior. Haz una respiración profunda extra (+5% Tensión por el esfuerzo)\npara recuperar +1 ⚡ y poder rebatir a La Sombra:', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '14px',
        color: '#fed7aa',
      }));

      const rechargeBtn = createPixelButton(this, 470, 344, 380, 50, '⚡ Respiración Profunda con Valentic (+1 Energía)', {
        fillColor: 0xb45309,
        hoverColor: 0xd97706,
        borderColor: 0xfde68a,
        onClick: () => {
          soundManager.playBreatheOut();
          gameState.applyEmergencyPause();
          this.hud.refresh();
          this.startShadowPhase();
        },
      });

      const cedeBtn = createPixelButton(this, 760, 344, 180, 50, 'Ceder al impulso', {
        fillColor: 0x7f1d1d,
        hoverColor: 0x991b1b,
        borderColor: 0xfca5a5,
        onClick: () => this.resolveShadow(false, this.sceneData.shadow.failOutcome, false),
      });
      this.phaseLayer.add([rechargeBtn, cedeBtn]);
    }
  }

  resolveShadow(isSuccess, message, spentEnergy) {
    if (this.shadowResolved) return;
    this.shadowResolved = true;
    this.shadowTimerActive = false;

    const elapsed = (performance.now() - this.phaseStartMs) / 1000;
    gameState.applyShadow(isSuccess, spentEnergy, elapsed);
    this.hud.refresh();
    this.refreshCharactersVisual();

    if (isSuccess) {
      soundManager.playTransmute();
      this.modalShadow.setTexture('sombra_protectora');
      this.shadowFeedback.setColor('#86efac').setText(`✨ ${message}`);
    } else {
      soundManager.playError();
      this.shadowFeedback.setColor('#fca5a5').setText(`⚠ ${message}`);
    }

    const bd = gameState.checkBreakdown();
    const contBtn = createPixelButton(this, 760, 480, 210, 38, 'Armar Respuesta CNV ▸', {
      fillColor: 0x16a34a,
      hoverColor: 0x22c55e,
      onClick: () => {
        if (bd.broken) {
          this.handleBreakdown(bd.dayFailed);
        } else {
          this.startCNVPhase();
        }
      },
    });
    this.phaseLayer.add(contBtn);
  }

  // ==========================================================
  // FASE 3 — LUZ VERDE (¡ACTUAR! · Bloques CNV modulares)
  // ==========================================================
  startCNVPhase() {
    this.clearPhaseLayer();
    this.activePhase = 'GREEN_CNV';
    this.phaseStartMs = performance.now();
    this.semaforo.setState('green', 'VERDE: ¡Comunica CNV!');
    soundManager.playBGM(this.sceneBgmKey);
    soundManager.playVoice('valentic_green');

    const { width } = this.scale;
    this.phaseLayer.add(drawPanel(this, 44, 108, width - 88, 408, 0x0f172a, 0.96, 0x22c55e));

    this.phaseLayer.add(this.add.text(72, 130, 'FASE 3 · LUZ VERDE: CONSTRUYE TU MENSAJE CNV', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '19px',
      fontStyle: 'bold',
      color: '#86efac',
    }));

    this.phaseLayer.add(this.add.text(72, 160, this.sceneData.cnv.contextPrompt, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13.5px',
      color: '#e2e8f0',
    }));

    const slotDefs = [
      { key: 'hecho', title: '1. HECHO OBJETIVO', color: 0x0284c7 },
      { key: 'sentimiento', title: '2. SENTIMIENTO', color: 0xd97706 },
      { key: 'peticion', title: '3. PETICIÓN CONCRETA', color: 0x16a34a },
    ];

    this.cnvSelections = { hecho: null, sentimiento: null, peticion: null };
    this.cnvSlotTexts = {};
    this.cnvStep = 0;

    slotDefs.forEach((sl, idx) => {
      const sx = 72 + idx * 278;
      this.phaseLayer.add(drawPanel(this, sx, 194, 264, 96, 0x1e293b, 1, sl.color));
      this.phaseLayer.add(this.add.text(sx + 12, 204, sl.title, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '11.5px',
        fontStyle: 'bold',
        color: '#f8fafc',
      }));
      this.cnvSlotTexts[sl.key] = this.add.text(sx + 12, 224, '(Selecciona abajo...)', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '12px',
        color: '#94a3b8',
        wordWrap: { width: 240 },
      });
      this.phaseLayer.add(this.cnvSlotTexts[sl.key]);
    });

    this.cnvOptionsContainer = this.add.container(0, 0);
    this.phaseLayer.add(this.cnvOptionsContainer);

    const renderStep = () => {
      this.cnvOptionsContainer.removeAll(true);

      if (this.cnvStep < slotDefs.length) {
        const current = slotDefs[this.cnvStep];
        this.cnvOptionsContainer.add(this.add.text(72, 308, `Paso ${this.cnvStep + 1}/3 · Elige el bloque para [${current.title}]:`, {
          fontFamily: 'Trebuchet MS, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#fde047',
        }));

        const choices = shuffleArray(this.sceneData.cnv.slots[current.key]);
        choices.forEach((choice, i) => {
          const by = 360 + i * 62;
          const btn = createPixelButton(this, width / 2, by, 810, 50, choice.text, {
            fillColor: 0x1e293b,
            hoverColor: 0x334155,
            borderColor: current.color,
            fontSize: '14px',
            onClick: () => {
              soundManager.playBlockSnap();
              this.cnvSelections[current.key] = choice;
              this.cnvSlotTexts[current.key].setText(choice.text).setColor('#ffffff');
              this.cnvStep += 1;
              renderStep();
            },
          });
          this.cnvOptionsContainer.add(btn);
        });
      } else {
        this.cnvOptionsContainer.add(this.add.text(72, 312, 'Mensaje ensamblado. Revisa tus 3 bloques antes de hablar:', {
          fontFamily: 'Trebuchet MS, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#86efac',
        }));

        const fullPreview = `${this.cnvSelections.hecho.text} ${this.cnvSelections.sentimiento.text} ${this.cnvSelections.peticion.text}`;
        this.cnvOptionsContainer.add(drawPanel(this, 72, 342, 816, 92, 0x090d16, 1, 0x22c55e));
        this.cnvOptionsContainer.add(this.add.text(88, 356, `"${fullPreview}"`, {
          fontFamily: 'Trebuchet MS, sans-serif',
          fontSize: '14px',
          fontStyle: 'italic',
          color: '#f8fafc',
          wordWrap: { width: 784 },
        }));

        const resetBtn = createPixelButton(this, 260, 470, 210, 40, '↺ Cambiar Bloques', {
          fillColor: 0x475569,
          hoverColor: 0x64748b,
          onClick: () => {
            this.cnvStep = 0;
            slotDefs.forEach((sl) => {
              this.cnvSelections[sl.key] = null;
              this.cnvSlotTexts[sl.key].setText('(Selecciona abajo...)').setColor('#94a3b8');
            });
            renderStep();
          },
        });

        const sendBtn = createPixelButton(this, 650, 470, 280, 42, 'Pronunciar Respuesta ▸', {
          fillColor: 0x16a34a,
          hoverColor: 0x22c55e,
          borderColor: 0x86efac,
          fontSize: '16px',
          onClick: () => {
            const isClean = Boolean(
              this.cnvSelections.hecho?.valid
              && this.cnvSelections.sentimiento?.valid
              && this.cnvSelections.peticion?.valid
            );
            const elapsed = (performance.now() - this.phaseStartMs) / 1000;
            gameState.applyCNV(isClean, elapsed);
            this.hud.refresh();
            this.refreshCharactersVisual();

            const bd = gameState.checkBreakdown();
            if (bd.broken) {
              soundManager.playError();
              this.handleBreakdown(bd.dayFailed);
              return;
            }

            if (isClean) {
              soundManager.playSuccess();
              const voiceKey = `${this.sceneData.id}_cnv_clean`;
              const canSpeak = !gameState.progress.settings.muted
                && gameState.progress.settings.voiceEnabled
                && this.cache.audio.exists(voiceKey);

              if (canSpeak) {
                resetBtn.destroy();
                sendBtn.destroy();
                let moved = false;
                const goMirror = () => {
                  if (moved) return;
                  moved = true;
                  this.showMirrorPhase(true);
                };
                this.cnvOptionsContainer.add(this.add.text(210, 470, '🗣 Alex pronunciando su respuesta...', {
                  fontFamily: 'Trebuchet MS, sans-serif',
                  fontSize: '15px',
                  fontStyle: 'bold',
                  color: '#86efac',
                }).setOrigin(0.5));
                this.cnvOptionsContainer.add(createPixelButton(this, 680, 470, 220, 38, 'Ver Consecuencia ▸', {
                  fillColor: 0x2563eb,
                  hoverColor: 0x3b82f6,
                  onClick: goMirror,
                }));
                soundManager.playVoice(voiceKey, goMirror);
              } else {
                this.showMirrorPhase(true);
              }
            } else {
              soundManager.playError();
              this.showMirrorPhase(false);
            }
          },
        });

        this.cnvOptionsContainer.add([resetBtn, sendBtn]);
      }
    };

    renderStep();
  }

  // ==========================================================
  // ESPEJO DE CONSECUENCIAS (Corto vs Mediano Plazo + STEAM)
  // ==========================================================
  showMirrorPhase(isPositive) {
    this.clearPhaseLayer();
    this.activePhase = 'MIRROR';
    soundManager.playVoice(`${this.sceneData.id}_${isPositive ? 'mirror_pos' : 'mirror_neg'}`);

    const { width } = this.scale;
    const mirror = isPositive ? this.sceneData.mirror.positive : this.sceneData.mirror.negative;
    const accent = isPositive ? 0x22c55e : 0xef4444;

    this.phaseLayer.add(drawPanel(this, 44, 108, width - 88, 408, 0x0f172a, 0.97, accent));
    this.phaseLayer.add(this.add.image(134, 342, 'valentic').setScale(1.2));

    this.phaseLayer.add(this.add.text(240, 134, isPositive
      ? 'ESPEJO DE CONSECUENCIAS · CONFLICTO DESESCALADO'
      : 'ESPEJO DE CONSECUENCIAS · TENSIÓN EN ESCALADA', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: isPositive ? '#86efac' : '#fca5a5',
    }));

    // Dos columnas: Inmediato vs Mediano Plazo
    this.phaseLayer.add(drawPanel(this, 240, 176, 305, 168, 0x1e293b, 1, 0x60a5fa));
    this.phaseLayer.add(this.add.text(256, 190, '⚡ REPERCUSIÓN INMEDIATA', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#93c5fd',
    }));
    this.phaseLayer.add(this.add.text(256, 218, mirror.immediate, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '14px',
      color: '#f8fafc',
      wordWrap: { width: 274 },
      lineSpacing: 4,
    }));

    this.phaseLayer.add(drawPanel(this, 562, 176, 312, 168, 0x1e293b, 1, accent));
    this.phaseLayer.add(this.add.text(578, 190, '⏳ IMPACTO A MEDIANO PLAZO', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: isPositive ? '#86efac' : '#fca5a5',
    }));
    this.phaseLayer.add(this.add.text(578, 218, mirror.mediumTerm, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '14px',
      color: '#f8fafc',
      wordWrap: { width: 280 },
      lineSpacing: 4,
    }));

    // Nota Matemática STEAM
    this.phaseLayer.add(drawPanel(this, 240, 358, 634, 68, 0x172554, 1, 0xf59e0b));
    this.phaseLayer.add(this.add.text(256, 372, `📊 ${mirror.mathScoreNote}`, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13.5px',
      fontStyle: 'bold',
      color: '#fde68a',
      wordWrap: { width: 600 },
    }));

    const isLastScene = gameState.run.sceneIndex + 1 >= this.dayData.scenes.length;
    const btnLabel = isLastScene ? 'Ver Resultados de la Jornada ▸' : 'Siguiente Escenario del Día ▸';
    const nextBtn = createPixelButton(this, 710, 468, 300, 42, btnLabel, {
      fillColor: 0x2563eb,
      hoverColor: 0x3b82f6,
      onClick: () => {
        if (!isLastScene) {
          gameState.run.sceneIndex += 1;
          this.scene.restart();
        } else {
          this.scene.start('ResultScene');
        }
      },
    });
    this.phaseLayer.add(nextBtn);
  }

  handleBreakdown(dayFailed) {
    this.clearPhaseLayer();
    this.activePhase = 'BREAKDOWN';
    soundManager.stopVoice();
    soundManager.playBGM(this.sceneBgmKey);
    soundManager.playBreakdown();

    const { width } = this.scale;
    this.phaseLayer.add(drawPanel(this, 130, 140, width - 260, 290, 0x450a0a, 0.98, 0xf87171));
    this.phaseLayer.add(this.add.text(width / 2, 182, dayFailed
      ? 'COLAPSO EMOCIONAL · SIN VÍNCULOS DE APOYO'
      : 'QUIEBRE EMOCIONAL TEMPORAL (-1 VÍNCULO ♥)', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#fecaca',
    }).setOrigin(0.5));

    const msg = dayFailed
      ? 'La Tensión Interna superó tus 3 Vínculos de Apoyo hoy.\nReiniciarás la jornada desde la mañana aplicando lo aprendido.'
      : 'La Tensión Interna llegó al límite (100%) o el Clima cayó a 0%.\nValentic reinicia esta situación crítica con 70% Clima y 30% Tensión.';

    this.phaseLayer.add(this.add.text(width / 2, 254, msg, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '15px',
      color: '#fee2e2',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5));

    const retryBtn = createPixelButton(this, width / 2, 366, 280, 44, dayFailed ? 'Reiniciar Jornada Completa' : 'Reintentar Escenario Crítico', {
      fillColor: 0xdc2626,
      hoverColor: 0xef4444,
      onClick: () => {
        if (dayFailed) {
          gameState.startDay(gameState.run.day);
        }
        this.scene.restart();
      },
    });
    this.phaseLayer.add(retryBtn);
  }

  update(_time, delta) {
    this.hud.update(delta);

    // Fase Roja: progreso de respiración manteniendo botón o ESPACIO
    if (this.activePhase === 'RED_PAUSE') {
      const holding = this.holdActive || this.spaceKey.isDown;
      if (holding) {
        this.breathProgress = Math.min(1, this.breathProgress + delta / 3000);
        const radius = 28 + Math.sin(this.breathProgress * Math.PI) * 26;
        this.breathRing.setRadius(radius);
        this.breathRing.setFillStyle(0x22c55e, 0.35);
        this.breathBar.width = Math.max(2, 336 * this.breathProgress);
        if (this.breathProgress < 0.45) {
          this.breathStatus.setText('Inhalando profundo (activando nervio vago)...');
        } else if (this.breathProgress < 0.99) {
          this.breathStatus.setText('Exhalando lento (calmando la amígdala)...');
        }
        if (this.breathProgress >= 1) {
          soundManager.playBreatheOut();
          this.startDecoderPhase();
        }
      } else if (this.breathProgress > 0) {
        this.breathProgress = Math.max(0, this.breathProgress - delta / 4500);
        this.breathBar.width = Math.max(2, 336 * this.breathProgress);
      }
    }

    // Fase Amarilla B: cuenta regresiva de La Sombra
    if (this.activePhase === 'YELLOW_SHADOW' && this.shadowTimerActive && !this.shadowResolved) {
      this.shadowTimeRemaining = Math.max(0, this.shadowTimeRemaining - delta / 1000);
      const ratio = this.shadowTimeRemaining / this.shadowTimeTotal;
      this.shadowTimerBar.width = Math.max(2, 590 * ratio);
      this.timerLabel.setText(
        `⏱ Impulso en: ${this.shadowTimeRemaining.toFixed(1)}s  |  ⚡ Autocuidado disponible: ${gameState.run.autocuidado}`
      );

      const currentSec = Math.ceil(this.shadowTimeRemaining);
      if (currentSec <= 3 && currentSec > 0 && currentSec !== this.lastTickSecond) {
        this.lastTickSecond = currentSec;
        soundManager.playTick();
      }

      if (this.shadowTimeRemaining <= 0) {
        this.resolveShadow(false, this.sceneData.shadow.failOutcome, false);
      }
    }
  }
}
