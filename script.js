// Game configuration
const MAX_LEVEL = 10;
const MAX_ROUNDS = 3; // changed to 3 rounds per level
const MAX_HEARTS = 5;

// Elements
const cardsGrid = document.getElementById("cards-grid");
const hintBox = document.getElementById("hint-box");
const resultBox = document.getElementById("result-box");
const heartsContainer = document.getElementById("hearts");
const levelNumberEl = document.getElementById("level-number");
const roundNumberEl = document.getElementById("round-number");
const nextLevelBtn = document.getElementById("next-level-btn");
const restartBtn = document.getElementById("restart-btn");
const moreHintBtn = document.getElementById("more-hint-btn");
const resultBtn = document.getElementById("result-btn");

// State
let currentLevel = 1;
let currentRound = 1;
let heartsLeft = MAX_HEARTS;
let oddCardIndex = 0;
let hasGuessedThisRound = false;
let currentHintIndex = -1; // -1 = no hint shown this round yet

// Result state
let resultParts = []; // array of strings for step-by-step result
let currentResultIndex = -1; // -1 = nothing shown yet

// Vocabulary for hints
const attributes = [
  "slightly taller",
  "a bit shorter",
  "marginally wider",
  "a tiny bit thinner",
  "rotated a little",
  "rotated the other way",
  "moved up slightly",
  "moved down slightly",
  "shifted a little to the left",
  "shifted a little to the right",
];

const logicalRelations = [
  "not next to the center",
  "not on an edge",
  "in the top row",
  "in the bottom row",
  "on the left side",
  "on the right side",
  "closer to the top",
  "closer to the bottom",
  "closer to the left",
  "closer to the right",
];

// Utility
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Hearts UI
function renderHearts() {
  heartsContainer.innerHTML = "";
  for (let i = 0; i < MAX_HEARTS; i++) {
    const heart = document.createElement("div");
    heart.classList.add("heart");
    if (i < heartsLeft) heart.classList.add("filled");
    heartsContainer.appendChild(heart);
  }
}

// Level difficulty config
function getLevelDifficulty(level) {
  // differenceScale: 1 (obvious) to 10 (very subtle)
  const differenceScale = Math.min(10, 2 + level);
  const hintComplexity = Math.min(10, 3 + level);
  return { differenceScale, hintComplexity };
}

// Generate the visual style for cards for this level
function generateCardStyles(level) {
  const baseHeight = 120;
  const baseWidth = 100;

  const { differenceScale } = getLevelDifficulty(level);

  const normalVariation = Math.min(6, 2 + Math.floor(level / 2)); // px / degrees
  const oddExtraVariation = 4 + differenceScale; // additional difference

  const cards = [];

  for (let i = 0; i < 6; i++) {
    const card = {
      heightOffset: randInt(-normalVariation, normalVariation),
      widthOffset: randInt(-normalVariation, normalVariation),
      rotation: randInt(-normalVariation, normalVariation),
      translateX: randInt(-normalVariation, normalVariation),
      translateY: randInt(-normalVariation, normalVariation),
    };
    cards.push(card);
  }

  // Choose odd card index
  oddCardIndex = randInt(0, 5);

  // Make the odd card more noticeably different
  const odd = cards[oddCardIndex];
  const direction = Math.random() < 0.5 ? -1 : 1;

  if (Math.random() < 0.5) {
    // Taller / shorter
    odd.heightOffset += direction * oddExtraVariation;
  } else {
    // Wider / thinner
    odd.widthOffset += direction * oddExtraVariation;
  }

  if (level >= 4) {
    // Add some rotation difference for higher levels
    odd.rotation += direction * (oddExtraVariation - 2);
  }

  // Clip to reasonable limits so they still look like cards
  cards.forEach((card) => {
    card.heightOffset = Math.max(-20, Math.min(20, card.heightOffset));
    card.widthOffset = Math.max(-20, Math.min(20, card.widthOffset));
    card.rotation = Math.max(-20, Math.min(20, card.rotation));
  });

  // Compute final values
  cards.forEach((card) => {
    card.height = baseHeight + card.heightOffset;
    card.width = baseWidth + card.widthOffset;
  });

  return cards;
}

