import { gameState } from '../systems/GameState.js';
import { soundManager } from '../systems/SoundManager.js';

export class HUD {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.onOpenDiary = options.onOpenDiary || null;
    this.onBackMenu = options.onBackMenu || null;
    this.vfcPhase = 0;

    this.container = scene.add.container(0, 0).setDepth(30);
    this.build();
    this.refresh();
  }

  build() {
    const s = this.scene;

    // Panel izquierdo: Tensión (VFC) y Clima de Convivencia
    const leftBg = s.add.graphics();
    leftBg.fillStyle(0x0f172a, 0.88);
    leftBg.fillRoundedRect(12, 10, 326, 80, 8);
    leftBg.lineStyle(2, 0x475569, 1);
    leftBg.strokeRoundedRect(12, 10, 326, 80, 8);
    this.container.add(leftBg);

    // Etiqueta Tensión + Pulso VFC
    this.tensionLabel = s.add.text(22, 16, 'Tensión Interna (VFC): 0%', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#feb2b2',
    });
    this.container.add(this.tensionLabel);

    const tensionTrack = s.add.rectangle(22, 36, 206, 12, 0x1e293b).setOrigin(0, 0.5);
    tensionTrack.setStrokeStyle(1, 0x64748b);
    this.tensionBar = s.add.rectangle(23, 36, 2, 10, 0xef4444).setOrigin(0, 0.5);
    this.vfcGraphics = s.add.graphics();
    this.container.add([tensionTrack, this.tensionBar, this.vfcGraphics]);

    // Etiqueta Clima de Convivencia
    this.climaLabel = s.add.text(22, 50, 'Clima de Convivencia: 100%', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#9ae6b4',
    });
    this.container.add(this.climaLabel);

    const climaTrack = s.add.rectangle(22, 70, 206, 12, 0x1e293b).setOrigin(0, 0.5);
    climaTrack.setStrokeStyle(1, 0x64748b);
    this.climaBar = s.add.rectangle(23, 70, 204, 10, 0x22c55e).setOrigin(0, 0.5);
    this.container.add([climaTrack, this.climaBar]);

    // Energía de Autocuidado (badge dentro del panel izquierdo)
    const energyBox = s.add.graphics();
    energyBox.fillStyle(0x1e293b, 1);
    energyBox.fillRoundedRect(240, 20, 88, 58, 6);
    energyBox.lineStyle(1.5, 0xf6ad55, 0.9);
    energyBox.strokeRoundedRect(240, 20, 88, 58, 6);
    this.container.add(energyBox);

    const energyTitle = s.add.text(284, 30, 'AUTOCUIDADO', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#fbd38d',
    }).setOrigin(0.5);
    this.energyValue = s.add.text(284, 56, '⚡ 0', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#fef08a',
    }).setOrigin(0.5);
    this.container.add([energyTitle, this.energyValue]);

    // Panel derecho: Día, Escenario, Vínculos y botones rápidos
    const rightBg = s.add.graphics();
    rightBg.fillStyle(0x0f172a, 0.88);
    rightBg.fillRoundedRect(546, 10, 402, 80, 8);
    rightBg.lineStyle(2, 0x475569, 1);
    rightBg.strokeRoundedRect(546, 10, 402, 80, 8);
    this.container.add(rightBg);

    this.dayText = s.add.text(558, 17, 'Lunes · Escenario', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#e2e8f0',
    });
    this.vinculosText = s.add.text(558, 38, 'Vínculos: ♥ ♥ ♥', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#f87171',
    });
    this.container.add([this.dayText, this.vinculosText]);

    // Botones compactos de utilidad
    this.makeMiniButton(556, 62, 54, 22, 'Diario', 0x2b6cb0, () => {
      soundManager.playClick();
      if (this.onOpenDiary) this.onOpenDiary();
    });

    this.timerBtnText = this.makeMiniButton(615, 62, 82, 22, this.getTimerBtnLabel(), 0x4a5568, () => {
      soundManager.playClick();
      gameState.toggleAccessibleTimer();
      this.timerBtnText.setText(this.getTimerBtnLabel());
    });

    this.voiceBtnText = this.makeMiniButton(702, 62, 64, 22, this.getVoiceBtnLabel(), 0x0f766e, () => {
      gameState.toggleVoice();
      soundManager.syncVolumes();
      soundManager.playClick();
      this.voiceBtnText.setText(this.getVoiceBtnLabel());
    });

    this.muteBtnText = this.makeMiniButton(771, 62, 68, 22, this.getMuteBtnLabel(), 0x4a5568, () => {
      gameState.toggleMuted();
      soundManager.syncVolumes();
      soundManager.playClick();
      this.muteBtnText.setText(this.getMuteBtnLabel());
    });

    this.makeMiniButton(844, 62, 50, 22, 'Menú', 0x742a2a, () => {
      soundManager.playClick();
      soundManager.stopVoice();
      if (this.onBackMenu) this.onBackMenu();
    });

    this.sceneTag = s.add.text(940, 62 + 11, '1/2', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#94a3b8',
    }).setOrigin(1, 0.5);
    this.container.add(this.sceneTag);
  }

  getTimerBtnLabel() {
    return gameState.progress.settings.accessibleTimer ? 'Tiempo: 12s' : 'Tiempo: 7s';
  }

  getVoiceBtnLabel() {
    return gameState.progress.settings.voiceEnabled ? 'Voz: On' : 'Voz: Off';
  }

  getMuteBtnLabel() {
    return gameState.progress.settings.muted ? 'Audio: Off' : 'Audio: On';
  }

  makeMiniButton(x, y, w, h, label, color, onClick) {
    const s = this.scene;
    const bg = s.add.rectangle(x, y, w, h, color).setOrigin(0, 0);
    bg.setStrokeStyle(1, 0x94a3b8);
    bg.setInteractive({ useHandCursor: true });
    const txt = s.add.text(x + w / 2, y + h / 2, label, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setAlpha(0.85));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', onClick);
    this.container.add([bg, txt]);
    return txt;
  }

  setSceneMeta(dayName, locationLabel, sceneIdx, totalScenes) {
    const shortLoc = locationLabel.length > 38 ? `${locationLabel.slice(0, 36)}…` : locationLabel;
    this.dayText.setText(`${dayName} · ${shortLoc}`);
    this.sceneTag.setText(`Esc. ${sceneIdx + 1}/${totalScenes}`);
  }

  refresh() {
    const run = gameState.run;
    if (!run) return;

    this.tensionLabel.setText(`Tensión Interna (VFC): ${run.tension}%`);
    this.tensionBar.width = Math.max(2, (run.tension / 100) * 204);
    this.tensionBar.fillColor = run.tension >= 70 ? 0xdc2626 : run.tension >= 40 ? 0xf59e0b : 0xf87171;

    this.climaLabel.setText(`Clima de Convivencia: ${run.clima}%`);
    this.climaBar.width = Math.max(2, (run.clima / 100) * 204);
    this.climaBar.fillColor = run.clima > 60 ? 0x22c55e : run.clima > 30 ? 0xeab308 : 0xef4444;

    this.energyValue.setText(`⚡ ${run.autocuidado}`);
    const hearts = '♥ '.repeat(Math.max(0, run.vinculos)) + '♡ '.repeat(Math.max(0, 3 - run.vinculos));
    this.vinculosText.setText(`Vínculos: ${hearts.trim()}`);
  }

  update(delta) {
    const run = gameState.run;
    if (!run) return;
    // Onda VFC STEAM: oscila más rápido y errática cuando sube la tensión
    const speed = 0.004 + (run.tension / 100) * 0.015;
    this.vfcPhase += delta * speed;

    const g = this.vfcGraphics;
    g.clear();
    const x0 = 236;
    const y0 = 16;
    const color = run.tension >= 60 ? 0xf87171 : 0x4ade80;
    g.lineStyle(1.5, color, 0.9);
    g.beginPath();
    const width = 94;
    for (let i = 0; i <= width; i += 3) {
      const amp = 1.5 + (run.tension / 100) * 3.5;
      const freq = 0.16 + (run.tension / 100) * 0.25;
      const y = y0 + Math.sin(this.vfcPhase + i * freq) * amp;
      if (i === 0) g.moveTo(x0 + i, y);
      else g.lineTo(x0 + i, y);
    }
    g.strokePath();
  }

  destroy() {
    this.container.destroy();
  }
}
