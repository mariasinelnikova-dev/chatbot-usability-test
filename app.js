const phoneFrame = document.querySelector(".phone-frame");
const screenMain = document.querySelector(".screen-main");
const screenProfile = document.querySelector(".screen-profile");
const screenSupport = document.querySelector("#screenSupport");
const profileTab = document.querySelector("#profileTab");
const ticketsTab = document.querySelector("#ticketsTab");
const supportAskBtn = document.querySelector("#supportAskBtn");
const supportBackBtn = document.querySelector("#supportBackBtn");
const supportForm = document.querySelector("#supportForm");
const supportInput = document.querySelector("#supportInput");
const supportSendBtn = document.querySelector("#supportSendBtn");
const chatBubblesEl = document.querySelector(".chat-bubbles");
const supportChatEl = document.querySelector(".support-chat");
const chatSuggestsEl = document.querySelector(".chat-suggests");
const ordersModal = document.querySelector("#ordersModal");
const ordersBackdrop = document.querySelector("#ordersBackdrop");
const ordersCloseBtn = document.querySelector("#ordersCloseBtn");
const ordersTabActive = document.querySelector("#ordersTabActive");
const ordersTabArchive = document.querySelector("#ordersTabArchive");
const ordersPanelActive = document.querySelector("#ordersPanelActive");
const ordersPanelArchive = document.querySelector("#ordersPanelArchive");
const screenOrders = document.querySelector("#screenOrders");
const ordersBackBtn = document.querySelector("#ordersBackBtn");
const profileBookingCard = document.querySelector("#profileBookingCard");
const emailModal = document.querySelector("#emailModal");
const emailBackdrop = document.querySelector("#emailBackdrop");
const emailCloseBtn = document.querySelector("#emailCloseBtn");
const emailInputWrap = document.querySelector("#emailInputWrap");
const emailInput = document.querySelector("#emailInput");
const emailConfirmBtn = document.querySelector("#emailConfirmBtn");
const emailSheet = document.querySelector(".email-sheet");
const emailContentForm = document.querySelector("#emailContentForm");
const emailContentSent = document.querySelector("#emailContentSent");
const emailSentAddress = document.querySelector("#emailSentAddress");
const refundModal = document.querySelector("#refundModal");
const refundBackdrop = document.querySelector("#refundBackdrop");
const refundSheetAmount = document.querySelector("#refundSheetAmount");
const refundSheetHint = document.querySelector("#refundSheetHint");
const refundSheetReason = document.querySelector("#refundSheetReason");
const refundSheetFlight = document.querySelector("#refundSheetFlight");
const refundSheetPax = document.querySelector("#refundSheetPax");
const refundSheetAgree = document.querySelector("#refundSheetAgree");
const refundSheetSubmit = document.querySelector("#refundSheetSubmit");
const refundMoreBtn = document.querySelector("#refundMoreBtn");
const calcModal = document.querySelector("#calcModal");
const calcBackdrop = document.querySelector("#calcBackdrop");
const calcReturnTotal = document.querySelector("#calcReturnTotal");
const calcPointsBlock = document.querySelector("#calcPointsBlock");
const calcPointsValue = document.querySelector("#calcPointsValue");
const calcMoneyValue = document.querySelector("#calcMoneyValue");
const appSnackbar = document.querySelector("#appSnackbar");
const appSnackbarText = document.querySelector("#appSnackbarText");

let snackbarHideTimer = null;

function showSnackbar(text) {
  if (!appSnackbar) return;
  if (text && appSnackbarText) appSnackbarText.textContent = text;
  appSnackbar.classList.add("is-visible");
  appSnackbar.setAttribute("aria-hidden", "false");
  if (snackbarHideTimer) clearTimeout(snackbarHideTimer);
  snackbarHideTimer = setTimeout(() => hideSnackbar(), 1500);
}

function hideSnackbar() {
  if (!appSnackbar) return;
  appSnackbar.classList.remove("is-visible");
  appSnackbar.setAttribute("aria-hidden", "true");
  if (snackbarHideTimer) {
    clearTimeout(snackbarHideTimer);
    snackbarHideTimer = null;
  }
}

let conversationState = null;

const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.-]+/i;

const conversationData = {
  topic: "Возврат билета",
  // Topic in the instrumental case ("с кем? с чем?"). Used in the bot's
  // confirmation phrase: "У вас вопрос связан с {topicInstrumental}?".
  topicInstrumental: "возвратом билета",
  orderInfo: null,
  refundOption: null,
  email: null,
  comment: null,
};

const SUPPORT_ORDERS = [
  {
    title: "Стамбул — Екатеринбург",
    date: "24 дек, чт — 25 дек, пн",
    passengers: 3,
    logos: [
      "./assets/icons/orders/airline-s7.png",
      "./assets/icons/orders/airline-redwings.png",
    ],
  },
  {
    title: "Москва — Уфа",
    date: "24 дек, чт — 25 дек, пн",
    passengers: 3,
    badge: "Билет от Авиасейлс",
    logos: ["./assets/icons/orders/airline-aeroflot.png"],
  },
  {
    title: "Стамбул — Екатеринбург",
    date: "28 дек, сб — 30 дек, пн",
    passengers: 3,
    logos: [
      "./assets/icons/orders/airline-s7.png",
      "./assets/icons/orders/airline-redwings.png",
    ],
  },
];

function renderOrderCard(order) {
  const badge = order.badge
    ? `<span class="order-badge">${escapeHtml(order.badge)}</span>`
    : "";
  const logos = (order.logos || [])
    .map(
      (src) =>
        `<span class="order-airline-logo"><img src="${src}" alt="" /></span>`
    )
    .join("");

  return `
    <button class="order-card order-card-button" type="button" data-action="select-order" data-order-title="${escapeHtml(order.title)}" data-order-date="${escapeHtml(order.date)}" data-order-passengers="${order.passengers || 3}">
      ${badge}
      <div class="order-card-row">
        <div class="order-details">
          <p class="order-title">${escapeHtml(order.title)}</p>
          <p class="order-date">${escapeHtml(order.date)}</p>
        </div>
        <span class="order-logos" aria-hidden="true">${logos}</span>
      </div>
    </button>
  `;
}

