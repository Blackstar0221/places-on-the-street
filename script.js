// Simple "song" / level
// time = seconds from start, lane = 0 (A), 1 (S), 2 (D)
const LEVEL = {
  bpm: 120, // not used directly for logic, just info
  notes: [
    { time: 1.0, lane: 1 },
    { time: 1.5, lane: 1 },
    { time: 2.0, lane: 1 },
    { time: 2.5, lane: 1 },

    { time: 3.5, lane: 0 },
    { time: 4.0, lane: 1 },
    { time: 4.5, lane: 2 },

    { time: 5.5, lane: 0 },
    { time: 6.0, lane: 0 },
    { time: 6.5, lane: 2 },
    { time: 7.0, lane: 2 },

    { time: 8.0, lane: 1 },
    { time: 8.5, lane: 0 },
    { time: 9.0, lane: 2 },
    { time: 9.5, lane: 1 },

    { time: 10.5, lane: 0 },
    { time: 11.0, lane: 1 },
    { time: 11.5, lane: 2 },
    { time: 12.0, lane: 1 },
  ],
};

const PERFECT_WINDOW = 0.12; // seconds
const GOOD_WINDOW = 0.2; // seconds
// Time before the hit time when we spawn the note (so it can fall)
const NOTE_TRAVEL_TIME = 1.2; // seconds from spawn to hit line

// Elements
const laneEls = Array.from(document.querySelectorAll(".lane"));
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const bestComboEl = document.getElementById("best-combo");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const hitFeedbackEl = document.getElementById("hit-feedback");

// Keys mapping
const KEY_TO_LANE = {
  a: 0,
  s: 1,
  d: 2,
};

// Game state
let gameStarted = false;
let gameFinished = false;
let startTime = null;
let animationId = null;

let activeNotes = []; // { lane, time, hit: false, judged: false, el }
let nextNoteIndex = 0;

let score = 0;
let combo = 0;
let bestCombo = 0;

// Utility to get current time in seconds since start
function getCurrentTime() {
  if (startTime === null) return 0;
  return (performance.now() - startTime) / 1000;
}

// Create a DOM note element in a lane
function spawnNote(noteData) {
  const laneEl = laneEls[noteData.lane];
  const noteEl = document.createElement("div");
  noteEl.classList.add("note");
  // Initially at top
  const laneHeight = laneEl.clientHeight || 1;
  noteEl.style.top = "0px";

  laneEl.appendChild(noteEl);

  noteData.el = noteEl;
  activeNotes.push(noteData);
}

// Update note positions and handle auto-miss
function updateNotes(currentTime) {
  const hitLineRatio = 0.8; // where the hit line is inside lane (0 = top, 1 = bottom)
  const laneHeight = laneEls[0].clientHeight || 1;
  const hitLineY = laneHeight * hitLineRatio;

  activeNotes.forEach((note) => {
    const t = currentTime;
    const travelStartTime = note.time - NOTE_TRAVEL_TIME;
    const travelEndTime = note.time + GOOD_WINDOW; // after this, it's a miss anyway

    // If we're before spawn time, keep it hidden at top
    if (t < travelStartTime) {
      note.el.style.top = "0px";
      return;
    }

    // Progress from 0 to 1 between travelStartTime and note.time
    const progress = Math.min(
      1,
      Math.max(0, (t - travelStartTime) / NOTE_TRAVEL_TIME)
    );

    const y = hitLineY * progress;
    note.el.style.top = `${y}px`;

    // Auto-miss if we've passed the Good window without being judged
    if (!note.judged && t > note.time + GOOD_WINDOW) {
      judgeNote(note, "miss");
    }
  });

  // Clean up notes that are fully off-screen / judged
  activeNotes = activeNotes.filter((note) => {
    if (note.judged && note.el) {
      // Remove the element if it's still in DOM
      if (note.el.parentElement) {
        note.el.parentElement.removeChild(note.el);
      }
      return false;
    }
    return true;
  });
}

