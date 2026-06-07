const ownerEmail = "owner@example.com";
const lineUrl = "https://lin.ee/Xp9AUJy";
const lineWebhookEndpoint = "";
const formEndpoint = "";

const menuButton = document.querySelector(".menu-button");
const mobileNav = document.querySelector("#mobileNav");
const form = document.querySelector("#orderForm");
const modal = document.querySelector("#resultModal");
const closeButton = document.querySelector(".modal-close");
const summaryText = document.querySelector("#summaryText");
const resultMessage = document.querySelector("#resultMessage");
const mailtoLink = document.querySelector("#mailtoLink");
const modalLineLink = document.querySelector("#modalLineLink");
const copyButton = document.querySelector("#copyButton");
const lineLinks = document.querySelectorAll(".js-line-link");
const emailLinks = document.querySelectorAll(".js-email-link");
const filterButtons = document.querySelectorAll(".filter-button");
const carCards = document.querySelectorAll(".car-card");
const exampleResultCount = document.querySelector("#exampleResultCount");
const methodGuide = document.querySelector("#methodGuide");
const liveSummaryList = document.querySelector("#liveSummaryList");
const formProgressText = document.querySelector("#formProgressText");
const formProgressBar = document.querySelector("#formProgressBar");

const methodGuides = {
  電話: "電話で条件を確認します。電話番号を入力していただくと折り返しがスムーズです。",
  メール: "メールで候補車の写真・状態・費用感をまとめてご連絡します。",
  ビジネスLINE: "LINEで写真や追加条件をやり取りできます。送信後の画面からLINE相談へ進めます。",
};

const labels = {
  contactMethod: "希望の相談方法",
  carModel: "車種",
  year: "年式",
  mileage: "走行距離",
  color: "色",
  budget: "予算",
  timing: "購入時期",
  notes: "その他の希望",
  customerName: "お名前",
  email: "メールアドレス",
  phone: "電話番号",
};

menuButton?.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

lineLinks.forEach((link) => {
  link.href = lineUrl || "#contact";
});

emailLinks.forEach((link) => {
  link.href = `mailto:${ownerEmail}`;
});

if (modalLineLink) {
  modalLineLink.href = lineUrl || "#contact";
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    filterExamples(button.dataset.filter);
  });
});

mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

form?.addEventListener("input", updateDynamicForm);
form?.addEventListener("change", updateDynamicForm);
updateDynamicForm();
filterExamples("all");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const formData = new FormData(form);
  const entries = Object.entries(labels).map(([name, label]) => {
    const value = String(formData.get(name) || "").trim();
    return [label, value || "未定"];
  });

  const summary = entries.map(([label, value]) => `${label}: ${value}`).join("\n");
  const customerName = String(formData.get("customerName") || "お客様").trim();
  const carModel = String(formData.get("carModel") || "車探し相談").trim();
  const subject = `車探し相談: ${customerName}様 / ${carModel}`;
  const body = `下記の内容で車探しの相談がありました。\n\n${summary}`;
  const payload = {
    subject,
    message: body,
    fields: Object.fromEntries(entries),
    submittedAt: new Date().toISOString(),
  };
  formData.set("subject", subject);
  formData.set("message", body);

  summaryText.textContent = summary;
  mailtoLink.href = `mailto:${ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  if (modalLineLink) {
    modalLineLink.href = lineUrl || createLineShareUrl(body);
  }

  localStorage.setItem(
    "latestCarSearchInquiry",
    JSON.stringify({
      submittedAt: payload.submittedAt,
      entries: payload.fields,
    }),
  );

  const submitButton = form.querySelector(".submit-button");
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "送信中...";

  try {
    let sentToLine = false;
    let sentToForm = false;

    if (lineWebhookEndpoint) {
      await sendLineWebhook(payload);
      sentToLine = true;
    }

    if (formEndpoint) {
      await sendForm(formData);
      sentToForm = true;
    }

    if (sentToLine) {
      resultMessage.textContent = "送信しました。相談内容をビジネスLINEへ通知しました。";
    } else if (sentToForm) {
      resultMessage.textContent = "送信しました。内容を確認して、候補車が見つかり次第ご連絡します。";
    } else {
      resultMessage.textContent =
        "LINE通知先が未設定のため、下記の内容で確認しました。内容コピー、メール下書き、またはLINEから送信できます。";
    }
    openModal();
    if (sentToLine || sentToForm) {
      form.reset();
      updateDynamicForm();
    }
  } catch {
    resultMessage.textContent =
      "自動送信に失敗しました。下記の内容をメール下書き、またはLINEから送ってください。";
    openModal();
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
});

copyButton?.addEventListener("click", async () => {
  if (!summaryText.textContent) {
    return;
  }

  try {
    await navigator.clipboard.writeText(summaryText.textContent);
    copyButton.textContent = "コピーしました";
    setTimeout(() => {
      copyButton.textContent = "内容をコピー";
    }, 1800);
  } catch {
    copyButton.textContent = "コピーできませんでした";
  }
});

closeButton?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal?.classList.contains("is-open")) {
    closeModal();
  }
});

function openModal() {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  closeButton?.focus();
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

async function sendForm(formData) {
  const response = await fetch(formEndpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Form submission failed");
  }
}

async function sendLineWebhook(payload) {
  const response = await fetch(lineWebhookEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("LINE webhook submission failed");
  }
}

function createLineShareUrl(message) {
  return `https://line.me/R/share?text=${encodeURIComponent(message)}`;
}

