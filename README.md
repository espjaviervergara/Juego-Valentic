# Ecos Bivalentes: Entre el Grito y el Eco

Videojuego educativo web desarrollado en **Phaser 3** para estudiantes de educación básica y media de la Institución Educativa Ángela María Torres Suárez (Proyecto STEAM Grado 11° · **ValenTIC-INSTECAMISTA**). El proyecto aborda la deconstrucción de patrones de hostilidad intrafamiliar y su réplica en el aula a través de la autorregulación emocional, la empatía y la Comunicación No Violenta (CNV).

---

## 📋 Descripción del Proyecto

En *Ecos Bivalentes*, el jugador acompaña a **Alex**, un estudiante expuesto a dinámicas de confrontación en el hogar que traslada de manera reactiva al entorno escolar. Mediante la intervención de **Valentic** (mentor del Semáforo Emocional), el jugador aprende a frenar las respuestas automáticas de **La Sombra** (su diálogo interno hostil), descodificar la tensión ajena y estructurar soluciones asertivas en cinco jornadas escolares (Lunes a Viernes).

---

## 🎯 Objetivos de Aprendizaje

- **Autorregulación Emocional:** Reconocer señales fisiológicas de tensión (VFC) y ejecutar pausas activas antes de emitir una respuesta.
- **Empatía Cognitiva:** Identificar necesidades o frustraciones no resueltas detrás de conductas agresivas ajenas.
- **Comunicación Asertiva:** Construir mensajes basados en el modelo de Comunicación No Violenta (*Hecho objetivo + Sentimiento + Petición concreta*).

---

## 🕹️ Mecánicas Principales (Sistema de Resolución de Conflictos - SRC)

Estandarizado con el **Semáforo Emocional de Valentic**:

1. **Luz Roja — ¡ALTO! (Pausa Activa Somática):** Pausa respiratoria guiada (activación del sistema parasimpático / nervio vago) para detener el impulso reactivo inicial.
2. **Luz Amarilla — ¡PENSAR! (Descodificador y Transmutación de la Sombra):**
   - *Descodificador de Hostilidad:* Análisis de la emoción o necesidad oculta detrás de la agresión para generar *Energía de Autocuidado*.
   - *Transmutación de la Sombra:* Refutación cognitiva con temporizador para transformar el diálogo interno hostil en protección consciente.
3. **Luz Verde — ¡ACTUAR! (Bloques CNV):** Ensamble modular de intervenciones asertivas (`Hecho + Sentimiento + Petición`) seguido del *Espejo de Consecuencias* y el desbloqueo del *Diario de Convivencia*.

---

## 🛠️ Tecnologías Empleadas

- **Motor:** [Phaser 3](https://phaser.io/) (`v3.80.1`, incluido localmente en `lib/phaser.min.js` para uso offline y escolar)
- **Lenguaje:** JavaScript (ES6+ Modules), HTML5, CSS3
- **Estilo Visual:** Pixel Art 16-bit (`pixelArt: true`)
- **Estructura de Datos:** JSON modular para las 5 jornadas, dilemas, bloques CNV y diario reflexivo

---

## 🚀 Cómo ejecutarlo localmente

Como el juego carga módulos ES6 y `src/data/dialogues.json`, debe abrirse desde un servidor HTTP local (no directamente con `file://`):

```bash
python3 -m http.server 8080
```

Luego abre `http://localhost:8080` en tu navegador.

---

## 📂 Estructura de Carpetas

```text
Juego-Valentic/
├── index.html                    # Punto de entrada HTML5
├── style.css                     # Estilos y marco responsivo
├── lib/
│   └── phaser.min.js             # Phaser 3 local (funciona sin internet)
├── src/
│   ├── main.js                   # Configuración del juego y registro de escenas
│   ├── data/
│   │   └── dialogues.json        # 5 jornadas (Lunes a Viernes) y Diario de Convivencia
│   ├── systems/
│   │   ├── GameState.js          # Estado, reglas, humor latente y persistencia localStorage
│   │   └── SoundManager.js       # Efectos de sonido retro vía Web Audio API
│   ├── ui/
│   │   ├── HUD.js                # Barras VFC/Convivencia, Vínculos y Energía de Autocuidado
│   │   ├── Semaforo.js           # Componente visual del Semáforo de Valentic
│   │   └── UIHelpers.js          # Botones, paneles y utilidades UI
│   └── scenes/
│       ├── BootScene.js          # Precarga de assets y JSON
│       ├── MenuScene.js          # Pantalla de título, selector de días y ajustes
│       ├── TutorialScene.js      # Cuaderno de instrucciones con Valentic
│       ├── GameScene.js          # Bucle principal del SRC y Espejo de Consecuencias
│       ├── DiaryScene.js         # Coleccionable Diario de Convivencia
│       └── ResultScene.js        # Balance de jornada y gráfico STEAM
└── assets/
    ├── backgrounds/              # 5 entornos unificados (Hogar, Cuarto, Colegio Int/Ext, Orientación)
    └── sprites/                  # Valentic (campaña), Alex, La Sombra, Elena, Mateo, Sofía, Profe Ricardo
```