const BOT_REPLIES = [
  {
    match: /^не возвращать$/i,
    render: () => {
      collapseRefundWidget();
      appendBotBubble(
        "Понял, билеты остаются у вас, можно спокойно лететь 💙"
      );
    },
    suggests: ["Спасибо всё понятно"],
    nextState: null,
  },
  {
    match: (userText) => isRefundDocsMessage(userText),
    render: () => {
      collapseRefundWidget();
      appendBotBubble(
        "Расскажите, что случилось, — от этого зависит, какие документы понадобятся."
      );
    },
    suggests: [
      "Заболел пассажир",
      "Запрет въезда",
      "Отказ в визе",
      "Смерть пассажира",
    ],
    placeholder: "Напишите что-нибудь",
  },
  {
    match: (userText) => isRefundConfirmMessage(userText),
    loading: "ai",
    render: () => {
      collapseRefundWidget();
      appendRefundSuccessBubble();
    },
    suggests: ["Спасибо всё понятно"],
    nextState: null,
  },
  {
    match: /багаж/i,
    render: () => {
      conversationData.topic = "Добавить багаж";
      conversationData.topicInstrumental = "добавлением багажа";
      appendBotBubble(
        "Вы можете добавить багаж до покупки билета, если на сайте продавца есть специальный ползунок. Если вы уже приобрели билет, добавление багажа возможно на сайте продавца после перехода на него. Обратитесь к продавцу билета или напишите его название."
      );
    },
    suggests: ["Спасибо, всё понятно", "Ответ не помог"],
  },
  {
    match: /возвра|вернуть/i,
    render: () => {
      conversationData.topic = "Комиссия по возврату билета";
      conversationData.topicInstrumental = "комиссией по возврату билета";
      appendBotBubble(
        "Возврат билета зависит от тарифа и правил авиакомпании. Комиссия может варьироваться в зависимости от условий вашего тарифа. Рекомендуем связаться с продавцом билета для получения точной информации о возможной комиссии за возврат."
      );
    },
    suggests: ["Спасибо, всё понятно", "Ответ не помог"],
  },
  {
    match: /^ответ не помог$/i,
    render: () => appendOrdersWidget(),
    suggests: ["Нет нужного заказа"],
  },
  {
    match: /^нет нужного заказа$/i,
    render: () => {
      conversationData.orderInfo = null;
      appendBotBubbleHTML(
        '<p><strong>Пришлите номер заказа из&nbsp;письма,</strong> которое получили после оплаты, — всё проверю и попробую поискать.</p>' +
          '<p>Возможно, вы купили билет через другой профиль — попробуйте войти в него и проверить.</p>' +
          '<p>Если номера заказа сейчас нет под рукой — нажмите кнопку ниже.</p>'
      );
    },
    suggests: ["Не могу найти номер заказа"],
    placeholder: "Напишите номер заказа",
  },
  {
    match: /не могу найти/i,
    render: () =>
      appendBotBubbleHTML(
        '<p>Хорошо, давайте отправим запрос без номера заказа.</p>' +
          '<p><strong>Напишите свою почту</strong> — ребята из поддержки свяжутся с вами и помогут со всем разобраться.</p>'
      ),
    placeholder: "Напишите почту",
  },
  {
    match: /(стамбул\s*[-—]\s*екатеринбург|москва\s*[-—]\s*уфа)/i,
    render: () => {
      conversationData.email = "maria.kalimullin@aviasales.ru";
      appendRefundWidget();
    },
    suggests: ["Не возвращать"],
    placeholder: "Напишите что-нибудь",
    nextState: "awaiting-refund",
  },
  {
    match: EMAIL_REGEX,
    render: (userText) => {
      const m = (userText || "").match(EMAIL_REGEX);
      if (m) conversationData.email = m[0];
      const topicHtml = escapeHtml(
        conversationData.topicInstrumental ||
          (conversationData.topic || "").toLowerCase()
      );
      appendBotBubbleHTML(
        `<p>У вас вопрос связан с <strong>${topicHtml}</strong>?</p>` +
          '<p>Подробно опишите ситуацию в одном сообщении. Обязательно укажите:</p>' +
          '<ul class="bot-rich-list">' +
          '<li>суть проблемы — к примеру, опечатка в данных, покупка места;</li>' +
          '<li>что нужно сделать — изменить данные, добавить багаж;</li>' +
          '<li>для какого пассажира и перелёта.</li>' +
          '</ul>' +
          '<p><strong>Например:</strong> «Хочу добавить чемодан 20&nbsp;кг на рейс Стамбул — Москва, для пассажира Дешёвых А.&nbsp;Б.»</p>'
      );
    },
    placeholder: "Напишите что-нибудь",
    nextState: "awaiting-topic",
  },
  {
    requiresState: "awaiting-topic",
    render: (userText) => {
      if (userText) conversationData.comment = userText;
      appendAttachWidget();
    },
    suggests: ["Продолжить без документов"],
    nextState: "awaiting-attach",
  },
  {
    requiresState: "awaiting-attach",
    render: () => appendSummaryWidget(),
    suggests: ["Всё верно, отправить запрос", "Дополнить запрос", "Изменить почту"],
    nextState: "awaiting-confirm",
  },
  {
    requiresState: "awaiting-confirm",
    match: /(всё верно|все верно|отправить запрос|готово)/i,
    render: () => {
      const email = conversationData.email || "example@gmail.com";
      appendBotBubbleHTML(
        '<p>Готово! Передал ваш запрос в&nbsp;поддержку 💙</p>' +
          `<p>Всё изучим и&nbsp;в&nbsp;течение 4–5&nbsp;дней ответим на&nbsp;почту <strong>${escapeHtml(email)}</strong>. Не&nbsp;забудьте проверить папку «Спам», чтобы не&nbsp;пропустить письмо.</p>`
      );
    },
    suggests: ["Спасибо, всё понятно"],
    nextState: "done",
  },
  {
    // Always show the "all-clear" goodbye reply when the user taps the
    // "Спасибо, всё понятно" suggest, regardless of the current step.
    match: /(спасибо,?\s*всё понятно|спасибо,?\s*все понятно)/i,
    render: () =>
      appendBotBubble(
        "Отлично, разобрались! Если будут ещё вопросы — пишите, я всегда рядом 💙"
      ),
  },
  {
    requiresState: "awaiting-confirm",
    match: /дополни/i,
    render: () =>
      appendBotBubble(
        "Напишите, что хотите добавить — дополню ваш запрос и проверим, всё ли точно"
      ),
    nextState: "awaiting-supplement",
  },
  {
    requiresState: "awaiting-supplement",
    render: (userText) => {
      if (userText) {
        conversationData.comment = conversationData.comment
          ? `${conversationData.comment.replace(/[.!?]*\s*$/, "")}. ${userText}`
          : userText;
      }
      appendSummaryWidget({ commentUpdated: true });
    },
    suggests: ["Всё верно, отправить запрос", "Дополнить запрос", "Изменить почту"],
    nextState: "awaiting-confirm",
  },
  {
    requiresState: "awaiting-confirm",
    match: /изменить почту/i,
    render: () => {
      if (conversationData.orderInfo) {
        conversationData.previousEmail = conversationData.email;
        const ordPaxEmail = document.querySelector("#ordPaxEmail");
        conversationData.previousOrderEmail = ordPaxEmail
          ? ordPaxEmail.textContent
          : null;
        appendBotBubbleHTML(
          '<ol class="bot-steps">' +
            '<li class="bot-step"><span class="bot-step-num">1.</span><span class="bot-step-text">Перейдите <a href="#" class="bot-link" data-action="open-orders">в&nbsp;раздел «Мои&nbsp;заказы»</a>.</span></li>' +
            '<li class="bot-step"><span class="bot-step-num">2.</span><span class="bot-step-text">Измените почту на&nbsp;нужную.</span></li>' +
            '<li class="bot-step"><span class="bot-step-num">3.</span><span class="bot-step-text">Вернитесь в&nbsp;этот чат и&nbsp;нажмите на&nbsp;<strong>«Почта изменена»</strong>.</span></li>' +
            '</ol>' +
            '<p><strong>Важный момент:</strong> на&nbsp;новую почту будут приходить все письма, связанные с&nbsp;заказом.</p>' +
            '<p>Если передумали и&nbsp;не&nbsp;хотите ничего менять, нажмите на&nbsp;<strong>«Оставить старую почту»</strong>.</p>'
        );
        setSuggests(["Почта изменена", "Оставить старую почту"]);
        conversationState = "awaiting-email-change-action";
      } else {
        appendBotBubble("На какую почту отправить ответ от поддержки?");
        if (supportInput) supportInput.placeholder = "Напишите почту";
        conversationState = "awaiting-new-email";
      }
    },
  },
  {
    requiresState: "awaiting-new-email",
    render: (userText) => {
      const m = (userText || "").match(EMAIL_REGEX);
      if (m) {
        conversationData.email = m[0];
        appendSummaryWidget({ emailUpdated: true });
        setSuggests(["Всё верно, отправить запрос", "Дополнить запрос", "Изменить почту"]);
        conversationState = "awaiting-confirm";
        if (supportInput) supportInput.placeholder = "Напишите что-нибудь";
      } else {
        appendBotBubble("Пожалуйста, напишите корректную почту");
      }
    },
  },
  {
    requiresState: "awaiting-email-change-action",
    match: /почта изменена/i,
    render: () => {
      conversationData.previousEmail = undefined;
      conversationData.previousOrderEmail = undefined;
      appendSummaryWidget({ emailUpdated: true });
    },
    suggests: ["Всё верно, отправить запрос", "Дополнить запрос", "Изменить почту"],
    nextState: "awaiting-confirm",
  },
  {
    requiresState: "awaiting-email-change-action",
    match: /оставить старую почту/i,
    render: () => {
      if (conversationData.previousEmail !== undefined) {
        conversationData.email = conversationData.previousEmail;
      }
      const ordPaxEmail = document.querySelector("#ordPaxEmail");
      if (ordPaxEmail && conversationData.previousOrderEmail != null) {
        ordPaxEmail.textContent = conversationData.previousOrderEmail;
      }
      conversationData.previousEmail = undefined;
      conversationData.previousOrderEmail = undefined;
      appendSummaryWidget();
    },
    suggests: ["Всё верно, отправить запрос", "Дополнить запрос", "Изменить почту"],
    nextState: "awaiting-confirm",
  },
];

