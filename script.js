// Create a single AudioContext instance (reuse it throughout your app)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (type === 'correct') {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine'; // smooth, bell-like tone
        oscillator.frequency.value = 600; // higher pitch for a "ding"
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1);
      } else if (type === 'incorrect') {
        // "Err-err": Two quick beeps
        const now = audioCtx.currentTime;
        
        // First beep:
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'square';
        osc1.frequency.value = 220; // slightly lower pitch than 250 Hz
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.5, now + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2); // beep lasts ~0.2 sec
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.2);
        
        // Second beep:
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'square';
        osc2.frequency.value = 220;
        gain2.gain.setValueAtTime(0, now + 0.25);
        gain2.gain.linearRampToValueAtTime(0.5, now + 0.26);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45); // beep lasts ~0.2 sec
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.25);
        osc2.stop(now + 0.45);
    }
}

// Class representing an individual card.
class Card {
    constructor(shape, position) {
      this.shape = shape;
      this.position = position; // 'left', 'right', or 'center'
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
        if (this.shape === 'circle') {
          cardElement.querySelector('.shape').className = "shape blue-circle";
        } else if (this.shape === 'square') {
          cardElement.querySelector('.shape').className = "shape red-square";
        }
        cardElement.style.display = 'inline-block';
        cardElement.style.transform = "translateX(0)";
      }
    }
  }
  
  
  // Class for a tutorial phase (for a given card shape and expected key).
  class Tutorial {
    constructor(game, cardShape, correctKey) {
      this.game = game;
      this.cardShape = cardShape;
      this.correctKey = correctKey;
      // Bind functions so that they can be properly added and removed as event listeners.
      this.handleSpace = this.handleSpace.bind(this);
      this.checkResponse = this.checkResponse.bind(this);
    }
  
    start() {
      const instruction = document.getElementById('instruction');
      if (this.cardShape === 'square') {
        instruction.textContent =
          "Tutorial: On the left is a circle and on the right is a square. When the card appears, if it is a square, press L. When ready, press spacebar.";
      } else if (this.cardShape === 'circle') {
        instruction.textContent =
          "Tutorial: On the left is a circle and on the right is a square. When the card appears, if it is a circle, press S. When ready, press spacebar.";
      }
      document.addEventListener('keydown', this.handleSpace);
    }
  
    handleSpace(event) {
      if (event.code === 'Space') {
        // Once spacebar is pressed, remove this listener
        document.removeEventListener('keydown', this.handleSpace);
        // Display the center card with the tutorial card shape.
        let centerCard = new Card(this.cardShape, 'center');
        centerCard.render();
        // Now wait for the key press for sorting.
        this.waitForResponse();
      }
    }
  
    waitForResponse() {
      const instruction = document.getElementById('instruction');
      instruction.textContent = "Now, press the corresponding key.";
      document.addEventListener('keydown', this.checkResponse);
    }
  
    checkResponse(event) {
        // Only respond to L or S key presses.
        const key = event.key.toUpperCase();
        if (key !== 'L' && key !== 'S') {
            return;
        }

        const centerElem = document.getElementById('centerCard');
        // If the correct key is pressed.
        if (event.key.toUpperCase() === this.correctKey.toUpperCase()) {
          document.getElementById('instruction').textContent = "Good job!";
          playSound('correct');
          if (this.correctKey.toUpperCase() === 'L') {
            centerElem.style.transform = "translateX(150px)";
          } else if (this.correctKey.toUpperCase() === 'S') {
            centerElem.style.transform = "translateX(-150px)";
          }
          // Remove the listener and move to the next step after a short delay.
          document.removeEventListener('keydown', this.checkResponse);
          setTimeout(() => {
            this.game.nextStep();
          }, 1000);
        } else {
          // For an incorrect response, move the card based on the key pressed and show "try again"
          document.getElementById('instruction').textContent = "Try again. Please press the correct key.";
          playSound('incorrect');
          if (event.key.toUpperCase() === 'L') {
            centerElem.style.transform = "translateX(150px)";
          } else if (event.key.toUpperCase() === 'S') {
            centerElem.style.transform = "translateX(-150px)";
          }
          // After a short delay, reset the card to the center so the user can try again.
          setTimeout(() => {
            centerElem.style.transform = "translateX(0)";
          }, 500);
          // Note: Do not remove the event listener so that the user can try again.
        }
    }
  }
  
  // Class for an individual trial during the game.
  class Trial {
    constructor(game, cardShape, correctKey) {
      this.game = game;
      this.cardShape = cardShape;
      this.correctKey = correctKey;
      this.handleResponse = this.handleResponse.bind(this);
    }
  
    start() {
      // Display the center card for this trial.
      let centerCard = new Card(this.cardShape, 'center');
      centerCard.render();
      document.getElementById('instruction').textContent = "Sort the card using the appropriate key.";
      // Listen for the participant’s response.
      document.addEventListener('keydown', this.handleResponse);
    }
  
    handleResponse(event) {
        // Only respond to L or S key presses.
        const key = event.key.toUpperCase();
        if (key !== 'L' && key !== 'S') {
            return;
        }
        const centerElem = document.getElementById('centerCard');
        // Check if the response is correct.
        if (event.key.toUpperCase() === this.correctKey.toUpperCase()) {
          document.getElementById('instruction').textContent = "Good job!";
          // Move the card according to the correct key.
          if (this.correctKey.toUpperCase() === 'L') {
            playSound('correct');
            centerElem.style.transform = "translateX(150px)";
          } else if (this.correctKey.toUpperCase() === 'S') {
            playSound('correct');
            centerElem.style.transform = "translateX(-150px)";
          }
        } else {
          // For an incorrect response, display message.
          document.getElementById('instruction').textContent = "Incorrect. Moving on.";
          // Move the card based on the key that was pressed if it's one of our valid keys.
          if (event.key.toUpperCase() === 'L') {
            playSound('incorrect');
            centerElem.style.transform = "translateX(150px)";
          } else if (event.key.toUpperCase() === 'S') {
            playSound('incorrect');
            centerElem.style.transform = "translateX(-150px)";
          }
        }
        document.removeEventListener('keydown', this.handleResponse);
        setTimeout(() => {
          this.game.nextTrial();
        }, 1000);
    }
  }
  
  // Main Game class that initializes tutorials and trials.
  class Game {
    constructor() {
      this.tutorials = [];
      this.trials = [];
      this.currentTrialIndex = 0;
    }
  
    init() {
      // Render static cards.
      new Card("Circle", "left").render();
      new Card("Square", "right").render();
  
      // Setup tutorials:
      // First tutorial: sorting a square using the L key.
      this.tutorials.push(new Tutorial(this, "square", "L"));
      // Second tutorial: sorting a circle using the S key.
      this.tutorials.push(new Tutorial(this, "circle", "S"));
  
      // Setup level one trials (for example, 16 trials with random shapes).
      for (let i = 0; i < 16; i++) {
        let shape = Math.random() > 0.5 ? "square" : "circle";
        let correctKey = shape === "square" ? "L" : "S";
        this.trials.push(new Trial(this, shape, correctKey));
      }
  
      // Begin with the first tutorial.
      this.startNextTutorial();
    }
  
    startNextTutorial() {
      if (this.tutorials.length > 0) {
        let tutorial = this.tutorials.shift();
        tutorial.start();
      } else {
        // After tutorials, prompt to start the trials.
        document.getElementById('instruction').textContent = "Tutorials complete. Press spacebar to start the trials.";
        document.addEventListener('keydown', this.startTrials.bind(this));
      }
    }
  
    startTrials(event) {
      if (event.code === 'Space') {
        document.removeEventListener('keydown', this.startTrials.bind(this));
        this.nextTrial();
      }
    }
  
    nextTrial() {
      // Clear the center card for the next trial.
      const centerCardElem = document.getElementById('centerCard');
      centerCardElem.style.display = "none";
      centerCardElem.style.transform = "translateX(0)";
      // Show the center card element for the next trial.
      centerCardElem.style.display = "inline-block";
  
      if (this.currentTrialIndex < this.trials.length) {
        this.trials[this.currentTrialIndex].start();
        this.currentTrialIndex++;
      } else {
        document.getElementById('instruction').textContent = "Game complete. Thank you for playing!";
      }
    }
  
    nextStep() {
      // Called after each tutorial completes.
      this.startNextTutorial();
    }
  }
  
  // Start the game once the DOM is fully loaded.
  document.addEventListener("DOMContentLoaded", function () {
    let game = new Game();
    game.init();
  });
  