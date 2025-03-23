/* ---------- Helper: Play Sound ---------- */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  if (type === 'correct') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1);
  } else if (type === 'incorrect') {
    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'square';
    osc1.frequency.value = 220;
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.5, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'square';
    osc2.frequency.value = 220;
    gain2.gain.setValueAtTime(0, now + 0.25);
    gain2.gain.linearRampToValueAtTime(0.5, now + 0.26);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.25);
    osc2.stop(now + 0.45);
  }
}

/* ---------- Card Class ---------- */
class Card {
  constructor(shape, color, position) {
    // shape: "circle" or "square"
    // color: "red" or "blue"
    this.shape = shape;
    this.color = color;
    this.position = position;
  }
  render() {
    let cardElement;
    if (this.position === 'left') {
      cardElement = document.getElementById('leftCard');
      cardElement.querySelector('.shape').className = "shape red-circle";
    } else if (this.position === 'right') {
      cardElement = document.getElementById('rightCard');
      cardElement.querySelector('.shape').className = "shape blue-square";
    } else if (this.position === 'center') {
      cardElement = document.getElementById('centerCard');
      // Build a class string like "red-square" or "blue-circle"
      let classStr = `${this.color}-${this.shape}`;
      cardElement.querySelector('.shape').className = `shape ${classStr}`;
      cardElement.style.display = 'inline-block';
      cardElement.style.transform = "translateX(0)";
    }
  }
}

/* ---------- Level 1 (Shape-based) ---------- */
class Level1 {
  constructor(game) {
    this.game = game;
  }

  startTutorials() {
    // We want circle → S (left), square → L (right)
    // So let's fix the instructions accordingly.

    // Tutorial 1: If center card is a circle, press S.
    document.getElementById('instruction').textContent =
      "Level 1 Tutorial 1: If the center card is a circle, press S. Press spacebar to start.";
    
    const tutorial1SpaceHandler = (e) => {
      if (e.code === 'Space') {
        document.removeEventListener('keydown', tutorial1SpaceHandler);
        // Show center card as circle: shape="circle", color="blue"
        let card = new Card("circle", "blue", "center");
        card.render();
        this.waitTutorialResponse("S", () => {
          this.startTutorial2();
        });
      }
    };
    document.addEventListener('keydown', tutorial1SpaceHandler);
  }

  startTutorial2() {
    // Tutorial 2: If the center card is a square, press L.
    document.getElementById('instruction').textContent =
      "Level 1 Tutorial 2: If the center card is a square, press L. Press spacebar to start.";
    
    const tutorial2SpaceHandler = (e) => {
      if (e.code === 'Space') {
        document.removeEventListener('keydown', tutorial2SpaceHandler);
        // Show center card as square: shape="square", color="red"
        let card = new Card("square", "red", "center");
        card.render();
        this.waitTutorialResponse("L", () => {
          // After tutorials, start trials.
          this.game.startTrialsLevel1();
        });
      }
    };
    document.addEventListener('keydown', tutorial2SpaceHandler);
  }

  waitTutorialResponse(correctKey, callback) {
    const instruction = document.getElementById('instruction');
    instruction.textContent = "Now, press the corresponding key.";
    
    const handler = (e) => {
      const key = e.key.toUpperCase();
      if (key !== 'L' && key !== 'S') return;
      if (key === correctKey) {
        document.removeEventListener('keydown', handler);
        playSound('correct');
        instruction.textContent = "Good job!";
        setTimeout(callback, 1000);
      } else {
        playSound('incorrect');
        instruction.textContent = "Try again. Press the correct key.";
      }
    };
    document.addEventListener('keydown', handler);
  }

  // For simplicity, we simulate 16 trials with a message
  runTrials() {
    document.getElementById('instruction').textContent =
      "Starting Level 1 trials (16 trials).";
    // In a real implementation, you'd loop through 16 trial instances.
    setTimeout(() => {
      this.game.levelComplete(1);
    }, 2000);
  }

  start() {
    this.startTutorials();
  }
}

/* ---------- Level 2 (Color-based) ---------- */
class Level2 {
  constructor(game) {
    this.game = game;
  }

  startTutorials() {
    // In color-based sorting, let's do:
    // red-square → S, blue-circle → L

    // Tutorial 1: If the center card is a red square, press S.
    document.getElementById('instruction').textContent =
      "Level 2 Tutorial 1: If the center card is a red square, press S. Press spacebar to start.";
    
    const tutorial1SpaceHandler = (e) => {
      if (e.code === 'Space') {
        document.removeEventListener('keydown', tutorial1SpaceHandler);
        let card = new Card("square", "red", "center"); // red square
        card.render();
        this.waitTutorialResponse("S", () => {
          // Next tutorial
          this.startTutorial2();
        });
      }
    };
    document.addEventListener('keydown', tutorial1SpaceHandler);
  }