function showScreen(target) {
  const isProfile = target === "profile";
  phoneFrame.classList.toggle("is-profile", isProfile);

  if (screenMain) screenMain.hidden = isProfile;
  if (screenProfile) screenProfile.hidden = !isProfile;

  if (profileTab) profileTab.classList.toggle("active", isProfile);
  if (ticketsTab) ticketsTab.classList.toggle("active", !isProfile);
}

function setSupport(open) {
  phoneFrame.classList.toggle("is-support", open);
  if (screenSupport) screenSupport.setAttribute("aria-hidden", String(!open));
}

function setOrdersScreen(open) {
  phoneFrame.classList.toggle("is-orders", open);
  if (screenOrders) screenOrders.setAttribute("aria-hidden", String(!open));
}

// Sliding sequence: close chat (left→right) → reveal profile briefly → orders
// screen slides in (right→left). Mirrors the iOS push-pop transition timing.
// After the orders screen lands we slide up the email-change modal on top of it.
// Each step runs strictly sequentially (no overlap) at 300ms, so the cascade
// reads as a calm, clear three-beat transition.
function openOrdersFromChat() {
  setSupport(false);
  setTimeout(() => {
    setOrdersScreen(true);
    setTimeout(() => setEmailModal(true), 300);
  }, 300);
}

function setEmailModal(open) {
  if (!emailModal) return;
  const wasOpen = emailModal.classList.contains("is-open");
  const wasInSentState =
    !open && wasOpen && emailContentSent && !emailContentSent.hidden;
  emailModal.classList.toggle("is-open", open);
  emailModal.setAttribute("aria-hidden", String(!open));
  if (open) {
    resetEmailModalContent();
  } else if (wasInSentState) {
    // Consume the sent state immediately so a later close (tab switch, back
    // button, etc.) cannot fire the snackbar a second time.
    if (emailContentSent) emailContentSent.hidden = true;
    if (emailContentForm) emailContentForm.hidden = false;
    showSnackbar("Вы подтвердили новый адрес почты");
  }
}

function resetEmailModalContent() {
  if (emailInput) emailInput.value = "";
  updateEmailConfirmState();
  if (emailContentForm) emailContentForm.hidden = false;
  if (emailContentSent) emailContentSent.hidden = true;
  if (emailSheet) {
    emailSheet.style.height = "";
    emailSheet.style.transition = "";
  }
}

// Swap content instantly, but animate the bottom-sheet's height between the
// two natural sizes so it grows/shrinks smoothly.
function showEmailSentState(address) {
  if (!emailSheet || !emailContentForm || !emailContentSent) return;
  if (emailSentAddress && address) emailSentAddress.textContent = address;

  const fromHeight = emailSheet.getBoundingClientRect().height;

  emailContentForm.hidden = true;
  emailContentSent.hidden = false;

  emailSheet.style.transition = "none";
  emailSheet.style.height = "auto";
  const toHeight = emailSheet.getBoundingClientRect().height;
  emailSheet.style.height = `${fromHeight}px`;
  void emailSheet.offsetHeight;

  emailSheet.style.transition = "height 320ms cubic-bezier(0.32, 0.72, 0.32, 1)";
  emailSheet.style.height = `${toHeight}px`;

  const onEnd = (event) => {
    if (event.propertyName !== "height") return;
    emailSheet.removeEventListener("transitionend", onEnd);
    emailSheet.style.transition = "";
    emailSheet.style.height = "";
  };
  emailSheet.addEventListener("transitionend", onEnd);
}

function updateEmailConfirmState() {
  if (!emailInput) return;
  const hasValue = emailInput.value.trim().length > 0;
  if (emailInputWrap) emailInputWrap.classList.toggle("is-filled", hasValue);
  if (emailConfirmBtn) emailConfirmBtn.disabled = !hasValue;
}

if (profileTab) {
  profileTab.addEventListener("click", () => {
    setRefundModal(false);
    setEmailModal(false);
    setOrdersScreen(false);
    showScreen("profile");
  });
}

