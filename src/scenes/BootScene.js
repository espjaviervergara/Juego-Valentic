import { gameState } from '../systems/GameState.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.scale;

    // Barra de carga limpia
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d1321);
    this.add.text(width / 2, height / 2 - 42, 'Ecos Bivalentes: Entre el Grito y el Eco', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#f8fafc',
    }).setOrigin(0.5);

    const track = this.add.rectangle(width / 2, height / 2 + 8, 360, 18, 0x1e293b);
    track.setStrokeStyle(2, 0x475569);
    const bar = this.add.rectangle(width / 2 - 176, height / 2 + 8, 4, 12, 0x38bdf8).setOrigin(0, 0.5);
    const label = this.add.text(width / 2, height / 2 + 36, 'Cargando recursos...', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    this.load.on('progress', (val) => {
      bar.width = Math.max(4, 352 * val);
      label.setText(`Cargando recursos... ${Math.round(val * 100)}%`);
    });

    // Base de datos narrativa
    this.load.json('dialogues', './src/data/dialogues.json');

    // Escenarios unificados (5 entornos limpios)
    this.load.image('bg_hogar', './assets/backgrounds/bg_hogar.png');
    this.load.image('bg_cuarto', './assets/backgrounds/bg_cuarto.png');
    this.load.image('bg_colegio_interior', './assets/backgrounds/bg_colegio_interior.png');
    this.load.image('bg_colegio_exterior', './assets/backgrounds/bg_colegio_exterior.png');
    this.load.image('bg_orientacion', './assets/backgrounds/bg_orientacion.png');

    // Sprites de personajes (incluyendo Valentic exacto de campaña)
    this.load.image('valentic', './assets/sprites/valentic_semaforo.png');
    this.load.image('alex_tense', './assets/sprites/alex_tense.png');
    this.load.image('alex_calm', './assets/sprites/alex_calm.png');
    this.load.image('sombra_hostil', './assets/sprites/sombra_hostil.png');
    this.load.image('sombra_protectora', './assets/sprites/sombra_protectora.png');
    this.load.image('elena', './assets/sprites/elena.png');
    this.load.image('mateo', './assets/sprites/mateo.png');
    this.load.image('sofia', './assets/sprites/sofia.png');
    this.load.image('profe_ricardo', './assets/sprites/profe_ricardo.png');
  }

  create() {
    gameState.dialogues = this.cache.json.get('dialogues');
    this.scene.start('MenuScene');
  }
}