// Generate a hint text for this level and this layout
// hintNumber: 0 = first hint, 1 = second hint, 2+ = stronger hints
function generateHint(level, hintNumber = 0) {
  const { hintComplexity } = getLevelDifficulty(level);

  const cardLabel = String.fromCharCode(65 + oddCardIndex); // 'A'..'F'

  const attributeHint = `The odd card is ${attributes[randInt(
    0,
    attributes.length - 1
  )]}.`;
  const relationHint =
    "The odd card is " +
    logicalRelations[randInt(0, logicalRelations.length - 1)] +
    ".";
  const directHint = `The odd card is labeled ${cardLabel}.`;

  if (level <= 2) {
    if (hintNumber === 0) return attributeHint;
    if (hintNumber === 1) return attributeHint + " " + relationHint;
    return directHint; // eventually just tell them
  } else if (level <= 5) {
    if (hintNumber === 0) return attributeHint;
    if (hintNumber === 1) return relationHint;
    return attributeHint + " " + relationHint;
  } else if (level <= 8) {
    if (hintNumber === 0) return relationHint;
    if (hintNumber === 1) return attributeHint;
    return `${attributeHint} Also, it is ${logicalRelations[
      randInt(0, logicalRelations.length - 1)
    ]}.`;
  } else {
    // Harder levels start more vague
    if (hintNumber === 0) return relationHint;
    if (hintNumber === 1) return attributeHint;
    return `${relationHint} Also, pay attention to how its size or angle feels different.`;
  }
}

// Prepare result parts for step‑by‑step reveal
function buildResultParts({ correct, guessedIndex }) {
  const guessedLabel = String.fromCharCode(65 + guessedIndex);
  const oddLabel = String.fromCharCode(65 + oddCardIndex);
  const parts = [];

  if (correct) {
    parts.push(`You chose ${guessedLabel}. That was correct!`);
    parts.push(`Card ${oddLabel} really was the odd one out.`);
    parts.push("Nice job. Press Next Level when you're ready.");
  } else {
    parts.push(`You chose ${guessedLabel}. That was not the odd one.`);
    parts.push(`The odd card was ${oddLabel}.`);
    parts.push(
      "Look carefully at size, rotation, and position next time."
    );
  }

  return parts;
}

// Show the next chunk of result text
function showNextResultPart() {
  if (!resultParts || resultParts.length === 0) return;

  if (currentResultIndex < 0) {
    currentResultIndex = 0;
  } else if (currentResultIndex < resultParts.length - 1) {
    currentResultIndex++;
  } else {
    // Already at the last part; nothing more to show
    return;
  }

  const joined = resultParts.slice(0, currentResultIndex + 1).join(" ");
  resultBox.textContent = joined;

  // Change button text appropriately
  if (currentResultIndex >= resultParts.length - 1) {
    resultBtn.textContent = "Result Complete";
  } else {
    resultBtn.textContent = "Next Result Detail";
  }
}

// Render the six cards
function renderCards() {
  cardsGrid.innerHTML = "";

  const cardStyles = generateCardStyles(currentLevel);

  for (let i = 0; i < 6; i++) {
    const cardEl = document.createElement("div");
    cardEl.classList.add("card");
    cardEl.dataset.index = i;

    const style = cardStyles[i];
    cardEl.style.height = `${style.height}px`;
    cardEl.style.width = `${style.width}px`;

    const translate =
      style.translateX !== 0 || style.translateY !== 0
        ? `translate(${style.translateX}px, ${style.translateY}px)`
        : "";
    const rotate =
      style.rotation !== 0 ? `rotate(${style.rotation}deg)` : "";

    cardEl.style.transform = `${translate} ${rotate}`.trim();

    // Label: A–F
    const label = document.createElement("div");
    label.classList.add("card-label");
    label.textContent = String.fromCharCode(65 + i);
    cardEl.appendChild(label);

    // Badge for "ODD" vs "NORMAL" (shown only after guess)
    const badge = document.createElement("div");
    badge.classList.add("card-badge");
    badge.textContent = i === oddCardIndex ? "ODD" : "NORMAL";
    cardEl.appendChild(badge);

    cardEl.addEventListener("click", onCardClick);
    cardsGrid.appendChild(cardEl);
  }

  hasGuessedThisRound = false;
  currentHintIndex = -1; // no hint yet
  resultParts = [];
  currentResultIndex = -1;
  resultBtn.classList.add("hidden");

  // Reset hint & result boxes
  hintBox.textContent =
    'Press "Show Hint" to get a clue for this round.';
  moreHintBtn.textContent = "Show Hint";

  resultBox.textContent =
    'Make a guess to unlock the result, then press "Show Result".';
}

