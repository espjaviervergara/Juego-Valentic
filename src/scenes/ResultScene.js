import { gameState } from '../systems/GameState.js';
import { soundManager } from '../systems/SoundManager.js';
import { createPixelButton, drawPanel } from '../ui/UIHelpers.js';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  create() {
    const { width, height } = this.scale;
    const run = gameState.run;
    const dayData = gameState.dialogues.days.find((d) => d.day === run.day) || gameState.dialogues.days[0];
    const victory = gameState.isDayVictory();

    if (victory) {
      gameState.completeCurrentDay();
      soundManager.playDayWin();
    } else {
      soundManager.playError();
    }

    // Fondo en el cuarto de Alex al atardecer
    this.add.image(width / 2, height / 2, 'bg_cuarto').setDisplaySize(width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x090f1d, 0.5);

    // Personajes: Alex sereno/tenso + Sombra transformada + Valentic
    this.add.image(108, height - 24, victory ? 'sombra_protectora' : 'sombra_hostil').setOrigin(0.5, 1).setScale(0.84);
    this.add.image(186, height - 22, victory ? 'alex_calm' : 'alex_tense').setOrigin(0.5, 1).setScale(0.92);
    this.add.image(856, height - 24, 'valentic').setOrigin(0.5, 1).setScale(1.22);

    // Panel central de resultados
    drawPanel(this, 244, 24, 512, 488, 0x0f172a, 0.96, victory ? 0x22c55e : 0xef4444);

    this.add.text(500, 56, victory
      ? `¡${dayData.dayName.toUpperCase()} SUPERADO!`
      : `${dayData.dayName.toUpperCase()} · REQUIERE REFUERZO`, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '23px',
      fontStyle: 'bold',
      color: victory ? '#86efac' : '#fca5a5',
    }).setOrigin(0.5);

    this.add.text(500, 84, dayData.subtitle, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      color: '#cbd5e1',
    }).setOrigin(0.5);

    // Métricas clave de la jornada
    drawPanel(this, 268, 104, 464, 114, 0x1e293b, 1, 0x475569);
    this.add.text(286, 116, [
      `Clima de Convivencia final: ${run.clima}% (meta: > 60%)`,
      `Tensión Interna residual: ${run.tension}%  |  Vínculos restantes: ${run.vinculos}/3`,
      `Descodificador: ${run.stats.decoderHits} aciertos / ${run.stats.decoderMisses} errores`,
      `Sombra transmutada: ${run.stats.shadowTransmutations} veces (meta: >= 1)  |  CNV limpias: ${run.stats.cnvPerfect}`,
    ].join('\n'), {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13.5px',
      color: '#f8fafc',
      lineSpacing: 6,
    });

    // Panel STEAM Matemáticas: Gráfico de dispersión Tiempo de reacción vs Éxito
    drawPanel(this, 268, 228, 464, 150, 0x090d16, 1, 0x38bdf8);
    this.add.text(284, 240, '📊 Análisis STEAM (Matemáticas): Tiempo de pausa vs. Éxito asertivo', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '12.5px',
      fontStyle: 'bold',
      color: '#7dd3fc',
    });

    const g = this.add.graphics();
    const gx = 304;
    const gy = 352;
    const gw = 396;
    const gh = 78;
    g.lineStyle(1.5, 0x64748b, 1);
    g.lineBetween(gx, gy, gx + gw, gy); // eje X tiempo
    g.lineBetween(gx, gy, gx, gy - gh); // eje Y éxito

    this.add.text(gx + gw / 2, gy + 10, 'Tiempo de análisis (0s -> 10s)', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '10px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    const reactions = run.stats.reactions || [];
    reactions.forEach((r, idx) => {
      const clampedT = Math.min(10, Math.max(0.4, r.reactionTimeSec));
      const px = gx + (clampedT / 10) * (gw - 20) + 10;
      const py = r.success ? (gy - gh + 18 + (idx % 3) * 8) : (gy - 16 - (idx % 2) * 8);
      g.fillStyle(r.success ? 0x22c55e : 0xef4444, 1);
      g.fillCircle(px, py, 5);
    });

    this.add.text(gx + 8, gy - gh + 2, '✓ Asertivo', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '10px', color: '#4ade80' });
    this.add.text(gx + 8, gy - 16, '✗ Impulsivo', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '10px', color: '#f87171' });

    // Estado del Diario
    drawPanel(this, 268, 388, 464, 52, 0x1e293b, 1, victory ? 0xfbbf24 : 0x64748b);
    this.add.text(500, 414, victory
      ? `📖 ¡Desbloqueaste: "${dayData.diary.title}"!`
      : '🔒 Necesitas Clima > 60% y al menos 1 transmutación de la Sombra para avanzar.', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: victory ? '#fde68a' : '#fca5a5',
      align: 'center',
      wordWrap: { width: 440 },
    }).setOrigin(0.5);

    // Botones de acción
    if (victory && run.day < 5) {
      createPixelButton(this, 360, 474, 174, 38, `Siguiente: Día ${run.day + 1} ▸`, {
        fillColor: 0x16a34a,
        hoverColor: 0x22c55e,
        fontSize: '14px',
        onClick: () => {
          gameState.startDay(run.day + 1);
          this.scene.start('GameScene');
        },
      });
    } else if (victory && run.day === 5) {
      createPixelButton(this, 360, 474, 174, 38, '¡Semana Completa! Menú', {
        fillColor: 0x16a34a,
        hoverColor: 0x22c55e,
        fontSize: '13px',
        onClick: () => this.scene.start('MenuScene'),
      });
    } else {
      createPixelButton(this, 360, 474, 174, 38, '↺ Reintentar Día', {
        fillColor: 0xdc2626,
        hoverColor: 0xef4444,
        fontSize: '14px',
        onClick: () => {
          gameState.startDay(run.day);
          this.scene.start('GameScene');
        },
      });
    }

    createPixelButton(this, 535, 474, 140, 38, 'Ver Diario', {
      fillColor: 0x4f46e5,
      hoverColor: 0x6366f1,
      fontSize: '14px',
      onClick: () => this.scene.start('DiaryScene', { returnTo: 'ResultScene', day: run.day }),
    });

    createPixelButton(this, 675, 474, 110, 38, 'Menú', {
      fillColor: 0x334155,
      hoverColor: 0x475569,
      fontSize: '14px',
      onClick: () => this.scene.start('MenuScene'),
    });
  }
}