// Try judging a note on a lane when a key is pressed
function handleHit(lane) {
  if (!gameStarted || gameFinished) return;

  flashLane(lane);

  const t = getCurrentTime();

  // Find the best candidate note in this lane that is not yet judged
  // and close to time t.
  let candidate = null;
  let candidateDelta = Infinity;

  for (const note of activeNotes) {
    if (note.lane !== lane || note.judged) continue;
    const delta = Math.abs(note.time - t);
    if (delta < candidateDelta) {
      candidateDelta = delta;
      candidate = note;
    }
  }

  if (!candidate) {
    // No note to hit in this lane
    showHitFeedback("Miss", "miss");
    resetComboOnMiss();
    return;
  }

  if (candidateDelta <= PERFECT_WINDOW) {
    judgeNote(candidate, "perfect");
  } else if (candidateDelta <= GOOD_WINDOW) {
    judgeNote(candidate, "good");
  } else {
    judgeNote(candidate, "miss");
  }
}

// Judge a note as perfect/good/miss
function judgeNote(note, kind) {
  if (note.judged) return;
  note.judged = true;

  if (kind === "perfect") {
    score += 2;
    combo += 1;
    bestCombo = Math.max(bestCombo, combo);
    showHitFeedback("Perfect", "perfect");
  } else if (kind === "good") {
    score += 1;
    combo += 1;
    bestCombo = Math.max(bestCombo, combo);
    showHitFeedback("Good", "good");
  } else {
    resetComboOnMiss();
    showHitFeedback("Miss", "miss");
  }

  updateScoreUI();
}

// UI updates

function updateScoreUI() {
  scoreEl.textContent = score.toString();
  comboEl.textContent = combo.toString();
  bestComboEl.textContent = bestCombo.toString();
}

function showHitFeedback(text, className) {
  hitFeedbackEl.textContent = text;
  hitFeedbackEl.classList.remove("perfect", "good", "miss");
  if (className) {
    hitFeedbackEl.classList.add(className);
  }
}

function resetComboOnMiss() {
  combo = 0;
}

// Visual flash for pressed lane
function flashLane(lane) {
  const laneEl = laneEls[lane];
  if (!laneEl) return;
  laneEl.classList.add("flash");
  setTimeout(() => {
    laneEl.classList.remove("flash");
  }, 80);
}

// Main loop
function gameLoop() {
  const t = getCurrentTime();

  // Spawn notes when it's time
  while (
    nextNoteIndex < LEVEL.notes.length &&
    t >= LEVEL.notes[nextNoteIndex].time - NOTE_TRAVEL_TIME
  ) {
    // Clone the note data so we don't mutate the original
    const noteData = {
      time: LEVEL.notes[nextNoteIndex].time,
      lane: LEVEL.notes[nextNoteIndex].lane,
      judged: false,
      el: null,
    };
    spawnNote(noteData);
    nextNoteIndex++;
  }

  // Update note positions and auto-miss
  updateNotes(t);

  // Check if we're done: all notes judged
  if (
    nextNoteIndex >= LEVEL.notes.length &&
    activeNotes.length === 0 &&
    !gameFinished
  ) {
    finishGame();
    return;
  }

  animationId = requestAnimationFrame(gameLoop);
}

// Game control

function startGame() {
  if (gameStarted) return;
  resetGameState();
  gameStarted = true;
  gameFinished = false;
  startTime = performance.now();
  showHitFeedback("Go!", null);
  startBtn.disabled = true;
  restartBtn.disabled = false;

  animationId = requestAnimationFrame(gameLoop);
}

function finishGame() {
  gameFinished = true;
  gameStarted = false;
  showHitFeedback("Song complete!", null);
  startBtn.disabled = true;
  restartBtn.disabled = false;

  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function resetGameState() {
  // Clear notes from DOM
  activeNotes.forEach((note) => {
    if (note.el && note.el.parentElement) {
      note.el.parentElement.removeChild(note.el);
    }
  });

  activeNotes = [];
  nextNoteIndex = 0;

  score = 0;
  combo = 0;
  // bestCombo stays as record for the session
  updateScoreUI();
  showHitFeedback("Ready", null);

  // Reset flags but don't start game yet
  gameStarted = false;
  gameFinished = false;
  startTime = null;

  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// Input handling

function onKeyDown(e) {
  const key = e.key.toLowerCase();
  if (!(key in KEY_TO_LANE)) return;
  e.preventDefault(); // prevent scroll on some keys

  const lane = KEY_TO_LANE[key];
  handleHit(lane);
}

// Buttons

startBtn.addEventListener("click", () => {
  startGame();
});

restartBtn.addEventListener("click", () => {
  resetGameState();
  startBtn.disabled = false;
  restartBtn.disabled = true;
});

// Keyboard listener
window.addEventListener("keydown", onKeyDown);

// Initial UI state
resetGameState();  const level = levels[currentLevel];

  levelDisplay.textContent = levelNumber.toString();
  livesDisplay.textContent = lives.toString();

  placeButtons.forEach(btn => {
    btn.classList.remove("correct", "wrong");
    btn.disabled = false;
  });

  cluesList.innerHTML = "";
  level.clues.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    cluesList.appendChild(li);
  });

  messageDiv.textContent = "Pick the place that matches all the clues.";
  nextLevelBtn.classList.add("hidden");
  restartBtn.classList.add("hidden");
}