// Handle card click (guess)
function onCardClick(e) {
  if (hasGuessedThisRound || heartsLeft <= 0) return;

  const cardEl = e.currentTarget;
  const index = parseInt(cardEl.dataset.index, 10);

  hasGuessedThisRound = true;

  // Reveal badges on all cards
  document
    .querySelectorAll(".card")
    .forEach((c) => c.classList.add("show-badge"));

  const correct = index === oddCardIndex;

  if (correct) {
    // Correct guess
    cardEl.classList.add("correct");

    // Prepare result parts and show first chunk
    resultParts = buildResultParts({ correct: true, guessedIndex: index });
    currentResultIndex = -1;
    resultBtn.classList.remove("hidden");
    resultBtn.textContent = "Show Result";
    showNextResultPart();

    // Highlight other cards as normal
    document.querySelectorAll(".card").forEach((c) => {
      if (parseInt(c.dataset.index, 10) !== oddCardIndex) {
        c.classList.add("suspected"); // just to show outline
      }
    });

    // Also give a short line in hint box
    hintBox.textContent = `Nice! Card ${String.fromCharCode(
      65 + index
    )} was the odd one.`;

    // Go to next level or finish
    if (currentLevel < MAX_LEVEL) {
      nextLevelBtn.classList.remove("hidden");
    } else {
      hintBox.textContent += " You completed all levels!";
      restartBtn.classList.remove("hidden");
    }
  } else {
    // Wrong guess
    cardEl.classList.add("wrong");
    heartsLeft--;
    renderHearts();

    // Give an extra hint after a wrong guess
    if (currentHintIndex < 0) {
      currentHintIndex = 0;
    } else {
      currentHintIndex++;
    }
    const extraHint = generateHint(currentLevel, currentHintIndex);

    hintBox.textContent = `Hint after your guess: ${extraHint}`;

    // Build step-by-step result
    resultParts = buildResultParts({ correct: false, guessedIndex: index });
    currentResultIndex = -1;
    resultBtn.classList.remove("hidden");
    resultBtn.textContent = "Show Result";
    showNextResultPart();

    // Mark the correct one too
    const correctCard = document.querySelector(
      `.card[data-index="${oddCardIndex}"]`
    );
    if (correctCard) correctCard.classList.add("correct");

    // Check for game over
    if (heartsLeft <= 0) {
      hintBox.textContent += " You ran out of hearts. Game over.";
      restartBtn.classList.remove("hidden");
      return;
    }

    // Use up a round
    if (currentRound < MAX_ROUNDS) {
      currentRound++;
      roundNumberEl.textContent = currentRound.toString();

      // New layout after a brief pause
      setTimeout(() => {
        renderCards();
      }, 1000);
    } else {
      // Out of rounds for this level
      hintBox.textContent +=
        " You’ve used all your rounds for this level. Moving on.";
      if (currentLevel < MAX_LEVEL) {
        currentLevel++;
        currentRound = 1;
        updateLevelRoundDisplay();
        setTimeout(() => {
          renderCards();
        }, 1000);
      } else {
        hintBox.textContent += " That was the final level!";
        restartBtn.classList.remove("hidden");
      }
    }
  }
}

// Update level and round labels
function updateLevelRoundDisplay() {
  levelNumberEl.textContent = currentLevel.toString();
  roundNumberEl.textContent = currentRound.toString();
}

// Next level
nextLevelBtn.addEventListener("click", () => {
  if (currentLevel < MAX_LEVEL) {
    currentLevel++;
    currentRound = 1;
    updateLevelRoundDisplay();
    nextLevelBtn.classList.add("hidden");
    renderCards();
  }
});

// Hint button: first click = Show Hint, then Next Hint
moreHintBtn.addEventListener("click", () => {
  if (currentHintIndex < 0) {
    currentHintIndex = 0; // first hint
  } else {
    currentHintIndex++; // next hint
  }

  const hintText = generateHint(currentLevel, currentHintIndex);
  hintBox.textContent = `Hint ${currentHintIndex + 1}: ${hintText}`;

  // After first press, always show "Next Hint"
  moreHintBtn.textContent = "Next Hint";
});

// Result button: step-by-step reveal
resultBtn.addEventListener("click", () => {
  showNextResultPart();
});

// Restart game
restartBtn.addEventListener("click", () => {
  currentLevel = 1;
  currentRound = 1;
  heartsLeft = MAX_HEARTS;
  nextLevelBtn.classList.add("hidden");
  restartBtn.classList.add("hidden");
  resultBtn.classList.add("hidden");
  renderHearts();
  updateLevelRoundDisplay();
  renderCards();
  hintBox.textContent =
    "New game started. 6 cards, 1 is odd. Can you clear all 10 levels?";
  resultBox.textContent =
    'Make a guess to unlock the result, then press "Show Result".';
});

// Initialize
function initGame() {
  heartsLeft = MAX_HEARTS;
  currentLevel = 1;
  currentRound = 1;
  renderHearts();
  updateLevelRoundDisplay();
  renderCards();
}

initGame();