if (ticketsTab) {
  ticketsTab.addEventListener("click", () => {
    setRefundModal(false);
    setEmailModal(false);
    setOrdersScreen(false);
    setSupport(false);
    showScreen("main");
  });
}

if (supportAskBtn) {
  supportAskBtn.addEventListener("click", () => setSupport(true));
}

if (supportBackBtn) {
  supportBackBtn.addEventListener("click", () => setSupport(false));
}

function updateSendBtnState() {
  if (!supportInput || !supportSendBtn) return;
  const hasText = supportInput.value.trim().length > 0;
  const filesEl = document.querySelector("#supportInputFiles");
  const hasFiles = !!filesEl && !filesEl.hidden && filesEl.children.length > 0;
  supportSendBtn.classList.toggle("is-active", hasText || hasFiles);
}

function appendBotBubble(text) {
  if (!chatBubblesEl) return null;

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble is-entering";
  bubble.textContent = text;

  chatBubblesEl.appendChild(bubble);
  return bubble;
}

function appendBotBubbleHTML(html) {
  if (!chatBubblesEl) return null;

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble is-entering";
  bubble.innerHTML = html;

  chatBubblesEl.appendChild(bubble);
  return bubble;
}

function appendAttachWidget() {
  if (!chatBubblesEl) return null;

  const widget = document.createElement("div");
  widget.className = "chat-bubble chat-widget is-entering";
  widget.innerHTML = `
    <div class="widget-text">
      <p>Если у вас есть билеты, чеки, справки или другие документы — прикрепите их. Это поможет быстрее разобраться в вопросе.</p>
      <p>Если ничего нет, просто нажмите «Продолжить без документов».</p>
    </div>
    <button class="widget-btn" type="button" data-action="attach">
      <svg class="widget-btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path transform="translate(3.55 2.96)" fill-rule="evenodd" clip-rule="evenodd" d="M7.74264 1.32843C9.51388 -0.442809 12.3856 -0.442808 14.1569 1.32843C15.9281 3.09966 15.9281 5.9714 14.1569 7.74264L9.65685 12.2426C8.4379 13.4616 6.46159 13.4616 5.24264 12.2426C4.02369 11.0237 4.02369 9.04738 5.24264 7.82843L9.24264 3.82843L10.6569 5.24264L6.65685 9.24264C6.21895 9.68054 6.21895 10.3905 6.65685 10.8284C7.09475 11.2663 7.80473 11.2663 8.24264 10.8284L12.7426 6.32843C13.7328 5.33824 13.7328 3.73283 12.7426 2.74264C11.7525 1.75245 10.147 1.75245 9.15685 2.74264L3.15686 8.74264C1.61438 10.2851 1.61438 12.786 3.15685 14.3284C4.69933 15.8709 7.20017 15.8709 8.74264 14.3284L14.2426 8.82843L15.6569 10.2426L10.1569 15.7426C7.83333 18.0662 4.06616 18.0662 1.74264 15.7426C-0.580882 13.4191 -0.580878 9.65195 1.74264 7.32843L7.74264 1.32843Z" fill="currentColor"/>
      </svg>
      Прикрепить файлы
    </button>
  `;

  chatBubblesEl.appendChild(widget);
  return widget;
}

const ATTACHED_FILES = [
  { name: "Паспорт", ext: ".png", size: "4.1 МБ" },
  { name: "Маршрутная квитанция", ext: ".pdf", size: "6.23 МБ" },
];

function showAttachedFiles() {
  const filesEl = document.querySelector("#supportInputFiles");
  if (!filesEl) return;

  filesEl.innerHTML = ATTACHED_FILES.map((file) => `
    <div class="support-file">
      <div class="support-file-content">
        <span class="support-file-icon" aria-hidden="true">
          <svg viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.7949 4.70285L9.2449 0.202846C9.1133 0.0726923 8.9355 0 8.75 0H1.4C0.6265 0 0 0.619615 0 1.38462V16.6154C0 17.3804 0.6265 18 1.4 18H12.6C13.3735 18 14 17.3804 14 16.6154V5.19231C14 5.00885 13.9265 4.833 13.7949 4.70285ZM9.1 5.53846C8.7136 5.53846 8.4 5.22831 8.4 4.84615V1.31815L12.6672 5.53846H9.1Z" fill="#0C73FE"/>
          </svg>
        </span>
        <span class="support-file-text">
          <span class="support-file-name-row">
            <span class="support-file-name">${file.name}</span><span class="support-file-ext">${file.ext}</span>
          </span>
          <span class="support-file-size">${file.size}</span>
        </span>
      </div>
      <button class="support-file-remove" type="button" aria-label="Удалить">
        <span class="support-file-remove-bg" aria-hidden="true">
          <svg viewBox="0 0 11.25 11.25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.25 10L6.875 5.625L11.25 1.25L10 0L5.625 4.375L1.25 0L0 1.25L4.375 5.625L0 10L1.25 11.25L5.625 6.875L10 11.25L11.25 10Z" fill="currentColor"/>
          </svg>
        </span>
      </button>
    </div>
  `).join("");

  filesEl.hidden = false;
  updateSendBtnState();
}

const REFUND_OPTIONS = [
  {
    id: "delay",
    title: "Отмена или задержка рейса",
    amount: "12 010 ₽",
    hint: "на карту в течение 30 рабочих дней",
    expires: "Актуально до 5 апреля, 11:23",
    badge: "Вернём больше всего",
  },
  {
    id: "same-day",
    title: "Отмена в день покупки",
    amount: "10 990 ₽",
    hint: "на карту в течение 3-5 рабочих дней",
    expires: "Актуально до 5 апреля, 11:23",
    details: true,
  },
  {
    id: "aviasales",
    title: "Возврат от Авиасейлс",
    amount: "9 990 ₽",
    hint: "на карту в течение 30 рабочих дней",
    points: "3 500 баллов",
    pointsHint: "в профиль в течение суток",
    expires: "Актуально до 5 апреля, 12:00",
    details: true,
  },
  {
    id: "docs",
    title: "Болезнь, отказ в визе или смерть близкого",
    hint: "Понадобятся документы. Если авиакомпания их примет, вернём всю сумму заказа.",
    compact: true,
  },
];

function renderRefundRadio() {
  return `
    <span class="refund-radio" aria-hidden="true">
      <img src="./assets/icons/radio.svg" alt="" />
    </span>
  `;
}

