const chat = document.getElementById("chat");
const bubbles = document.getElementById("chatBubbles");
const suggests = document.getElementById("chatSuggests");
const form = document.getElementById("chatForm");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("chatSendBtn");
const ratingWidget = document.getElementById("ratingWidget");
const chatScale = ratingWidget.querySelector(".rating-scale");

const overlay = document.getElementById("sheetOverlay");
const formSheet = document.getElementById("sheet");
const thanksSheet = document.getElementById("thanksSheet");
const thanksTitle = document.getElementById("thanksTitle");
const thanksDesc = document.getElementById("thanksDesc");
const hearts = document.getElementById("hearts");
const thanksIcon = document.getElementById("thanksIcon");
const sheetScale = document.getElementById("sheetScale");
const sheetQuestion = document.getElementById("sheetQuestion");
const sheetChips = document.getElementById("sheetChips");
const sheetTextarea = document.getElementById("sheetTextarea");
const sheetSubmit = document.getElementById("sheetSubmit");

/* Оценки 1–3 ведут на «что расстроило», 4–5 — на «что понравилось» */
const sheetVariants = {
  negative: {
    question: "Что вас расстроило?",
    placeholder: "Ну смотрите...",
    chips: [
      { emoji: "🐌", label: "Долго отвечал" },
      { emoji: "🚫", label: "Неверная информация" },
      { emoji: "🤷", label: "Не понял мой запрос" },
      { emoji: "👎", label: "Не решил проблему" },
    ],
  },
  positive: {
    question: "Что понравилось?",
    placeholder: "Ну котики вообще!",
    chips: [
      { emoji: "🎯", label: "Точный ответ" },
      { emoji: "🚀", label: "Быстрые ответы" },
      { emoji: "📋", label: "Понятная инструкция" },
      { emoji: "🦾", label: "Решил без оператора" },
    ],
  },
};

/* Финальный шит: сердечки разлетаются только на положительной оценке */
const thanksVariants = {
  negative: {
    title: "Спасибо за ответ",
    desc: "Мы всё изучим и подумаем,<br />как сделать лучше",
    hearts: false,
  },
  positive: {
    title: "Спасибо за отзыв!",
    desc: "Если будут ещё вопросы — пишите, я всегда рядом",
    hearts: true,
  },
};

let currentScore = null;
let selectedChips = new Set();
let ratingSubmitted = false;

/* ===== helpers ===== */

function syncSendButton() {
  sendBtn.classList.toggle("is-active", input.value.trim().length > 0);
}

function hideSuggests() {
  if (suggests.hidden) return;
  suggests.classList.add("is-leaving");
  setTimeout(() => {
    suggests.hidden = true;
    suggests.innerHTML = "";
    suggests.classList.remove("is-leaving");
  }, 150);
}

function appendUserBubble(text) {
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble chat-bubble-user is-entering is-entering-delayed";
  bubble.textContent = text;
  bubbles.append(bubble);
  bubble.scrollIntoView({ block: "start", behavior: "smooth" });
}

function botReply(text, { delay = 900 } = {}) {
  const typing = document.createElement("div");
  typing.className = "chat-bubble chat-bubble-typing is-entering";
  typing.innerHTML =
    '<span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span>';
  bubbles.append(typing);
  chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });

  setTimeout(() => {
    typing.remove();
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble is-entering";
    bubble.textContent = text;
    bubbles.append(bubble);
    chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
  }, delay);
}

/* ===== bottom sheet ===== */

function variantForScore(score) {
  return score <= 3 ? sheetVariants.negative : sheetVariants.positive;
}

function renderSheetScale() {
  sheetScale.innerHTML = "";
  for (const source of chatScale.querySelectorAll(".rating-option")) {
    const option = source.cloneNode(true);
    option.classList.toggle("is-selected", Number(option.dataset.score) === currentScore);
    option.addEventListener("click", () => setScore(Number(option.dataset.score)));
    sheetScale.append(option);
  }
}

function renderSheetVariant() {
  const variant = variantForScore(currentScore);
  sheetQuestion.textContent = variant.question;
  sheetTextarea.placeholder = variant.placeholder;
  sheetTextarea.value = "";

  sheetChips.innerHTML = "";
  for (const { emoji, label } of variant.chips) {
    const chip = document.createElement("button");
    chip.className = "sheet-chip";
    chip.type = "button";
    chip.setAttribute("aria-pressed", "false");
    chip.innerHTML = `
      <span class="sheet-chip-emoji" aria-hidden="true">${emoji}</span>
      <span class="sheet-chip-label">${label}</span>
      <span class="sheet-chip-box" aria-hidden="true"><img src="../assets/icons/check.svg" alt="" /></span>
    `;
    chip.addEventListener("click", () => toggleChip(chip, label));
    sheetChips.append(chip);
  }
}

