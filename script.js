const ownerEmail = "owner@example.com";
const lineUrl = "";
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

mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

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
  formData.set("subject", subject);
  formData.set("message", body);

  summaryText.textContent = summary;
  mailtoLink.href = `mailto:${ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  localStorage.setItem(
    "latestCarSearchInquiry",
    JSON.stringify({
      submittedAt: new Date().toISOString(),
      entries: Object.fromEntries(entries),
    }),
  );

  const submitButton = form.querySelector(".submit-button");
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "送信中...";

  try {
    if (formEndpoint) {
      await sendForm(formData);
      resultMessage.textContent = "送信しました。内容を確認して、候補車が見つかり次第ご連絡します。";
    } else {
      resultMessage.textContent =
        "送信先メールが未設定のため、下記の内容で確認しました。メール下書きから送信できます。";
    }
    openModal();
    if (formEndpoint) {
      form.reset();
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