function renderRefundOption(option) {
  const classes = [
    "refund-option",
    option.badge ? "has-badge" : "",
    option.compact ? "is-compact" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const badge = option.badge
    ? `<span class="refund-badge">${escapeHtml(option.badge)}</span>`
    : "";

  if (option.compact) {
    return `
      <div class="${classes}" role="radio" aria-checked="false" tabindex="0" data-action="select-refund" data-refund-id="${option.id}" data-refund-title="${escapeHtml(option.title)}">
        <div class="refund-card">
          <div class="refund-compact-text">
            <p class="refund-card-title">${escapeHtml(option.title)}</p>
            <p class="refund-hint">${escapeHtml(option.hint)}</p>
          </div>
          ${renderRefundRadio()}
        </div>
      </div>
    `;
  }

  const points = option.points
    ? `
      <div class="refund-points">
        <div class="refund-points-row">
          <p class="refund-amount">${escapeHtml(option.points)}</p>
          <img class="refund-points-star" src="./assets/icons/loyalty-star.svg" alt="" width="16" height="16" />
        </div>
        <p class="refund-hint">${escapeHtml(option.pointsHint || "")}</p>
      </div>
    `
    : "";
  const expires = option.expires
    ? `<p class="refund-expires">${escapeHtml(option.expires)}</p>`
    : "";
  const details = option.details
    ? `
      <button class="refund-details" type="button" data-action="refund-details">
        Посмотреть детали расчёта
      </button>
    `
    : "";

  return `
    <div class="${classes}" role="radio" aria-checked="false" tabindex="0" data-action="select-refund" data-refund-id="${option.id}" data-refund-title="${escapeHtml(option.title)}">
      ${badge}
      <div class="refund-card">
        <div class="refund-card-main">
          <div class="refund-card-head">
            <p class="refund-card-title">${escapeHtml(option.title)}</p>
            ${renderRefundRadio()}
          </div>
          <div class="refund-cost">
            <p class="refund-amount">${escapeHtml(option.amount)}</p>
            <p class="refund-hint">${escapeHtml(option.hint)}</p>
          </div>
          ${points}
          ${expires}
        </div>
        ${details}
      </div>
    </div>
  `;
}

function appendRefundWidget() {
  if (!chatBubblesEl) return null;

  conversationData.refundOption = null;

  const widget = document.createElement("div");
  widget.className = "chat-bubble chat-widget refund-widget is-entering";
  widget.innerHTML = `
    <div class="widget-text">
      <p>Проверил заказ — вот все способы вернуть деньги. Суммы указаны за весь заказ. <strong>Какой вариант выберете?</strong></p>
    </div>
    <div class="refund-widget-choices">
      <div class="refund-choices-inner">
        <div class="refund-options" role="radiogroup" aria-label="Способы возврата">
          ${REFUND_OPTIONS.map(renderRefundOption).join("")}
        </div>
        <button class="widget-btn" type="button" data-action="refund-continue" disabled>Продолжить</button>
      </div>
    </div>
  `;

  chatBubblesEl.appendChild(widget);
  setSuggests(["Не возвращать"]);
  requestAnimationFrame(() => {
    requestAnimationFrame(updateRefundMoreBtn);
  });
  return widget;
}

function selectRefundOption(optionEl) {
  const widget = optionEl.closest(".refund-widget");
  if (!widget) return;

  widget.querySelectorAll('[data-action="select-refund"]').forEach((el) => {
    const selected = el === optionEl;
    el.classList.toggle("is-selected", selected);
    el.setAttribute("aria-checked", String(selected));
    const img = el.querySelector(".refund-radio img");
    if (img) {
      img.src = selected
        ? "./assets/icons/radio-on.svg"
        : "./assets/icons/radio.svg";
    }
  });

  const option = REFUND_OPTIONS.find((item) => item.id === optionEl.dataset.refundId);
  conversationData.refundOption = {
    id: optionEl.dataset.refundId || "",
    title: optionEl.dataset.refundTitle || option?.title || "",
    amount: option?.amount || "",
    hint: option?.hint || "",
  };

  const continueBtn = widget.querySelector('[data-action="refund-continue"]');
  if (continueBtn) continueBtn.disabled = false;
  updateRefundMoreBtn();
}

function pinLatestUserBubble() {
  if (!chatBubblesEl) return;
  const users = chatBubblesEl.querySelectorAll(".chat-bubble-user");
  scrollChatToElement(users[users.length - 1]);
}

function collapseRefundWidget() {
  const widget = document.querySelector(".refund-widget");
  if (!widget || widget.classList.contains("is-collapsed")) return;
  widget.classList.add("is-collapsed");
  updateRefundMoreBtn();
  const choices = widget.querySelector(".refund-widget-choices");
  const pin = () => pinLatestUserBubble();
  if (choices) {
    choices.addEventListener("transitionend", pin, { once: true });
  }
  setTimeout(pin, 300);
}

function refundArrivalText(option) {
  const amount = option?.amount || "9 990 ₽";
  const hint = option?.hint || "";
  const period = hint.match(/в течение\s+(.+)/i);
  const days = period ? period[1].replace(/\.$/, "") : "30 рабочих дней";
  return `${amount} придут на счёт в течение ${days}.`;
}

function appendRefundSuccessBubble() {
  const option = conversationData.refundOption || {};
  const email = escapeHtml(conversationData.email || "example@gmail.com");
  const bubble = appendBotBubbleHTML(
    `<p><strong>Оформили возврат</strong></p>` +
      `<p>${escapeHtml(refundArrivalText(option))}</p>` +
      `<p>Следить за статусом возврата можно в разделе <a href="#" class="bot-link" data-action="open-orders"><strong>Мои поездки</strong></a>.</p>` +
      `<p>Все подробности отправили на почту <strong>${email}</strong>. Если письма долго нет, загляните в папку «Спам».</p>` +
      `<p>Если появятся вопросы — пишите, я всегда рядом 💙</p>`
  );
  requestAnimationFrame(() => pinLatestUserBubble());
  return bubble;
}

function updateRefundMoreBtn() {
  if (!refundMoreBtn || !supportChatEl) return;
  const widget = document.querySelector(".refund-widget");
  const continueBtn = widget?.querySelector('[data-action="refund-continue"]');
  if (
    !widget ||
    widget.classList.contains("is-collapsed") ||
    !continueBtn ||
    refundModal?.classList.contains("is-open") ||
    calcModal?.classList.contains("is-open")
  ) {
    refundMoreBtn.hidden = true;
    return;
  }
  const chatRect = supportChatEl.getBoundingClientRect();
  const btnRect = continueBtn.getBoundingClientRect();
  refundMoreBtn.hidden = btnRect.bottom <= chatRect.bottom + 8;
}

function formatRefundFlight(order) {
  if (!order?.title) return "—";
  const rawDate = (order.date || "").split("—")[0].trim();
  const shortDate = rawDate.replace(/,\s*[а-яё]{2}$/i, "").trim();
  return shortDate ? `${order.title}, ${shortDate}` : order.title;
}

function formatPassengers(count) {
  const n = Number(count) || 0;
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word =
    mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
      ? "человека"
      : "человек";
  return `${n} ${word}`;
}

function fillRefundSheet() {
  const option = conversationData.refundOption || {};
  const order = conversationData.orderInfo || {};
  if (refundSheetAmount) refundSheetAmount.textContent = option.amount || "—";
  if (refundSheetHint) refundSheetHint.textContent = option.hint || "";
  if (refundSheetReason) refundSheetReason.textContent = option.title || "—";
  if (refundSheetFlight) refundSheetFlight.textContent = formatRefundFlight(order);
  if (refundSheetPax) refundSheetPax.textContent = formatPassengers(order.passengers || 3);
}

function setRefundModal(open) {
  if (!refundModal) return;
  refundModal.classList.toggle("is-open", open);
  refundModal.setAttribute("aria-hidden", String(!open));
  if (open) {
    fillRefundSheet();
    if (refundSheetAgree) refundSheetAgree.checked = false;
    if (refundSheetSubmit) refundSheetSubmit.disabled = true;
  }
  updateRefundMoreBtn();
}

function fillCalcSheet(option) {
  const hasPoints = Boolean(option?.points);
  if (calcReturnTotal) calcReturnTotal.textContent = hasPoints ? "36 000 ₽" : "20 000 ₽";
  if (calcPointsBlock) calcPointsBlock.hidden = !hasPoints;
  if (hasPoints) {
    if (calcPointsValue) calcPointsValue.textContent = "4 599";
    if (calcMoneyValue) calcMoneyValue.textContent = "31 001 ₽";
  }
}

function setCalcModal(open, option) {
  if (!calcModal) return;
  calcModal.classList.toggle("is-open", open);
  calcModal.setAttribute("aria-hidden", String(!open));
  if (open) fillCalcSheet(option);
  updateRefundMoreBtn();
}

function openCalcDetails(buttonEl) {
  const optionEl = buttonEl?.closest("[data-refund-id]");
  const option = REFUND_OPTIONS.find((item) => item.id === optionEl?.dataset.refundId);
  if (!option) return;
  setCalcModal(true, option);
}

function confirmRefundOption(buttonEl) {
  if (buttonEl?.disabled) return;
  if (!conversationData.refundOption?.title) return;
  if (conversationData.refundOption.amount) {
    setRefundModal(true);
    return;
  }
  collapseRefundWidget();
  sendUserMessage(conversationData.refundOption.title);
}

function appendOrdersWidget() {
  if (!chatBubblesEl) return null;

  const widget = document.createElement("div");
  widget.className = "chat-bubble chat-widget is-entering";
  widget.innerHTML = `
    <div class="widget-text">
      <p>По какому заказу у вас вопрос?</p>
    </div>
    <div class="widget-orders">
      ${SUPPORT_ORDERS.map(renderOrderCard).join("")}
    </div>
    <button class="widget-btn" type="button">Посмотреть все заказы</button>
  `;

  chatBubblesEl.appendChild(widget);
  return widget;
}

function attachUserTail(bubble) {
  if (!bubble) return;
  const tail = document.createElement("img");
  tail.className = "chat-bubble-tail";
  tail.src = "./assets/icons/chat-user-tail.svg";
  tail.alt = "";
  tail.setAttribute("aria-hidden", "true");
  bubble.appendChild(tail);
}

function setSuggests(items) {
  if (!chatSuggestsEl) return;
  chatSuggestsEl.innerHTML = "";
  items.forEach((text) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chat-suggest";
    btn.textContent = text;
    chatSuggestsEl.appendChild(btn);
  });
}

