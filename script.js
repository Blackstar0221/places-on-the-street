// Places are the same on both streets.
const places = [
  { id: "stationery", label: "Stationery Store", icon: "✏️" },
  { id: "burger", label: "Hamburger Store", icon: "🍔" },
  { id: "hospital", label: "Hospital", icon: "🏥" },
  { id: "supermarket", label: "Supermarket", icon: "🛒" },
  { id: "police", label: "Police Office", icon: "👮" },
  { id: "school", label: "School", icon: "🏫" }
];

// 10 levels: first ones are very simple, last ones need more reading/logic.
const levels = [
  {
    target: { street: "A", placeId: "school" },
    clues: [
      "The place is on Street A.",
      "Children go here to learn.",
      "It has classrooms and a playground."
    ]
  },
  {
    target: { street: "B", placeId: "burger" },
    clues: [
      "The place is on Street B.",
      "You can buy fast food here.",
      "It is famous for hamburgers."
    ]
  },
  {
    target: { street: "A", placeId: "hospital" },
    clues: [
      "This place helps sick and hurt people.",
      "Ambulances come here.",
      "It is not on Street B."
    ]
  },
  {
    target: { street: "B", placeId: "stationery" },
    clues: [
      "You can buy pencils and notebooks here.",
      "The place is on the same street as the supermarket.",
      "It is not where you buy food or see a doctor."
    ]
  },
  {
    target: { street: "A", placeId: "police" },
    clues: [
      "This place helps keep the town safe.",
      "If you lose something, you can report it here.",
      "It is on a different street from the supermarket."
    ]
  },
  {
    target: { street: "B", placeId: "supermarket" },
    clues: [
      "People buy many kinds of food here.",
      "It is on Street B.",
      "It is next to the stationery store in this puzzle's story."
    ]
  },
  {
    target: { street: "A", placeId: "stationery" },
    clues: [
      "The place you are looking for is not on Street B.",
      "It sells items that students often keep in their pencil cases.",
      "Its name is 'stationery', not 'stationary' (same sound, different meaning)."
    ]
  },
  {
    target: { street: "B", placeId: "hospital" },
    clues: [
      "This place must be open 24 hours a day.",
      "It needs doctors, nurses and many machines.",
      "If the school on Street A has a big accident, people may be taken here on Street B."
    ]
  },
  {
    target: { street: "A", placeId: "supermarket" },
    clues: [
      "Think about money: this place usually has discounts and sales.",
      "Unlike the hamburger store, you can buy ingredients to cook at home.",
      "On this puzzle, it is on Street A, not Street B."
    ]
  },
  {
    target: { street: "B", placeId: "school" },
    clues: [
      "In this town there are two schools, one on each street.",
      "The school you want is on the same street as the police office in this level's story.",
      "The correct answer is not on Street A, and it is not a place where you mainly spend money."
    ]
  }
];

let currentLevel = 0; // 0–9
let lives = 3;

const placeButtons = Array.from(document.querySelectorAll(".place"));
const levelDisplay = document.getElementById("level-display");
const livesDisplay = document.getElementById("lives-display");
const cluesList = document.getElementById("clues-list");
const messageDiv = document.getElementById("message");
const nextLevelBtn = document.getElementById("next-level-btn");
const restartBtn = document.getElementById("restart-btn");

function mapPlacesToButtons() {
  // First 3 buttons = Street A, last 3 = Street B.
  placeButtons.forEach((btn, idx) => {
    const place = places[idx % places.length];
    const street = idx < 3 ? "A" : "B";
    btn.dataset.street = street;
    btn.dataset.placeId = place.id;
    btn.innerHTML =
      `<span class="icon">${place.icon}</span>` +
      `<span class="label">${place.label}</span>`;
  });
}

function loadLevel() {
  const levelNumber = currentLevel + 1;
  const level = levels[currentLevel];

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
