import { gameState } from '../systems/GameState.js';
import { createPixelButton, drawPanel } from '../ui/UIHelpers.js';

export class DiaryScene extends Phaser.Scene {
  constructor() {
    super('DiaryScene');
    this.selectedDay = 1;
  }

  init(data) {
    this.returnTo = data?.returnTo || 'MenuScene';
    this.isOverlay = Boolean(data?.isOverlay);
    if (data?.day) this.selectedDay = data.day;
  }

  create() {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, 'bg_cuarto').setDisplaySize(width, height).setTint(0x94a3b8);
    this.add.rectangle(width / 2, height / 2, width, height, 0x090f1d, 0.55);

    drawPanel(this, 44, 28, width - 88, height - 56, 0xfefce8, 0.98, 0x78350f);

    this.add.text(width / 2, 58, 'DIARIO DE CONVIVENCIA · COLECCIONABLE', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '21px',
      fontStyle: 'bold',
      color: '#451a03',
    }).setOrigin(0.5);

    this.add.image(132, 340, 'valentic').setScale(1.0);

    const days = gameState.dialogues?.days || [];
    days.forEach((d, idx) => {
      const unlocked = gameState.progress.unlockedDiary.includes(d.day);
      const bx = 260 + idx * 124;
      createPixelButton(this, bx, 106, 114, 34, `${unlocked ? '✓' : '🔒'} Día ${d.day}`, {
        fillColor: this.selectedDay === d.day ? 0xb45309 : (unlocked ? 0x1d4ed8 : 0x64748b),
        hoverColor: unlocked ? 0xd97706 : 0x64748b,
        borderColor: 0xfde68a,
        fontSize: '13px',
        onClick: () => {
          this.selectedDay = d.day;
          this.scene.restart({ returnTo: this.returnTo, isOverlay: this.isOverlay, day: d.day });
        },
      });
    });

    const dayObj = days.find((d) => d.day === this.selectedDay) || days[0];
    const unlocked = gameState.progress.unlockedDiary.includes(dayObj.day);

    drawPanel(this, 224, 144, 650, 290, 0xfffbeb, 1, 0xd97706);

    if (unlocked) {
      this.add.text(248, 166, `${dayObj.dayName} — ${dayObj.diary.title}`, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#78350f',
      });

      this.add.text(248, 206, dayObj.diary.reflection, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '15px',
        color: '#1e293b',
        wordWrap: { width: 604 },
        lineSpacing: 5,
      });

      drawPanel(this, 248, 304, 602, 62, 0xe0f2fe, 1, 0x0284c7);
      this.add.text(262, 314, dayObj.diary.scienceFact, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#0c4a6e',
        wordWrap: { width: 576 },
      });

      this.add.text(248, 384, `🛠 ${dayObj.diary.toolTip}`, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#166534',
        wordWrap: { width: 600 },
      });
    } else {
      this.add.text(549, 255, '🔒 Página bloqueada', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#64748b',
      }).setOrigin(0.5);
      this.add.text(549, 300, `Completa la jornada del ${dayObj.dayName} manteniendo el Clima de Convivencia\npor encima del 60% y transmutando al menos una vez a La Sombra.`, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '14px',
        color: '#475569',
        align: 'center',
      }).setOrigin(0.5);
    }

    createPixelButton(this, width / 2, 472, 200, 38, 'Volver', {
      fillColor: 0x334155,
      hoverColor: 0x475569,
      onClick: () => {
        if (this.isOverlay) {
          this.scene.resume(this.returnTo);
          this.scene.stop();
        } else {
          this.scene.start(this.returnTo);
        }
      },
    });
  }
}
