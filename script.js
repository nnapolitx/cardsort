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
    // Tutorial 1: If center card is circle, press S.
    document.getElementById('instruction').textContent =
      "Level 1 Tutorial 1: If the center card is a circle, press S. Press spacebar to start.";
    
    const tutorial1SpaceHandler = (e) => {
      if (e.code === 'Space') {
        document.removeEventListener('keydown', tutorial1SpaceHandler);
        // Show center card as circle: shape = "circle", color = "blue"
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
    // Tutorial 2: If center card is square, press L.
    document.getElementById('instruction').textContent =
      "Level 1 Tutorial 2: If the center card is a square, press L. Press spacebar to start.";
    
    const tutorial2SpaceHandler = (e) => {
      if (e.code === 'Space') {
        document.removeEventListener('keydown', tutorial2SpaceHandler);
        // Show center card as square: shape = "square", color = "red"
        let card = new Card("square", "red", "center");
        card.render();
        this.waitTutorialResponse("L", () => {
          // Instead of directly starting trials, prompt the user with additional instructions.
          this.promptStartRealTrials();
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
      document.removeEventListener('keydown', handler);
      
      const centerCardElem = document.getElementById("centerCard");
      // Move the card based on the key pressed:
      if (key === 'S') {
        centerCardElem.style.transform = "translateX(-72px)";
      } else if (key === 'L') {
        centerCardElem.style.transform = "translateX(72px)";
      }
      
      if (key === correctKey) {
        playSound('correct');
        instruction.textContent = "Good job!";
        setTimeout(callback, 1000);
      } else {
        playSound('incorrect');
        instruction.textContent = "Try again. Press the correct key.";
        // (Leave the listener removed so they must press again)
      }
    };
    document.addEventListener('keydown', handler);
  }
  
  promptStartRealTrials() {
    const instruction = document.getElementById('instruction');
    instruction.textContent =
      "Good job. Now we are going to start the real trial. You will have to correctly sort the center card based on its shape 16 times. Remember, the circle goes to the left (S key) and the square to the right (L key). When you are ready, press the spacebar to begin.";
    
    const promptHandler = (e) => {
      if (e.code === 'Space') {
        document.removeEventListener('keydown', promptHandler);
        this.game.startTrialsLevel1();
      }
    };
    document.addEventListener('keydown', promptHandler);
  }
  
  runTrials() {
    // Initialize trial count and start the loop.
    this.currentTrialIndex = 0;
    this.totalTrials = 16;
    this.doNextTrial();
  }

  doNextTrial() {
    if (this.currentTrialIndex >= this.totalTrials) {
      this.game.levelComplete(1);
      return;
    }
    // Randomly choose a card:
    // If the card is a circle, it will be blue and the correct key is S (move left).
    // If the card is a square, it will be red and the correct key is L (move right).
    const isCircle = Math.random() > 0.5;
    const shape = isCircle ? "circle" : "square";
    const color = isCircle ? "blue" : "red";
    const correctKey = isCircle ? "S" : "L";
    
    let card = new Card(shape, color, "center");
    card.render();
    
    this.waitTrialResponse(correctKey, () => {
      this.currentTrialIndex++;
      this.doNextTrial();
    });
  }

  waitTrialResponse(correctKey, callback) {
    const instruction = document.getElementById('instruction');
    instruction.textContent = "Sort the card using the correct key.";
    
    const handler = (e) => {
      const key = e.key.toUpperCase();
      if (key !== 'L' && key !== 'S') return;
      document.removeEventListener('keydown', handler);
      
      const centerElem = document.getElementById('centerCard');
      if (key === correctKey) {
        playSound('correct');
        instruction.textContent = "Good job!";
      } else {
        playSound('incorrect');
        instruction.textContent = "Incorrect. Moving on.";
      }
      
      if (key === 'S') {
        centerElem.style.transform = "translateX(-72px)";
      } else if (key === 'L') {
        centerElem.style.transform = "translateX(72px)";
      }
      
      setTimeout(() => {
        centerElem.style.transform = "translateX(0)";
        callback();
      }, 1000);
    };
    document.addEventListener('keydown', handler);
  }

  start() {
    this.startTutorials();
  }
}

/* ---------- Level 2 (Color-based) ---------- */
class Level2 {
  constructor(game) {
    this.game = game;
    this.currentTrialIndex = 0;
    this.totalTrials = 16; // Adjust as needed.
  }

  startTutorials() {
    // Tutorial 1: If the center card is a red square, press S.
    document.getElementById('instruction').textContent =
      "Level 2 Tutorial 1: If the center card is a red square, press S. Press spacebar to start.";
    
    const tutorial1SpaceHandler = (e) => {
      if (e.code === 'Space') {
        document.removeEventListener('keydown', tutorial1SpaceHandler);
        let card = new Card("square", "red", "center"); // red square
        card.render();
        this.waitTutorialResponse("S", () => {
          this.startTutorial2();
        });
      }
    };
    document.addEventListener('keydown', tutorial1SpaceHandler);
  }

  startTutorial2() {
    // Tutorial 2: If the center card is a blue circle, press L.
    document.getElementById('instruction').textContent =
      "Level 2 Tutorial 2: If the center card is a blue circle, press L. Press spacebar to start.";
    
    const tutorial2SpaceHandler = (e) => {
      if (e.code === 'Space') {
        document.removeEventListener('keydown', tutorial2SpaceHandler);
        let card = new Card("circle", "blue", "center"); // blue circle
        card.render();
        this.waitTutorialResponse("L", () => {
          // After tutorials, prompt to start trials.
          this.promptStartRealTrials();
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
      document.removeEventListener('keydown', handler);
      
      const centerCardElem = document.getElementById("centerCard");
      // Move the card based on the key pressed:
      if (key === 'S') {
        centerCardElem.style.transform = "translateX(-72px)";
      } else if (key === 'L') {
        centerCardElem.style.transform = "translateX(72px)";
      }
      
      if (key === correctKey) {
        playSound('correct');
        instruction.textContent = "Good job!";
        setTimeout(() => {
          centerCardElem.style.transform = "translateX(0)";
          callback();
        }, 1000);
      } else {
        playSound('incorrect');
        instruction.textContent = "Try again. Press the correct key.";
        // Do not re-add listener here; the user must try again.
      }
    };
    document.addEventListener('keydown', handler);
  }

  promptStartRealTrials() {
    const instruction = document.getElementById('instruction');
    instruction.textContent =
      "Good job. Now we are going to start the real trial. You will have to correctly sort the center card based on its color 16 times. Remember: if the card is a red square, press S (it moves left), and if it's a blue circle, press L (it moves right). When you are ready, press the spacebar to begin.";
    
    const promptHandler = (e) => {
      if (e.code === 'Space') {
        document.removeEventListener('keydown', promptHandler);
        this.runTrials();
      }
    };
    document.addEventListener('keydown', promptHandler);
  }

  runTrials() {
    this.currentTrialIndex = 0;
    this.totalTrials = 16;
    this.doNextTrial();
  }

  doNextTrial() {
    if (this.currentTrialIndex >= this.totalTrials) {
      this.game.levelComplete(2);
      return;
    }
    // For color-based sorting:
    // Randomly choose a trial: if the card is red, show a red square (correct key S);
    // if blue, show a blue circle (correct key L).
    const isRed = Math.random() > 0.5;
    const shape = isRed ? "square" : "circle";
    const color = isRed ? "red" : "blue";
    const correctKey = isRed ? "S" : "L";

    let card = new Card(shape, color, "center");
    card.render();

    this.waitTrialResponse(correctKey, () => {
      this.currentTrialIndex++;
      this.doNextTrial();
    });
  }

  waitTrialResponse(correctKey, callback) {
    const instruction = document.getElementById('instruction');
    instruction.textContent = "Sort the card using the correct key.";
    
    const handler = (e) => {
      const key = e.key.toUpperCase();
      if (key !== 'L' && key !== 'S') return;
      document.removeEventListener('keydown', handler);
      
      const centerElem = document.getElementById('centerCard');
      if (key === correctKey) {
        playSound('correct');
        instruction.textContent = "Good job!";
      } else {
        playSound('incorrect');
        instruction.textContent = "Incorrect. Moving on.";
      }
      
      if (key === 'S') {
        centerElem.style.transform = "translateX(-72px)";
      } else if (key === 'L') {
        centerElem.style.transform = "translateX(72px)";
      }
      
      setTimeout(() => {
        centerElem.style.transform = "translateX(0)";
        callback();
      }, 1000);
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