function isRefundConfirmMessage(userText) {
  const text = (userText || "").trim();
  if (!text) return false;
  if (/^оформить возврат$/i.test(text)) return true;
  const option = conversationData.refundOption;
  return Boolean(option?.title && option.amount && text === option.title);
}

function isRefundDocsMessage(userText) {
  const text = (userText || "").trim();
  const option = conversationData.refundOption;
  return Boolean(option?.title && !option.amount && text === option.title);
}

function ruleMatches(rule, userText) {
  if (!rule.match) return true;
  if (typeof rule.match === "function") return rule.match(userText);
  return rule.match.test(userText);
}

function findBotReply(userText) {
  // State-bound rules win first: when the conversation is in a specific step,
  // the next user message triggers that rule regardless of content (unless the
  // rule also declares its own `match`, in which case both must hold).
  if (conversationState) {
    const stateRule = BOT_REPLIES.find(
      (rule) =>
        rule.requiresState === conversationState && ruleMatches(rule, userText)
    );
    if (stateRule) return stateRule;
  }
  return BOT_REPLIES.find(
    (rule) => !rule.requiresState && rule.match && ruleMatches(rule, userText)
  );
}

// Send-animation timeline (per Figma spec):
//  · 0 ms   — haptic, send→stop icon morph (150 ms), suggests fade-out (150 ms),
//             chat list smooth-scrolls up (300 ms)
//  · 150 ms — sent bubble fades in (150 ms)
//  · 250 ms — typing indicator fades in (150 ms)
//  · 400 ms — send animation done; we keep "stop" state until the bot replies
//  · ~1200 ms — bot reply rendered, typing removed, button morphs back to send
const SEND_ANIM_TYPING_DELAY = 250;
const BOT_REPLY_DELAY = 1200;

function scheduleBotReply(userText) {
  const rule = findBotReply(userText);
  if (!rule) {
    if (supportSendBtn) supportSendBtn.classList.remove("is-sending");
    return;
  }

  setTimeout(() => {
    if (rule.loading === "ai") appendAiLoading();
    else appendTypingBubble();
  }, SEND_ANIM_TYPING_DELAY);

  setTimeout(() => {
    removeTypingBubble();
    if (typeof rule.render === "function") rule.render(userText);
    if (rule.suggests) setSuggests(rule.suggests);
    if (rule.placeholder && supportInput) {
      supportInput.placeholder = rule.placeholder;
    }
    if (Object.prototype.hasOwnProperty.call(rule, "nextState")) {
      conversationState = rule.nextState;
    }
    if (supportSendBtn) supportSendBtn.classList.remove("is-sending");
  }, BOT_REPLY_DELAY);
}

function appendTypingBubble() {
  if (!chatBubblesEl) return null;
  removeTypingBubble();
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble chat-bubble-typing is-entering";
  bubble.innerHTML =
    '<span class="chat-typing-dot"></span>' +
    '<span class="chat-typing-dot"></span>' +
    '<span class="chat-typing-dot"></span>';
  chatBubblesEl.appendChild(bubble);
  requestAnimationFrame(() => scrollChatToElement(bubble));
  return bubble;
}

function appendAiLoading() {
  if (!chatBubblesEl) return null;
  removeTypingBubble();
  const row = document.createElement("div");
  row.className = "ai-loading is-entering";
  row.setAttribute("role", "status");
  row.innerHTML =
    '<img class="ai-loading-star" src="./assets/icons/ai-star.svg" alt="" width="16" height="16">' +
    '<p class="ai-loading-text">Нейросеть собирает информацию</p>';
  chatBubblesEl.appendChild(row);
  requestAnimationFrame(() => pinLatestUserBubble());
  return row;
}

