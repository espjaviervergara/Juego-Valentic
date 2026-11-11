import { soundManager } from '../systems/SoundManager.js';
import { createPixelButton, drawPanel } from '../ui/UIHelpers.js';

export class TutorialScene extends Phaser.Scene {
  constructor() {
    super('TutorialScene');
  }

  create() {
    const { width, height } = this.scale;
    soundManager.attachPhaser(this);
    soundManager.playBGM('bgm_menu');
    soundManager.playVoice('valentic_welcome');

    this.add.image(width / 2, height / 2, 'bg_cuarto').setDisplaySize(width, height).setTint(0x64748b);

    // Estilo cuaderno abierto fiel a la Pantalla de Instrucciones del diseño
    drawPanel(this, 44, 30, width - 88, height - 60, 0xf8f5eb, 0.98, 0x334155);

    // Espiral visual del cuaderno al centro-izquierda
    for (let y = 55; y < height - 55; y += 26) {
      this.add.rectangle(54, y, 18, 8, 0x334155).setStrokeStyle(1, 0x0f172a);
    }

    this.add.text(width / 2 + 20, 62, 'GUÍA DEL SEMÁFORO EMOCIONAL DE VALENTIC', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '21px',
      fontStyle: 'bold',
      color: '#1e293b',
    }).setOrigin(0.5);

    // Valentic exacto explicando su semáforo
    this.add.image(186, 290, 'valentic').setScale(1.45);
    this.add.text(186, 448, 'Valentic te acompaña\nsin decidir por ti', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#1e3a8a',
      align: 'center',
    }).setOrigin(0.5);

    const steps = [
      {
        color: 0xdc2626,
        title: '1. LUZ ROJA (¡ALTO!) · Pausa Activa',
        desc: 'Cuando recibas una provocación o grito, mantén el botón de respirar (o ESPACIO)\npara activar el sistema parasimpático (4s/6s) y frenar el impulso violento.',
      },
      {
        color: 0xd97706,
        title: '2. LUZ AMARILLA (¡PENSAR!) · Descodifica y Transmuta',
        desc: 'Primero usa la Lupa de Empatía para identificar la necesidad oculta del otro (+1 ⚡).\nLuego gasta tu Energía ⚡ antes de que venza el reloj para refutar a La Sombra.',
      },
      {
        color: 0x16a34a,
        title: '3. LUZ VERDE (¡ACTUAR!) · Bloques CNV',
        desc: 'Ensambla tu respuesta en orden exacto: [Hecho objetivo] + [Sentimiento] + [Petición].\nEvita insultos o acusaciones para subir el Clima de Convivencia (>60% para ganar el día).',
      },
    ];

    steps.forEach((st, idx) => {
      const y = 104 + idx * 102;
      drawPanel(this, 318, y, 566, 88, 0xffffff, 0.96, st.color);
      this.add.circle(344, y + 44, 14, st.color);
      this.add.text(370, y + 16, st.title, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#0f172a',
      });
      this.add.text(370, y + 40, st.desc, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '12.5px',
        color: '#334155',
        lineSpacing: 4,
      });
    });

    // Barra explicativa inferior
    this.add.text(598, 422, 'Cuida tus 3 Vínculos de Apoyo (♥): si Tensión llega al 100% o Clima al 0%, pierdes 1 vínculo.', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '12.5px',
      fontStyle: 'bold',
      color: '#7f1d1d',
    }).setOrigin(0.5);

    createPixelButton(this, 600, 468, 220, 42, '¡Entendido! Volver', {
      fillColor: 0x16a34a,
      hoverColor: 0x22c55e,
      borderColor: 0x14532d,
      onClick: () => {
        soundManager.stopVoice();
        this.scene.start('MenuScene');
      },
    });
  }
}