function handlePlaceClick(event) {
  const btn = event.currentTarget;
  const chosenStreet = btn.dataset.street;
  const chosenPlaceId = btn.dataset.placeId;
  const level = levels[currentLevel];

  placeButtons.forEach(b => b.classList.remove("correct", "wrong"));

  if (chosenStreet === level.target.street && chosenPlaceId === level.target.placeId) {
    btn.classList.add("correct");
    messageDiv.textContent = "Correct!";
    placeButtons.forEach(b => (b.disabled = true));

    if (currentLevel === levels.length - 1) {
      messageDiv.textContent = "You finished all 10 levels! Great job.";
      restartBtn.classList.remove("hidden");
    } else {
      nextLevelBtn.classList.remove("hidden");
    }
  } else {
    btn.classList.add("wrong");
    lives -= 1;
    livesDisplay.textContent = lives.toString();

    if (lives <= 0) {
      messageDiv.textContent = "No lives left. You must start again from Level 1.";
      placeButtons.forEach(b => (b.disabled = true));
      restartBtn.classList.remove("hidden");
    } else {
      messageDiv.textContent =
        "That does not fit all the clues. Try again. Lives left: " + lives;
    }
  }
}

function goToNextLevel() {
  if (currentLevel < levels.length - 1) {
    currentLevel += 1;
    loadLevel();
  }
}

function restartGame() {
  currentLevel = 0;
  lives = 3;
  loadLevel();
}

placeButtons.forEach(btn => {
  btn.addEventListener("click", handlePlaceClick);
});

nextLevelBtn.addEventListener("click", goToNextLevel);
restartBtn.addEventListener("click", restartGame);

mapPlacesToButtons();
loadLevel();
  dragState.offsetY = point.y - rect.top;

  // (Optionally) hide original; or we can keep it.
  placeEl.style.opacity = "0.4";

  // Add move/end listeners
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerUp);
  window.addEventListener("touchmove", onPointerMove, { passive: false });
  window.addEventListener("touchend", onPointerUp);
}

// Move the clone with pointer
function onPointerMove(e) {
  if (!dragState.active || !dragState.cloneEl) return;
  e.preventDefault();

  const point = getPoint(e);
  const x = point.x - dragState.offsetX;
  const y = point.y - dragState.offsetY;

  dragState.cloneEl.style.left = x + "px";
  dragState.cloneEl.style.top = y + "px";

  // Highlight drop zones under pointer
  highlightDropZones(point.x, point.y);
}

// End drag: drop into a zone if available
function onPointerUp(e) {
  if (!dragState.active) return;

  const point = getPoint(e);
  const dropZone = getDropZoneUnderPoint(point.x, point.y);

  const originalParent = dragState.originalParent;
  const placeKey = dragState.placeKey;

  // Restore original chip
  const originalChip = findChipElement(placeKey);
  if (originalChip) {
    originalChip.style.opacity = "1";
  }

  // Remove floating clone
  if (dragState.cloneEl && dragState.cloneEl.parentElement) {
    dragState.cloneEl.parentElement.removeChild(dragState.cloneEl);
  }

  // Clear highlight
  clearDropZoneHighlight();

  if (dropZone) {
    // Put chip into this zone
    moveChipToZone(placeKey, dropZone);
  }

  // Reset drag state
  dragState = {
    active: false,
    placeKey: null,
    originalParent: null,
    cloneEl: null,
    offsetX: 0,
    offsetY: 0,
  };

  // Remove listeners
  window.removeEventListener("mousemove", onPointerMove);
  window.removeEventListener("mouseup", onPointerUp);
  window.removeEventListener("touchmove", onPointerMove);
  window.removeEventListener("touchend", onPointerUp);
}