function filterExamples(filter) {
  let visibleCount = 0;

  carCards.forEach((card) => {
    const budget = card.dataset.budget;
    const category = card.dataset.category;
    const shouldShow =
      filter === "all" ||
      budget === filter ||
      (filter === "mid" && budget === "low") ||
      category === filter;

    card.classList.toggle("is-hidden", !shouldShow);
    if (shouldShow) {
      visibleCount += 1;
    }
  });

  if (exampleResultCount) {
    exampleResultCount.textContent = `${visibleCount}台を表示中`;
  }
}

function updateDynamicForm() {
  if (!form) {
    return;
  }

  const formData = new FormData(form);
  const contactMethod = String(formData.get("contactMethod") || "メール");
  const carModel = getFieldValue(formData, "carModel", "未入力");
  const budget = getFieldValue(formData, "budget", "未入力");
  const timing = getFieldValue(formData, "timing", "未定");
  const phone = form.querySelector('[name="phone"]');
  const submitButton = form.querySelector(".submit-button");

  if (methodGuide) {
    methodGuide.textContent = methodGuides[contactMethod] || methodGuides.メール;
  }

  if (phone) {
    phone.required = contactMethod === "電話";
  }

  if (submitButton) {
    submitButton.textContent =
      contactMethod === "電話"
        ? "電話相談を送信する"
        : contactMethod === "ビジネスLINE"
          ? "LINE相談を送信する"
          : "メール相談を送信する";
  }

  if (liveSummaryList) {
    liveSummaryList.innerHTML = [
      ["相談方法", contactMethod],
      ["車種", carModel],
      ["予算", budget],
      ["購入時期", timing],
    ]
      .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
      .join("");
  }

  const requiredNames =
    contactMethod === "電話"
      ? ["carModel", "budget", "customerName", "email", "phone", "consent"]
      : ["carModel", "budget", "customerName", "email", "consent"];
  const completedCount = requiredNames.filter((name) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (!field) {
      return false;
    }
    if (field.type === "checkbox") {
      return field.checked;
    }
    return String(formData.get(name) || "").trim().length > 0;
  }).length;
  const progress = Math.round((completedCount / requiredNames.length) * 100);

  if (formProgressText) {
    formProgressText.textContent = `入力済み ${completedCount}/${requiredNames.length}`;
  }

  if (formProgressBar) {
    formProgressBar.style.width = `${progress}%`;
  }
}

function getFieldValue(formData, name, fallback) {
  return String(formData.get(name) || "").trim() || fallback;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