function toggleChip(chip, label) {
  const isSelected = selectedChips.has(label);
  if (isSelected) {
    selectedChips.delete(label);
  } else {
    selectedChips.add(label);
  }
  chip.classList.toggle("is-selected", !isSelected);
  chip.setAttribute("aria-pressed", String(!isSelected));
}

function setScore(score) {
  const variantChanged = currentScore === null || variantForScore(score) !== variantForScore(currentScore);
  currentScore = score;

  renderSheetScale();
  if (variantChanged) {
    selectedChips.clear();
    renderSheetVariant();
  }
}

function openSheet(score) {
  currentScore = null;
  selectedChips.clear();
  sheetTextarea.value = "";
  setScore(score);

  thanksSheet.hidden = true;
  formSheet.hidden = false;
  formSheet.classList.remove("is-leaving");
  overlay.hidden = false;
  overlay.classList.remove("is-closing");
}

function closeSheet() {
  if (overlay.hidden) return;
  overlay.classList.add("is-closing");
  setTimeout(() => {
    overlay.hidden = true;
    overlay.classList.remove("is-closing");
  }, 240);
}

/* Основное сердце раздувается, и из него разлетаются сердечки поменьше */
function burstHearts() {
  hearts.innerHTML = "";

  thanksIcon.classList.remove("is-bursting");
  void thanksIcon.offsetWidth; /* рестарт анимации при повторном показе */
  thanksIcon.classList.add("is-bursting");

  const count = 22;
  for (let i = 0; i < count; i += 1) {
    const angle = (360 / count) * i + (Math.random() * 12 - 6);
    const radians = (angle * Math.PI) / 180;

    /* 0 — мелкое и прозрачное, 1 — крупное и плотное */
    const weight = Math.random();
    const size = 7 + weight * 19;

    /* Эллипс подобран так, чтобы разлёт целиком помещался в шит: в стороны
       места много, а сверху над сердцем всего ~60px, поэтому центр смещён вниз */
    const spread = 0.8 + weight * 0.35;
    const tx = Math.cos(radians) * 178 * spread;
    const ty = Math.sin(radians) * 34 * spread - 4;

    const particle = document.createElement("img");
    particle.className = "heart-particle";
    particle.src = "../assets/icons/heart.svg";
    particle.alt = "";
    particle.style.setProperty("--tx", `${tx}px`);
    particle.style.setProperty("--ty", `${ty}px`);
    particle.style.setProperty("--rot", `${Math.random() * 100 - 50}deg`);
    particle.style.setProperty("--size", `${size}px`);
    particle.style.setProperty("--peak-opacity", (0.22 + weight * 0.78).toFixed(2));
    particle.style.setProperty("--duration", `${950 + Math.random() * 450}ms`);
    /* Сердечки вылетают на пике пульсации — это 44% от её тысячи миллисекунд */
    particle.style.setProperty("--delay", `${400 + Math.random() * 160}ms`);
    hearts.append(particle);
  }
}

function showThanksSheet() {
  const variant = currentScore >= 4 ? thanksVariants.positive : thanksVariants.negative;
  thanksTitle.textContent = variant.title;
  thanksDesc.innerHTML = variant.desc;
  hearts.innerHTML = "";
  thanksIcon.classList.remove("is-bursting");

  formSheet.classList.add("is-leaving");
  setTimeout(() => {
    formSheet.hidden = true;
    formSheet.classList.remove("is-leaving");
    thanksSheet.hidden = false;
    if (variant.hearts) burstHearts();
  }, 240);
}

/* Отзыв оставлен — карточка оценки уходит из чата, новых сообщений не появляется */
function dismissRatingWidget() {
  if (!ratingWidget.isConnected) return;
  ratingWidget.classList.add("is-dismissed");
  setTimeout(() => ratingWidget.remove(), 240);
}

function submitRating() {
  ratingSubmitted = true;

  /* Карточка уходит из чата по нажатию «Отправить», пока её прикрывает шит */
  dismissRatingWidget();
  showThanksSheet();
}

/* ===== chat input ===== */

function sendUserMessage(rawText) {
  const text = rawText.trim();
  if (!text) return;

  hideSuggests();
  appendUserBubble(text);
  input.value = "";
  syncSendButton();
  input.focus();

  botReply("Понял вас. Уточню детали и вернусь с ответом.");
}

/* ===== wiring ===== */

for (const option of chatScale.querySelectorAll(".rating-option")) {
  option.addEventListener("click", () => {
    if (ratingSubmitted) return;
    openSheet(Number(option.dataset.score));
  });
}

sheetSubmit.addEventListener("click", submitRating);

overlay.addEventListener("click", (event) => {
  if (event.target === overlay) closeSheet();
});

/* В шите с благодарностью нет кнопки — закрываем тапом по нему самому */
thanksSheet.addEventListener("click", closeSheet);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSheet();
});

input.addEventListener("input", syncSendButton);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendUserMessage(input.value);
});

syncSendButton();
chat.scrollTop = chat.scrollHeight;