function removeTypingBubble() {
  if (!chatBubblesEl) return;
  chatBubblesEl.querySelector(".chat-bubble-typing")?.remove();
  chatBubblesEl.querySelector(".ai-loading")?.remove();
}

function fadeOutSuggests() {
  if (!chatSuggestsEl || chatSuggestsEl.children.length === 0) return;
  chatSuggestsEl.classList.add("is-leaving");
  setTimeout(() => {
    chatSuggestsEl.classList.remove("is-leaving");
    chatSuggestsEl.innerHTML = "";
  }, 150);
}

function triggerSendHaptic() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(8);
  }
}

function scrollChatToElement(element) {
  if (!supportChatEl || !element) return;
  const containerRect = supportChatEl.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const offset = elementRect.top - containerRect.top;
  const target = Math.max(0, supportChatEl.scrollTop + offset - 16);
  supportChatEl.scrollTo({ top: target, behavior: "smooth" });
}

function readAttachedFilesFromInput() {
  const filesEl = document.querySelector("#supportInputFiles");
  if (!filesEl || filesEl.hidden) return [];
  return Array.from(filesEl.children).map((chip) => ({
    name: chip.querySelector(".support-file-name")?.textContent || "",
    ext: chip.querySelector(".support-file-ext")?.textContent || "",
    size: chip.querySelector(".support-file-size")?.textContent || "",
  }));
}

function clearAttachedFilesInInput() {
  const filesEl = document.querySelector("#supportInputFiles");
  if (!filesEl) return;
  filesEl.innerHTML = "";
  filesEl.hidden = true;
}

function sendUserMessage(textOverride) {
  if (!supportInput || !chatBubblesEl) return;
  const raw = textOverride !== undefined ? textOverride : supportInput.value;
  const text = raw.trim();
  const files = textOverride === undefined ? readAttachedFilesFromInput() : [];

  if (!text && files.length === 0) return;

  triggerSendHaptic();
  if (supportSendBtn) supportSendBtn.classList.add("is-sending");
  fadeOutSuggests();
  removeTypingBubble();

  let bubble;
  if (files.length > 0) {
    bubble = appendUserFilesBubble(files, text);
    if (bubble) bubble.classList.add("is-entering", "is-entering-delayed");
    clearAttachedFilesInInput();
  } else {
    bubble = document.createElement("div");
    bubble.className =
      "chat-bubble chat-bubble-user is-entering is-entering-delayed";
    bubble.textContent = text;
    attachUserTail(bubble);
    chatBubblesEl.appendChild(bubble);
  }

  supportInput.value = "";
  updateSendBtnState();

  requestAnimationFrame(() => scrollChatToElement(bubble));

  scheduleBotReply(text);
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str).replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])
  );
}

function appendUserFilesBubble(files, text) {
  if (!chatBubblesEl) return null;

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble chat-bubble-user chat-bubble-files";
  bubble.innerHTML = `
    <div class="user-files">
      ${files
        .map(
          (file) => `
        <div class="user-file">
          <span class="user-file-icon" aria-hidden="true">
            <svg viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.7949 4.70285L9.2449 0.202846C9.1133 0.0726923 8.9355 0 8.75 0H1.4C0.6265 0 0 0.619615 0 1.38462V16.6154C0 17.3804 0.6265 18 1.4 18H12.6C13.3735 18 14 17.3804 14 16.6154V5.19231C14 5.00885 13.9265 4.833 13.7949 4.70285ZM9.1 5.53846C8.7136 5.53846 8.4 5.22831 8.4 4.84615V1.31815L12.6672 5.53846H9.1Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="user-file-text">
            <span class="user-file-name-row">
              <span class="user-file-name">${escapeHtml(file.name)}</span><span class="user-file-ext">${escapeHtml(file.ext)}</span>
            </span>
            <span class="user-file-size">${escapeHtml(file.size)}</span>
          </span>
        </div>
      `
        )
        .join("")}
    </div>
    ${text ? `<p class="user-files-text">${escapeHtml(text)}</p>` : ""}
  `;

  chatBubblesEl.appendChild(bubble);
  return bubble;
}

function appendSummaryWidget(options) {
  if (!chatBubblesEl) return null;

  const emailUpdated = !!(options && options.emailUpdated);
  const commentUpdated = !!(options && options.commentUpdated);

  const orderText = conversationData.orderInfo
    ? `${conversationData.orderInfo.title}, ${conversationData.orderInfo.date}`
    : "Поддержка поможет найти его номер";

  const comment = (conversationData.comment || "").trim();
  const problemHtml = comment ? escapeHtml(comment) : "—";

  const email = conversationData.email || "—";

  let introText = "Проверьте хорошенько, всё ли верно?";
  if (emailUpdated) {
    introText = "Готово, почту обновил. Всё верно?";
  } else if (commentUpdated) {
    introText = "Добавил ваш комментарий — всё верно?";
  }

  const widget = document.createElement("div");
  widget.className = "chat-bubble chat-summary is-entering";
  widget.innerHTML = `
    <p class="summary-intro">${escapeHtml(introText)}</p>
    <div class="summary-section">
      <p class="summary-label">Заказ</p>
      <p class="summary-value">${escapeHtml(orderText)}</p>
    </div>
    <div class="summary-section">
      <p class="summary-label">Проблема</p>
      <p class="summary-value">${problemHtml}</p>
    </div>
    <div class="summary-section">
      <p class="summary-label">Ответ придёт на почту</p>
      <p class="summary-value">${escapeHtml(email)}</p>
    </div>
  `;

  chatBubblesEl.appendChild(widget);
  return widget;
}

if (supportInput) {
  supportInput.addEventListener("input", updateSendBtnState);
}

if (supportForm) {
  supportForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendUserMessage();
  });
}

if (chatSuggestsEl) {
  chatSuggestsEl.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest(".chat-suggest") : null;
    if (!target) return;
    sendUserMessage(target.textContent || "");
  });
}

function setOrdersModal(open) {
  if (!ordersModal) return;
  ordersModal.classList.toggle("is-open", open);
  ordersModal.setAttribute("aria-hidden", String(!open));
}

// Shared handler for tapping an order card — works for both the in-chat widget
// and the "Мои заказы" bottom-sheet. If the tap came from inside the modal we
// also slide the modal down before continuing the chat flow.
function selectOrderFromCard(orderCard) {
  if (!orderCard) return;
  const title = orderCard.dataset.orderTitle || "";
  const date = orderCard.dataset.orderDate || "";
  const passengers = Number(orderCard.dataset.orderPassengers) || 3;
  conversationData.orderInfo = { title, date, passengers };

  // Strip the order list + "view all" button from the still-visible chat
  // widget so the user can't re-pick the same order twice.
  const sourceWidget = orderCard.closest(".chat-widget");
  const chatWidgetOrders = chatBubblesEl
    ? chatBubblesEl.querySelector(".chat-widget .widget-orders")
    : null;
  const chatWidget = sourceWidget || chatWidgetOrders?.closest(".chat-widget");
  if (chatWidget) {
    chatWidget.querySelector(".widget-orders")?.remove();
    chatWidget.querySelector(".widget-btn")?.remove();
  }

  // If the tap came from the bottom-sheet, dismiss it; the chat send animation
  // begins immediately so the user sees the new bubble appear behind the sheet.
  const fromModal = !!orderCard.closest("#ordersModal");
  if (fromModal) setOrdersModal(false);

  sendUserMessage(`${title}, ${date}`);
}

