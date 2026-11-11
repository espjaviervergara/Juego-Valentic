import { soundManager } from '../systems/SoundManager.js';

export function createPixelButton(scene, x, y, width, height, label, options = {}) {
  const {
    fillColor = 0x2563eb,
    hoverColor = 0x3b82f6,
    borderColor = 0x93c5fd,
    textColor = '#ffffff',
    fontSize = '15px',
    onClick = () => {},
  } = options;

  const container = scene.add.container(x, y);
  const bg = scene.add.graphics();

  const draw = (color, stroke) => {
    bg.clear();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    bg.lineStyle(2, stroke, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
  };
  draw(fillColor, borderColor);

  const text = scene.add.text(0, 0, label, {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize,
    fontStyle: 'bold',
    color: textColor,
    align: 'center',
    wordWrap: { width: width - 18 },
  }).setOrigin(0.5);

  const hitZone = scene.add.rectangle(0, 0, width, height, 0x000000, 0)
    .setInteractive({ useHandCursor: true });

  hitZone.on('pointerover', () => {
    draw(hoverColor, 0xffffff);
    container.setScale(1.02);
  });
  hitZone.on('pointerout', () => {
    draw(fillColor, borderColor);
    container.setScale(1);
  });
  hitZone.on('pointerdown', () => {
    soundManager.playClick();
    onClick();
  });

  container.add([bg, text, hitZone]);
  container.setLabel = (newLabel) => text.setText(newLabel);
  return container;
}

export function drawPanel(scene, x, y, width, height, fill = 0x0f172a, alpha = 0.94, border = 0x64748b) {
  const g = scene.add.graphics();
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x, y, width, height, 10);
  g.lineStyle(2.5, border, 1);
  g.strokeRoundedRect(x, y, width, height, 10);
  return g;
}

export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