// Find the drop zone under given viewport coordinates
function getDropZoneUnderPoint(x, y) {
  const dropZones = document.querySelectorAll(".drop-zone");
  for (const zone of dropZones) {
    const rect = zone.getBoundingClientRect();
    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      return zone;
    }
  }
  return null;
}

// Highlight zones when dragging
function highlightDropZones(x, y) {
  const dropZones = document.querySelectorAll(".drop-zone");
  dropZones.forEach((zone) => zone.classList.remove("highlight"));
  const target = getDropZoneUnderPoint(x, y);
  if (target) target.classList.add("highlight");
}

function clearDropZoneHighlight() {
  const dropZones = document.querySelectorAll(".drop-zone");
  dropZones.forEach((zone) => zone.classList.remove("highlight"));
}

// Find the original chip (in street or in list)
function findChipElement(placeKey) {
  return document.querySelector(`.place-chip[data-place="${placeKey}"]`);
}

// Move a place into a drop zone
function moveChipToZone(placeKey, zoneEl) {
  const zoneId = zoneEl.dataset.place;

  // If another place is already in this zone, move it back to places list
  for (const [z, pk] of Object.entries(placements)) {
    if (z === zoneId && pk !== placeKey) {
      const oldChip = findChipElement(pk);
      if (oldChip) {
        placesListEl.appendChild(oldChip);
      }
      delete placements[z];
      break;
    }
  }

  const chip = findChipElement(placeKey);
  if (chip) {
    zoneEl.appendChild(chip);
  }
  placements[zoneId] = placeKey;
}

// Set up drag handlers for all chips
function initDraggable() {
  const chips = document.querySelectorAll(".place-chip");

  chips.forEach((chip) => {
    chip.addEventListener("mousedown", (e) => startDrag(chip, e));
    chip.addEventListener("touchstart", (e) => startDrag(chip, e), {
      passive: false,
    });
  });
}

// Check answers
function checkAnswers() {
  const dropZones = document.querySelectorAll(".drop-zone");
  let allFilled = true;
  let allCorrect = true;

  dropZones.forEach((zone) => {
    const zoneId = zone.dataset.place;
    const chip = zone.querySelector(".place-chip");

    zone.classList.remove("correct", "wrong");

    if (!chip) {
      allFilled = false;
      allCorrect = false;
      return;
    }

    const placeKey = chip.dataset.place;
    const expected = correctMapping[zoneId];

    if (placeKey === expected) {
      zone.classList.add("correct");
    } else {
      zone.classList.add("wrong");
      allCorrect = false;
    }
  });

  if (!allFilled) {
    feedbackEl.textContent = "Some places are still not placed. Try to place all 6.";
  } else if (allCorrect) {
    feedbackEl.textContent = "Perfect! All places are in the correct spots.";
  } else {
    feedbackEl.textContent =
      "Some places are in the wrong spots. Red borders show mistakes.";
  }
}

// Reset everything
function resetAll() {
  // Clear placements
  for (const key in placements) {
    delete placements[key];
  }

  // Clear classes on zones
  const dropZones = document.querySelectorAll(".drop-zone");
  dropZones.forEach((zone) => {
    zone.classList.remove("correct", "wrong", "highlight");
  });

  // Move all chips back to list
  const chips = document.querySelectorAll(".place-chip");
  chips.forEach((chip) => {
    placesListEl.appendChild(chip);
    chip.style.opacity = "1";
  });

  feedbackEl.textContent = "";
}

// Init
initDraggable();
resetBtn.addEventListener("click", resetAll);
checkBtn.addEventListener("click", checkAnswers);            A3: '🛒 Supermarket',
            B1: '🍞 Bakery',
            B2: '🏪 Convenience Store',
            B3: '🏥 Hospital'
        },
        question: 'Which store is at position 3 on Street B?',
        options: ['🍞 Bakery', '🏪 Convenience Store', '🏥 Hospital', '📚 Stationary Store']
    },
    {
        id: 3,
        clues: [
            'The Hospital and Bakery are on different streets',
            'The Convenience Store is at position 2 on Street B',
            'The Hamburger Store is adjacent to the Bakery',
            'The Supermarket is at position 3 on Street A',
            'The Stationary Store is on Street A'
        ],
        correctAnswer: {
            A1: '🍔 Hamburger Store',
            A2: '📚 Stationary Store',
            A3: '🛒 Supermarket',
            B1: '🍞 Bakery',
            B2: '🏪 Convenience Store',
            B3: '🏥 Hospital'
        },
        question: 'How many stores are on Street A?',
        options: ['1', '2', '3', '4']
    }
];

