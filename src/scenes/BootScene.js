import { gameState } from '../systems/GameState.js';
import { soundManager } from '../systems/SoundManager.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.scale;

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
    const label = this.add.text(width / 2, height / 2 + 36, 'Cargando gráficos, música y voces...', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    this.load.on('progress', (val) => {
      bar.width = Math.max(4, 352 * val);
      label.setText(`Cargando gráficos, música y voces... ${Math.round(val * 100)}%`);
    });

    // Base de datos narrativa y encolado dinámico de voces de escenas
    this.load.once('filecomplete-json-dialogues', (_key, _type, data) => {
      if (!data?.days) return;
      data.days.forEach((day) => {
        day.scenes.forEach((sc) => {
          const sid = sc.id;
          sc.introLines.forEach((_, idx) => {
            this.load.audio(`${sid}_intro_${idx}`, `./assets/audio/voices/${sid}_intro_${idx}.mp3`);
          });
          this.load.audio(`${sid}_prov`, `./assets/audio/voices/${sid}_prov.mp3`);
          this.load.audio(`${sid}_shadow`, `./assets/audio/voices/${sid}_shadow.mp3`);
          this.load.audio(`${sid}_cnv_clean`, `./assets/audio/voices/${sid}_cnv_clean.mp3`);
          this.load.audio(`${sid}_mirror_pos`, `./assets/audio/voices/${sid}_mirror_pos.mp3`);
          this.load.audio(`${sid}_mirror_neg`, `./assets/audio/voices/${sid}_mirror_neg.mp3`);
        });
      });
    });

    this.load.json('dialogues', './src/data/dialogues.json');

    // Música ambiental (4 pistas en bucle)
    this.load.audio('bgm_menu', './assets/audio/bgm/bgm_menu.m4a');
    this.load.audio('bgm_hogar', './assets/audio/bgm/bgm_hogar.m4a');
    this.load.audio('bgm_colegio', './assets/audio/bgm/bgm_colegio.m4a');
    this.load.audio('bgm_tenso', './assets/audio/bgm/bgm_tenso.m4a');

    // Voces de Valentic
    [
      'valentic_welcome',
      'valentic_red',
      'valentic_yellow',
      'valentic_shadow',
      'valentic_green',
      'valentic_win',
    ].forEach((vk) => {
      this.load.audio(vk, `./assets/audio/voices/${vk}.mp3`);
    });

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
    soundManager.attachPhaser(this);
    this.scene.start('MenuScene');
  }
}
