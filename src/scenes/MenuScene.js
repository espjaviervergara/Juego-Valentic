import { gameState } from '../systems/GameState.js';
import { soundManager } from '../systems/SoundManager.js';
import { createPixelButton, drawPanel } from '../ui/UIHelpers.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    // Fondo dividido Hogar (izq) vs Colegio (der) fiel al diseño de pantallas
    const leftCrop = this.add.image(width / 2, height / 2, 'bg_hogar').setDisplaySize(width, height);
    leftCrop.setCrop(0, 0, leftCrop.width / 2, leftCrop.height);
    leftCrop.setTint(0xdbeafe);

    const rightCrop = this.add.image(width / 2, height / 2, 'bg_colegio_interior').setDisplaySize(width, height);
    rightCrop.setCrop(rightCrop.width / 2, 0, rightCrop.width / 2, rightCrop.height);

    // Viñeta oscura para legibilidad del título
    this.add.rectangle(width / 2, height / 2, width, height, 0x090f1d, 0.45);
    this.add.rectangle(width / 2, height / 2, 4, height, 0x94a3b8, 0.7);

    // Personajes en composición de portada: Valentic a la izquierda, Alex y Sombra a la derecha
    this.add.image(155, height - 30, 'valentic').setOrigin(0.5, 1).setScale(1.38);
    this.add.image(828, height - 22, 'sombra_hostil').setOrigin(0.5, 1).setScale(0.92).setAlpha(0.92);
    this.add.image(735, height - 20, 'alex_tense').setOrigin(0.5, 1).setScale(0.96);

    // Caja de título principal
    drawPanel(this, 232, 24, 496, 108, 0x0f172a, 0.9, 0x60a5fa);
    this.add.text(width / 2, 58, 'ECOS BIVALENTES', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#1e3a8a',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(width / 2, 98, 'Entre el Grito y el Eco · ValenTIC', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#fbbf24',
    }).setOrigin(0.5);

    // Botones principales centrados
    const nextDay = Math.min(5, gameState.progress.unlockedDay);
    const startLabel = gameState.progress.completedDays.length > 0
      ? `Continuar Semana (Día ${nextDay})`
      : 'Iniciar Semana (Lunes)';

    createPixelButton(this, width / 2, 184, 300, 48, startLabel, {
      fillColor: 0x16a34a,
      hoverColor: 0x22c55e,
      borderColor: 0x86efac,
      fontSize: '17px',
      onClick: () => {
        gameState.startDay(nextDay);
        this.scene.start('GameScene');
      },
    });

    createPixelButton(this, width / 2, 244, 300, 44, 'Elegir Día (Lunes a Viernes)', {
      fillColor: 0x2563eb,
      hoverColor: 0x3b82f6,
      borderColor: 0x93c5fd,
      onClick: () => this.openDaySelector(),
    });

    createPixelButton(this, width / 2, 302, 300, 44, 'Cómo Jugar (Semáforo Valentic)', {
      fillColor: 0xd97706,
      hoverColor: 0xf59e0b,
      borderColor: 0xfde68a,
      onClick: () => this.scene.start('TutorialScene'),
    });

    createPixelButton(this, width / 2, 360, 300, 44, `Diario de Convivencia (${gameState.progress.unlockedDiary.length}/5)`, {
      fillColor: 0x4f46e5,
      hoverColor: 0x6366f1,
      borderColor: 0xc7d2fe,
      onClick: () => this.scene.start('DiaryScene', { returnTo: 'MenuScene' }),
    });

    // Controles de accesibilidad y sonido
    const timerBtn = createPixelButton(this, width / 2 - 80, 424, 150, 34, this.getTimerText(), {
      fillColor: 0x334155,
      hoverColor: 0x475569,
      borderColor: 0x94a3b8,
      fontSize: '12px',
      onClick: () => {
        gameState.toggleAccessibleTimer();
        timerBtn.setLabel(this.getTimerText());
      },
    });

    const muteBtn = createPixelButton(this, width / 2 + 80, 424, 150, 34, this.getMuteText(), {
      fillColor: 0x334155,
      hoverColor: 0x475569,
      borderColor: 0x94a3b8,
      fontSize: '12px',
      onClick: () => {
        gameState.toggleMuted();
        soundManager.playClick();
        muteBtn.setLabel(this.getMuteText());
      },
    });

    // Etiqueta institucional inferior
    drawPanel(this, 240, 468, 480, 50, 0x0f172a, 0.88, 0x475569);
    this.add.text(width / 2, 493, 'I.E. Ángela María Torres Suárez · Proyecto STEAM Grado 11°\nRespira · Descodifica la intención · Comunica sin violencia', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '12px',
      color: '#cbd5e1',
      align: 'center',
    }).setOrigin(0.5);
  }

  getTimerText() {
    return gameState.progress.settings.accessibleTimer ? 'Temporizador: 12s' : 'Temporizador: 7s';
  }

  getMuteText() {
    return gameState.progress.settings.muted ? 'Sonido: Silencio' : 'Sonido: Activo';
  }

  openDaySelector() {
    const { width, height } = this.scale;
    const modal = this.add.container(0, 0).setDepth(50);
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.78).setInteractive();
    modal.add(dim);

    modal.add(drawPanel(this, 190, 90, 580, 360, 0x0f172a, 0.98, 0x60a5fa));
    modal.add(this.add.text(width / 2, 124, 'Selecciona la Jornada Escolar', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '21px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5));

    const days = gameState.dialogues?.days || [];
    days.forEach((d, idx) => {
      const y = 176 + idx * 44;
      const unlocked = d.day <= gameState.progress.unlockedDay;
      const done = gameState.progress.completedDays.includes(d.day);
      const badge = done ? '✓ ' : unlocked ? '▸ ' : '🔒 ';
      const btn = createPixelButton(this, width / 2, y, 470, 36, `${badge}Día ${d.day} (${d.dayName}): ${d.subtitle}`, {
        fillColor: unlocked ? (done ? 0x15803d : 0x1d4ed8) : 0x334155,
        hoverColor: unlocked ? (done ? 0x16a34a : 0x2563eb) : 0x334155,
        borderColor: unlocked ? 0x93c5fd : 0x64748b,
        fontSize: '13px',
        onClick: () => {
          if (!unlocked) {
            soundManager.playError();
            return;
          }
          gameState.startDay(d.day);
          this.scene.start('GameScene');
        },
      });
      modal.add(btn);
    });

    const closeBtn = createPixelButton(this, width / 2, 415, 160, 34, 'Cerrar', {
      fillColor: 0x475569,
      hoverColor: 0x64748b,
      onClick: () => modal.destroy(),
    });
    modal.add(closeBtn);
  }
}