// Game State
let gameState = {
    currentLevel: 1,
    currentLives: 3,
    totalScore: 0,
    levelScore: 0,
    placement: {},
    selectedAnswer: null,
    draggedStore: null,
    canSubmit: false
};

// DOM Elements
const levelDisplay = document.getElementById('levelDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const availableStores = document.getElementById('availableStores');
const cluesList = document.getElementById('cluesList');
const questionText = document.getElementById('questionText');
const answerOptions = document.getElementById('answerOptions');
const submitBtn = document.getElementById('submitBtn');
const hintBtn = document.getElementById('hintBtn');
const resetBtn = document.getElementById('resetBtn');
const feedbackMessage = document.getElementById('feedbackMessage');
const gameOverModal = document.getElementById('gameOverModal');
const victoryModal = document.getElementById('victoryModal');
const restartBtn = document.getElementById('restartBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');

// Initialize Game
function initGame() {
    gameState.placement = {};
    gameState.selectedAnswer = null;
    gameState.levelScore = 0;
    loadLevel(gameState.currentLevel);
    renderStores();
    renderClues();
    renderQuestion();
    updateUI();
}

// Load Current Level
function loadLevel(levelId) {
    const currentLevel = LEVELS.find(l => l.id === levelId);
    if (!currentLevel) {
        endGame();
        return;
    }
    // Level data is already in LEVELS
}

// Get Current Level Data
function getCurrentLevelData() {
    return LEVELS.find(l => l.id === gameState.currentLevel);
}

// Render Available Stores
function renderStores() {
    availableStores.innerHTML = '';
    STORES.forEach(store => {
        const storeItem = document.createElement('div');
        storeItem.className = 'store-item';
        storeItem.textContent = store;
        storeItem.draggable = true;
        
        // Check if store is already placed
        const isPlaced = Object.values(gameState.placement).includes(store);
        if (isPlaced) {
            storeItem.classList.add('placed');
        }
        
        storeItem.addEventListener('dragstart', handleDragStart);
        storeItem.addEventListener('dragend', handleDragEnd);
        
        availableStores.appendChild(storeItem);
    });
}

// Render Clues
function renderClues() {
    cluesList.innerHTML = '';
    const currentLevel = getCurrentLevelData();
    currentLevel.clues.forEach((clue, index) => {
        const clueItem = document.createElement('div');
        clueItem.className = 'clue-item';
        clueItem.textContent = clue;
        cluesList.appendChild(clueItem);
    });
}

// Render Question
function renderQuestion() {
    const currentLevel = getCurrentLevelData();
    questionText.textContent = currentLevel.question;
    
    answerOptions.innerHTML = '';
    currentLevel.options.forEach(option => {
        const optionBtn = document.createElement('div');
        optionBtn.className = 'answer-option';
        optionBtn.textContent = option;
        optionBtn.addEventListener('click', () => selectAnswer(option));
        answerOptions.appendChild(optionBtn);
    });
}

// Drag and Drop Handlers
function handleDragStart(e) {
    gameState.draggedStore = e.target.textContent;
    e.target.style.opacity = '0.7';
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
    gameState.draggedStore = null;
    document.querySelectorAll('.store-slot').forEach(slot => {
        slot.classList.remove('drag-over');
    });
}

// Setup Store Slots
function setupStoreSlots() {
    document.querySelectorAll('.store-slot').forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.target.closest('.store-slot').classList.add('drag-over');
}

function handleDragLeave(e) {
    e.target.closest('.store-slot').classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const slot = e.target.closest('.store-slot');
    slot.classList.remove('drag-over');
    
    if (!gameState.draggedStore) return;
    
    // Remove any existing placement
    Object.keys(gameState.placement).forEach(key => {
        if (gameState.placement[key] === gameState.draggedStore) {
            delete gameState.placement[key];
        }
    });
    
    // Add new placement
    gameState.placement[slot.id] = gameState.draggedStore;
    
    // Update display
    slot.textContent = gameState.draggedStore;
    slot.classList.add('filled');
    renderStores();
}

// Select Answer Option
function selectAnswer(option) {
    gameState.selectedAnswer = option;
    document.querySelectorAll('.answer-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    event.target.classList.add('selected');
}

// Submit Answer
function checkAnswer() {
    if (!gameState.selectedAnswer) {
        showFeedback('Please select an answer!', 'error');
        return;
    }
    
    const currentLevel = getCurrentLevelData();
    const questionText = currentLevel.question;
    
    // Parse question and check answer
    let isCorrect = false;
    
    if (questionText.includes('position')) {
        // Extract position from question (e.g., "position 2 on Street A")
        const match = questionText.match(/position (\d) on Street ([AB])/);
        if (match) {
            const pos = match[1];
            const street = match[2];
            const slotId = `${street}${pos}`;
            const correctStore = currentLevel.correctAnswer[slotId];
            
            // Extract store name from selected answer (remove emoji)
            const selectedStoreName = gameState.selectedAnswer;
            isCorrect = selectedStoreName === correctStore;
        }
    } else if (questionText.includes('How many')) {
        // Handle counting questions
        const correctCount = Object.values(currentLevel.correctAnswer)
            .filter(store => store.includes('Street A') || 
                    Object.entries(currentLevel.correctAnswer).some(([key, val]) => 
                        val === store && key.startsWith('A')))
            .length;
        
        const answerNum = gameState.selectedAnswer.charAt(0);
        isCorrect = answerNum === '3'; // All levels have 3 stores per street
    } else {
        isCorrect = gameState.selectedAnswer === currentLevel.correctAnswer;
    }
    
    if (isCorrect) {
        gameState.levelScore += 100;
        gameState.totalScore += 100;
        showFeedback('✅ Correct! Great job!', 'success');
        setTimeout(() => {
            if (gameState.currentLevel < LEVELS.length) {
                showVictory();
            } else {
                showVictory();
            }
        }, 1500);
    } else {
        gameState.currentLives--;
        showFeedback('❌ Wrong answer! Try again.', 'error');
        
        if (gameState.currentLives <= 0) {
            setTimeout(endGame, 1500);
        }
        
        updateUI();
    }
}

// Reset Board
function resetBoard() {
    gameState.placement = {};
    gameState.selectedAnswer = null;
    document.querySelectorAll('.store-slot').forEach(slot => {
        slot.innerHTML = '';
        slot.classList.remove('filled');
    });
    document.querySelectorAll('.answer-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    renderStores();
    showFeedback('Board reset!', 'info');
}

// Show Feedback Message
function showFeedback(message, type) {
    feedbackMessage.textContent = message;
    feedbackMessage.className = `feedback-message ${type}`;
    
    setTimeout(() => {
        feedbackMessage.classList.add('hidden');
    }, 3000);
}

// Show Victory Modal
function showVictory() {
    document.getElementById('levelScore').textContent = gameState.levelScore;
    victoryModal.classList.remove('hidden');
}

// Next Level
function nextLevel() {
    gameState.currentLevel++;
    victoryModal.classList.add('hidden');
    initGame();
}

// End Game
function endGame() {
    document.getElementById('finalScore').textContent = gameState.totalScore;
    gameOverModal.classList.remove('hidden');
}

// Restart Game
function restartGame() {
    gameState.currentLevel = 1;
    gameState.currentLives = 3;
    gameState.totalScore = 0;
    gameState.levelScore = 0;
    gameOverModal.classList.add('hidden');
    initGame();
}

// Update UI
function updateUI() {
    levelDisplay.textContent = gameState.currentLevel;
    livesDisplay.textContent = '❤️ '.repeat(gameState.currentLives) + 
                               '🖤 '.repeat(3 - gameState.currentLives);
    scoreDisplay.textContent = gameState.totalScore;
}

// Event Listeners
submitBtn.addEventListener('click', checkAnswer);
resetBtn.addEventListener('click', resetBoard);
restartBtn.addEventListener('click', restartGame);
nextLevelBtn.addEventListener('click', nextLevel);

hintBtn.addEventListener('click', () => {
    const currentLevel = getCurrentLevelData();
    const hint = currentLevel.clues[Math.floor(Math.random() * currentLevel.clues.length)];
    showFeedback(`💡 Hint: ${hint}`, 'info');
});

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    setupStoreSlots();
    initGame();
});