  startTutorial2() {
    document.getElementById('instruction').textContent =
      "Level 2 Tutorial 2: If the center card is a blue circle, press L. Press spacebar to start.";
    
    const tutorial2SpaceHandler = (e) => {
      if (e.code === 'Space') {
        document.removeEventListener('keydown', tutorial2SpaceHandler);
        let card = new Card("circle", "blue", "center"); // blue circle
        card.render();
        this.waitTutorialResponse("L", () => {
          // After tutorials, start the single trial
          this.game.startTrialsLevel2();
        });
      }
    };
    document.addEventListener('keydown', tutorial2SpaceHandler);
  }

  waitTutorialResponse(correctKey, callback) {
    const instruction = document.getElementById('instruction');
    instruction.textContent = "Now, press the corresponding key.";
    
    const handler = (e) => {
      const key = e.key.toUpperCase();
      if (key !== 'L' && key !== 'S') return;
      if (key === correctKey) {
        document.removeEventListener('keydown', handler);
        playSound('correct');
        instruction.textContent = "Good job!";
        setTimeout(callback, 1000);
      } else {
        playSound('incorrect');
        instruction.textContent = "Try again. Press the correct key.";
      }
    };
    document.addEventListener('keydown', handler);
  }

  runTrials() {
    document.getElementById('instruction').textContent =
      "Starting Level 2 trial (only 1).";
    // For Level 2, we just run 1 trial: red square => S
    setTimeout(() => {
      let card = new Card("square", "red", "center");
      card.render();
      this.waitTrialResponse("S", () => {
        this.game.levelComplete(2);
      });
    }, 500);
  }

  waitTrialResponse(correctKey, callback) {
    const instruction = document.getElementById('instruction');
    instruction.textContent = "Now, press the corresponding key for the trial.";
    
    const handler = (e) => {
      const key = e.key.toUpperCase();
      if (key !== 'L' && key !== 'S') return;
      if (key === correctKey) {
        document.removeEventListener('keydown', handler);
        playSound('correct');
        instruction.textContent = "Good job!";
        setTimeout(callback, 1000);
      } else {
        playSound('incorrect');
        instruction.textContent = "Incorrect. Moving on.";
        document.removeEventListener('keydown', handler);
        setTimeout(callback, 1000);
      }
    };
    document.addEventListener('keydown', handler);
  }

  start() {
    this.startTutorials();
  }
}

/* ---------- Level3 (Placeholder) ---------- */
class Level3 {
  constructor(game) { this.game = game; }
  start() {
    console.log("Level 3 placeholder: not implemented yet.");
    document.getElementById('instruction').textContent =
      "Level 3 is not implemented yet. Thanks for playing!";
  }
}

/* ---------- Game Class ---------- */
class Game {
  constructor() {
    this.currentLevel = 1;
  }

  startLevel() {
    if (this.currentLevel === 1) {
      const lvl1 = new Level1(this);
      lvl1.start();
    } else if (this.currentLevel === 2) {
      const lvl2 = new Level2(this);
      lvl2.start();
    } else if (this.currentLevel === 3) {
      const lvl3 = new Level3(this);
      lvl3.start();
    }
  }

  startTrialsLevel1() {
    // For Level 1, after tutorials, run trials.
    const lvl1 = new Level1(this);
    lvl1.runTrials();
  }

  startTrialsLevel2() {
    // For Level 2, after tutorials, run 1 trial
    const lvl2 = new Level2(this);
    lvl2.runTrials();
  }

  levelComplete(level) {
    const instruction = document.getElementById('instruction');
    instruction.textContent = `Level ${level} complete. Press spacebar to continue to the next level.`;
    
    const nextLevelHandler = (e) => {
      if (e.code === 'Space') {
        document.removeEventListener('keydown', nextLevelHandler);
        this.currentLevel++;
        this.startLevel();
      }
    };
    document.addEventListener('keydown', nextLevelHandler);
  }
}

/* ---------- DOMContentLoaded ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Render the reference cards for Level 1 initially
  function renderReferenceCards(level) {
    const container = document.getElementById('referenceCards');
    container.innerHTML = "";
    if (level === 1 || level === 2) {
      const left = document.createElement('div');
      left.className = "card";
      left.innerHTML = '<div class="shape red-circle"></div>';
      const right = document.createElement('div');
      right.className = "card";
      right.innerHTML = '<div class="shape blue-square"></div>';
      container.appendChild(left);
      container.appendChild(right);
    } else if (level === 3) {
      container.innerHTML = "Level 3 reference cards (placeholder)";
    }
  }
  renderReferenceCards(1);

  // Start the game
  const game = new Game();
  game.startLevel();
});
