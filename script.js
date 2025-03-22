// Global variables to store response data and a trial counter.
let responseData = [];
let trialCount = 1;

// Function to download the recorded data as a CSV file.
function downloadCSV(data, filename) {
  let csv = 'level,tutorial,trial,answer,response,rt\n';
  data.forEach(row => {
    csv += `${row.level},${row.tutorial},${row.trial},${row.answer},${row.response},${row.rt}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

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
      this.startTime = Date.now();
      document.addEventListener('keydown', this.checkResponse);
    }
  
    checkResponse(event) {
        // Only respond to L or S key presses.
        const key = event.key.toUpperCase();
        if (key !== 'L' && key !== 'S') {
            return;
        }

        const centerElem = document.getElementById('centerCard');
        const rt = Date.now() - this.startTime; // reaction time in ms
        const isCorrect = key === this.correctKey.toUpperCase() ? 1 : 0;

        // Record the data.
        responseData.push({
            level: 1,
            tutorial: 1, // tutorial phase
            trial: trialCount,
            answer: this.correctKey.toUpperCase(),
            response: isCorrect,
            rt: rt
        });
        trialCount++;
        
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

// class for running the trials
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
      // Record the start time.
      this.startTime = Date.now();
      // Listen for the participant's response.
      document.addEventListener('keydown', this.handleResponse);
    }
  
    handleResponse(event) {
      // Only respond to L or S key presses.
      const key = event.key.toUpperCase();
      if (key !== 'L' && key !== 'S') return;
      
      const centerElem = document.getElementById('centerCard');
      const rt = Date.now() - this.startTime; // Reaction time in ms
      const isCorrect = key === this.correctKey.toUpperCase() ? 1 : 0;
  
      // Record the trial data.
      responseData.push({
        level: this.game.currentLevel,  // Use the current level from the game instance.
        tutorial: 0,                    // 0 indicates a real trial.
        trial: trialCount,
        answer: this.correctKey.toUpperCase(),
        response: isCorrect,
        rt: rt
      });
      trialCount++;
      
      if (isCorrect) {
        document.getElementById('instruction').textContent = "Good job!";
        playSound('correct'); 
        if (this.correctKey.toUpperCase() === 'L') {
          centerElem.style.transform = "translateX(150px)";
        } else if (this.correctKey.toUpperCase() === 'S') {
          centerElem.style.transform = "translateX(-150px)";
        }
      } else {
        document.getElementById('instruction').textContent = "Incorrect. Moving on.";
        playSound('incorrect'); 
        if (key === 'L') {
          centerElem.style.transform = "translateX(150px)";
        } else if (key === 'S') {
          centerElem.style.transform = "translateX(-150px)";
        }
      }
      document.removeEventListener('keydown', this.handleResponse);
      setTimeout(() => {
        this.game.nextTrial();
      }, 1000);
    }
  }
  
  // Class for the game.
  class Game {
    constructor() {
      this.tutorials = [];
      this.trials = [];
      this.currentTrialIndex = 0;
      this.currentLevel = 1;
      this.totalLevels = 3;
      // Bind the level transition handlers.
      this.handleLevelContinue = this.handleLevelContinue.bind(this);
      this.handleLevel2Decision = this.handleLevel2Decision.bind(this);
    }
  
    // Load the tutorials and trials for a given level.
    loadLevel(level) {
      // Reset tutorials and trials.
      this.tutorials = [];
      this.trials = [];
      // Example: set up tutorials and trials for each level.
      // For level 1, we add two tutorials and 16 trials.
      if (level === 1) {
        this.tutorials.push(new Tutorial(this, "square", "L"));
        this.tutorials.push(new Tutorial(this, "circle", "S"));
        for (let i = 0; i < 16; i++) {
          let shape = Math.random() > 0.5 ? "square" : "circle";
          let correctKey = shape === "square" ? "L" : "S";
          this.trials.push(new Trial(this, shape, correctKey));
        }
      } else if (level === 2) {
        // Set up level 2 (you can customize as needed)
        this.tutorials.push(new Tutorial(this, "square", "L"));
        for (let i = 0; i < 20; i++) {
          let shape = Math.random() > 0.5 ? "square" : "circle";
          let correctKey = shape === "square" ? "L" : "S";
          this.trials.push(new Trial(this, shape, correctKey));
        }
      } else if (level === 3) {
        // Set up level 3 (customize as desired)
        this.tutorials.push(new Tutorial(this, "circle", "S"));
        for (let i = 0; i < 20; i++) {
          let shape = Math.random() > 0.5 ? "square" : "circle";
          let correctKey = shape === "square" ? "L" : "S";
          this.trials.push(new Trial(this, shape, correctKey));
        }
      }
      // Reset trial index for the new level.
      this.currentTrialIndex = 0;
    }
  
    startNextTutorial() {
      if (this.tutorials.length > 0) {
        let tutorial = this.tutorials.shift();
        tutorial.start();
      } else {
        // After tutorials, prompt to start the trials.
        document.getElementById('instruction').textContent =
          "Tutorials complete. Press spacebar to start the trials.";
        document.addEventListener("keydown", this.startTrials.bind(this));
      }
    }
  
    startTrials(event) {
      if (event.code === "Space") {
        document.removeEventListener("keydown", this.startTrials.bind(this));
        this.nextTrial();
      }
    }
    
    handleLevelContinue(event) {
        if (event.code === "Space") {
          document.removeEventListener("keydown", this.handleLevelContinue);
          // Move to level 2.
          this.currentLevel = 2;
          this.loadLevel(this.currentLevel);
          this.startNextTutorial();
        }
    }

    handleLevel2Decision(event) {
        if (event.code === "Space") {
          document.removeEventListener("keydown", this.handleLevel2Decision);
          // Continue to level 3.
          this.currentLevel = 3;
          this.loadLevel(this.currentLevel);
          this.startNextTutorial();
        }
    }

    nextTrial() {
        // Clear and reset the center card.
        const centerCardElem = document.getElementById("centerCard");
        centerCardElem.style.display = "none";
        centerCardElem.style.transform = "translateX(0)";
        centerCardElem.style.display = "inline-block";
      
        if (this.currentTrialIndex < this.trials.length) {
          this.trials[this.currentTrialIndex].start();
          this.currentTrialIndex++;
        } else {
          // End of current level.
          if (this.currentLevel === 1) {
            // End of level 1: show message and wait for spacebar to continue to level 2.
            document.getElementById("instruction").textContent =
              "Level 1 complete. Press spacebar when you are ready to continue.";
            document.addEventListener("keydown", this.handleLevelContinue);
          } else if (this.currentLevel === 2) {
            // End of level 2: offer a download option or continue to level 3.
            document.getElementById("instruction").textContent =
              "Level 2 complete. Press spacebar to continue to Level 3 or click the button to download data.";
            document.addEventListener("keydown", this.handleLevel2Decision);
          } else if (this.currentLevel === 3) {
            // End of level 3: game complete.
            document.getElementById("instruction").textContent =
              "Game complete. Click the button to download your results.";
            const downloadBtn = document.getElementById("downloadBtn");
            downloadBtn.style.display = "inline-block";
            downloadBtn.addEventListener("click", () => {
              downloadCSV(responseData, "all_levels_data.csv");
            });
          }
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
    // Render the static left/right cards.
    new Card("Circle", "left").render();
    new Card("Square", "right").render();
    // Load the first level.
    game.loadLevel(game.currentLevel);
    // Start with the first tutorial of level 1.
    game.startNextTutorial();
  });
  
  