if (chatBubblesEl) {
  chatBubblesEl.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const orderLink = event.target.closest('[data-action="open-orders"]');
    if (orderLink) {
      event.preventDefault();
      openOrdersFromChat();
      return;
    }

    const orderCard = event.target.closest('[data-action="select-order"]');
    if (orderCard) {
      selectOrderFromCard(orderCard);
      return;
    }

    const refundDetails = event.target.closest('[data-action="refund-details"]');
    if (refundDetails) {
      event.preventDefault();
      event.stopPropagation();
      openCalcDetails(refundDetails);
      return;
    }

    const refundContinue = event.target.closest('[data-action="refund-continue"]');
    if (refundContinue) {
      event.preventDefault();
      event.stopPropagation();
      confirmRefundOption(refundContinue);
      return;
    }

    const refundOption = event.target.closest('[data-action="select-refund"]');
    if (refundOption) {
      selectRefundOption(refundOption);
      return;
    }

    const target = event.target.closest(".widget-btn");
    if (!target) return;
    if (target.dataset.action === "attach") {
      showAttachedFiles();
      return;
    }
    setOrdersModal(true);
  });

  chatBubblesEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!(event.target instanceof Element)) return;
    const refundOption = event.target.closest('[data-action="select-refund"]');
    if (!refundOption) return;
    event.preventDefault();
    selectRefundOption(refundOption);
  });
}

const supportInputFilesEl = document.querySelector("#supportInputFiles");
if (supportInputFilesEl) {
  supportInputFilesEl.addEventListener("click", (event) => {
    const removeBtn = event.target instanceof Element ? event.target.closest(".support-file-remove") : null;
    if (!removeBtn) return;
    const file = removeBtn.closest(".support-file");
    if (file) file.remove();
    if (supportInputFilesEl.children.length === 0) {
      supportInputFilesEl.hidden = true;
    }
    updateSendBtnState();
  });
}

if (ordersCloseBtn) {
  ordersCloseBtn.addEventListener("click", () => setOrdersModal(false));
}

if (ordersBackdrop) {
  ordersBackdrop.addEventListener("click", () => setOrdersModal(false));
}

if (ordersModal) {
  ordersModal.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const orderCard = event.target.closest('[data-action="select-order"]');
    if (!orderCard) return;
    selectOrderFromCard(orderCard);
  });
}

if (ordersBackBtn) {
  ordersBackBtn.addEventListener("click", () => {
    setEmailModal(false);
    setOrdersScreen(false);
  });
}

if (screenOrders) {
  const togglePax = (toggle) => {
    const card = toggle.closest(".ord-list-expand");
    if (!card) return;
    const expanded = card.classList.toggle("is-expanded");
    toggle.setAttribute("aria-expanded", String(expanded));
    const bodyId = toggle.getAttribute("aria-controls");
    const body = bodyId ? document.getElementById(bodyId) : null;
    if (body) body.hidden = !expanded;
    const meta = card.querySelector(".ord-row-meta");
    if (meta) meta.hidden = expanded;
  };

  screenOrders.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const toggle = event.target.closest('[data-action="toggle-pax"]');
    if (toggle) togglePax(toggle);
  });

  screenOrders.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!(event.target instanceof Element)) return;
    const toggle = event.target.closest('[data-action="toggle-pax"]');
    if (!toggle) return;
    event.preventDefault();
    togglePax(toggle);
  });
}

if (profileBookingCard) {
  const openFromProfile = () => setOrdersScreen(true);
  profileBookingCard.addEventListener("click", openFromProfile);
  profileBookingCard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFromProfile();
    }
  });
}

function setOrdersTab(tab) {
  const isArchive = tab === "archive";
  if (ordersTabActive) {
    ordersTabActive.classList.toggle("is-active", !isArchive);
    ordersTabActive.setAttribute("aria-selected", String(!isArchive));
  }
  if (ordersTabArchive) {
    ordersTabArchive.classList.toggle("is-active", isArchive);
    ordersTabArchive.setAttribute("aria-selected", String(isArchive));
  }
  if (ordersPanelActive) ordersPanelActive.hidden = isArchive;
  if (ordersPanelArchive) ordersPanelArchive.hidden = !isArchive;
}

if (ordersTabActive) {
  ordersTabActive.addEventListener("click", () => setOrdersTab("active"));
}

if (ordersTabArchive) {
  ordersTabArchive.addEventListener("click", () => setOrdersTab("archive"));
}

if (supportChatEl) {
  supportChatEl.addEventListener("scroll", updateRefundMoreBtn, { passive: true });
}

window.addEventListener("resize", updateRefundMoreBtn);

if (refundMoreBtn) {
  refundMoreBtn.addEventListener("click", () => {
    const continueBtn = document.querySelector(".refund-widget [data-action='refund-continue']");
    continueBtn?.scrollIntoView({ block: "end", behavior: "smooth" });
  });
}

if (refundBackdrop) {
  refundBackdrop.addEventListener("click", () => setRefundModal(false));
}

if (calcBackdrop) {
  calcBackdrop.addEventListener("click", () => setCalcModal(false));
}

if (refundSheetAgree) {
  refundSheetAgree.addEventListener("change", () => {
    if (refundSheetSubmit) refundSheetSubmit.disabled = !refundSheetAgree.checked;
  });
}

if (refundSheetSubmit) {
  refundSheetSubmit.addEventListener("click", () => {
    if (refundSheetSubmit.disabled) return;
    setRefundModal(false);
    collapseRefundWidget();
    sendUserMessage(conversationData.refundOption?.title || "Оформить возврат");
  });
}

if (emailCloseBtn) {
  emailCloseBtn.addEventListener("click", () => setEmailModal(false));
}

if (emailBackdrop) {
  emailBackdrop.addEventListener("click", () => setEmailModal(false));
}

if (emailInput) {
  emailInput.addEventListener("input", updateEmailConfirmState);
}

if (emailConfirmBtn) {
  emailConfirmBtn.addEventListener("click", () => {
    if (emailConfirmBtn.disabled) return;
    const value = (emailInput?.value || "").trim();
    if (value) {
      conversationData.email = value;
      const ordPaxEmail = document.querySelector("#ordPaxEmail");
      if (ordPaxEmail) ordPaxEmail.textContent = value;
    }
    showEmailSentState(value);
  });
}

if (appSnackbar) {
  appSnackbar.addEventListener("click", () => hideSnackbar());
}
