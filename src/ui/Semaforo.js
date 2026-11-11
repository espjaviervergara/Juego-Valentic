export class SemaforoWidget {
  constructor(scene, x, y) {
    this.scene = scene;
    this.container = scene.add.container(x, y).setDepth(35);
    this.activeLight = null;
    this.build();
  }

  build() {
    const s = this.scene;

    // Tarjeta compacta del Semáforo de Valentic (Rojo -> Amarillo -> Verde)
    const panel = s.add.graphics();
    panel.fillStyle(0x0f172a, 0.9);
    panel.fillRoundedRect(-96, -8, 192, 82, 10);
    panel.lineStyle(2, 0x3b82f6, 0.9);
    panel.strokeRoundedRect(-96, -8, 192, 82, 10);
    this.container.add(panel);

    const title = s.add.text(0, 4, 'SEMÁFORO VALENTIC', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#93c5fd',
    }).setOrigin(0.5);
    this.container.add(title);

    // Tres luces horizontales claras: Rojo (Alto), Amarillo (Pensar), Verde (Actuar)
    const specs = [
      { key: 'red', x: -56, color: 0xef4444, label: 'ALTO' },
      { key: 'yellow', x: 0, color: 0xf59e0b, label: 'PENSAR' },
      { key: 'green', x: 56, color: 0x22c55e, label: 'ACTUAR' },
    ];

    this.lights = {};
    specs.forEach((sp) => {
      const glow = s.add.circle(sp.x, 32, 16, sp.color, 0.15);
      const circle = s.add.circle(sp.x, 32, 11, sp.color, 0.3);
      circle.setStrokeStyle(1.5, 0xcbd5e1, 0.7);
      const lbl = s.add.text(sp.x, 54, sp.label, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#94a3b8',
      }).setOrigin(0.5);
      this.container.add([glow, circle, lbl]);
      this.lights[sp.key] = { glow, circle, lbl, color: sp.color };
    });

    this.statusText = s.add.text(0, 66, 'Observando...', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '10px',
      color: '#e2e8f0',
    }).setOrigin(0.5);
    this.container.add(this.statusText);
  }

  setState(lightKey, caption) {
    this.activeLight = lightKey;
    Object.entries(this.lights).forEach(([k, obj]) => {
      const isOn = k === lightKey;
      obj.circle.setFillStyle(obj.color, isOn ? 1 : 0.22);
      obj.glow.setFillStyle(obj.color, isOn ? 0.42 : 0.05);
      obj.lbl.setColor(isOn ? '#ffffff' : '#64748b');
    });
    if (caption) {
      this.statusText.setText(caption);
    }
  }

  destroy() {
    this.container.destroy();
  }
}
