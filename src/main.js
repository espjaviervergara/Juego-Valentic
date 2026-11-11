import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { TutorialScene } from './scenes/TutorialScene.js';
import { GameScene } from './scenes/GameScene.js';
import { DiaryScene } from './scenes/DiaryScene.js';
import { ResultScene } from './scenes/ResultScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 960,
  height: 540,
  backgroundColor: '#0d1321',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    MenuScene,
    TutorialScene,
    GameScene,
    DiaryScene,
    ResultScene,
  ],
};

window.ecosBivalentesGame = new Phaser.Game(config);
