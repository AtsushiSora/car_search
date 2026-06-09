const ownerEmail = "closet.full.of.love@icloud.com";
const ownerPhoneDisplay = "03-1234-5678";
const ownerPhoneHref = "0312345678";
const businessHours = "9:00-18:00";
const lineUrl = "https://lin.ee/Xp9AUJy";
const lineWebhookEndpoint = "";
const formEndpoint = "";
const stockDataUrl = "data/stock.csv";
const exampleDataUrl = "data/examples.csv";

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
const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
const phoneTextNodes = document.querySelectorAll("[data-site-phone]");
const businessHourNodes = document.querySelectorAll("[data-site-hours]");
const filterButtons = document.querySelectorAll(".filter-button");
const exampleResultCount = document.querySelector("#exampleResultCount");
const exampleGrid = document.querySelector("#exampleGrid");
const methodGuide = document.querySelector("#methodGuide");
const liveSummaryList = document.querySelector("#liveSummaryList");
const formProgressText = document.querySelector("#formProgressText");
const formProgressBar = document.querySelector("#formProgressBar");
const needGuide = document.querySelector("#needGuide");
const exampleFillButtons = document.querySelectorAll(".js-fill-example");
const loanSections = document.querySelectorAll("[data-loan-section]");
const exampleAssist = document.querySelector(".example-assist");
const stockGrid = document.querySelector("#stockGrid");

const methodGuides = {
  電話: "電話で条件を確認します。電話番号を入力していただくと折り返しがスムーズです。",
  メール: "メールで候補車の写真・状態・費用感をまとめてご連絡します。",
  LINE: "LINEで写真や追加条件をやり取りできます。送信後の画面からLINE相談へ進めます。",
};

const labels = {
  inquiryType: "相談種別",
  contactMethod: "希望の相談方法",
  supportNeeds: "相談したいこと",
  area: "対応地域",
  carModel: "車種",
  year: "年式",
  mileage: "走行距離",
  color: "色",
  budget: "予算",
  paymentMethod: "支払い方法",
  monthlyPayment: "月々の希望額",
  downPayment: "頭金",
  timing: "購入時期",
  loanConcern: "ローン審査の不安",
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

phoneLinks.forEach((link) => {
  link.href = `tel:${ownerPhoneHref}`;

  const phoneText = link.querySelector("strong");
  const hoursText = link.querySelector("small");

  if (phoneText) {
    phoneText.textContent = ownerPhoneDisplay;
  } else if (link.textContent.trim().match(/^[0-9-]+$/) || link.textContent.includes("電話する")) {
    link.textContent = link.textContent.includes("電話する") ? "電話する" : ownerPhoneDisplay;
  }

  if (hoursText) {
    hoursText.textContent = businessHours;
  }
});

phoneTextNodes.forEach((node) => {
  node.textContent = ownerPhoneDisplay;
});

businessHourNodes.forEach((node) => {
  node.textContent = businessHours;
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

exampleFillButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyInquiryExample(button);
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
applyUrlPrefill();
updateDynamicForm();
loadExampleVehicles();
loadStockVehicles();

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const formData = new FormData(form);
  const inquiryType = String(formData.get("inquiryType") || "格安軽・ローン相談");
  const entries = getSubmissionLabelEntries(inquiryType).map(([name, label]) => {
    const value = getFormEntryValue(formData, name);
    return [label, value || "未定"];
  });

  const summary = entries.map(([label, value]) => `${label}: ${value}`).join("\n");
  const customerName = String(formData.get("customerName") || "お客様").trim();
  const carModel = String(formData.get("carModel") || "車探し相談").trim();
  const subject = `格安軽・ローン相談: ${customerName}様 / ${carModel}`;
  const body = `下記の内容で格安軽・ローン相談がありました。\n\n${summary}`;
  const submittedAt = new Date().toISOString();
  const payload = {
    subject,
    message: body,
    fields: Object.fromEntries(entries),
    submittedAt,
  };
  formData.set("subject", subject);
  formData.set("message", body);
  formData.set("submittedAt", submittedAt);
  formData.set("sourcePage", window.location.href);

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

    if (getFormEndpoint()) {
      await sendForm(formData);
      sentToForm = true;
    }

    if (sentToLine) {
      resultMessage.textContent = "送信しました。相談内容をLINEへ通知しました。";
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

document.addEventListener("click", (event) => {
  const link = event.target.closest(".stock-consult-link");
  if (!link || !form) {
    return;
  }

  const carName = link.dataset.carName || "";
  const carModel = form.querySelector('[name="carModel"]');
  if (carModel && carName) {
    carModel.value = carName;
    updateDynamicForm();
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
  const endpoint = getFormEndpoint();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(formData).toString(),
  });

  if (!response.ok) {
    throw new Error("Form submission failed");
  }
}

function getFormEndpoint() {
  if (formEndpoint) {
    return formEndpoint;
  }

  if (!form?.dataset.netlify) {
    return "";
  }

  const host = window.location.hostname;
  const isLocalPreview = !host || host === "localhost" || host === "127.0.0.1";
  const isGitHubPages = host.endsWith("github.io");
  return isLocalPreview || isGitHubPages ? "" : "/";
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
  const carCards = document.querySelectorAll(".car-card");

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

async function loadExampleVehicles() {
  if (!exampleGrid) {
    return;
  }

  try {
    const response = await fetch(`${exampleDataUrl}?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error("Example data fetch failed");
    }

    const csvText = await response.text();
    const vehicles = parseCsv(csvText)
      .filter((vehicle) => String(vehicle.visible || "TRUE").toUpperCase() !== "FALSE")
      .filter((vehicle) => vehicle.name);

    renderExampleVehicles(vehicles);
  } catch {
    exampleGrid.innerHTML = '<p class="example-empty">ご提案例データを読み込めませんでした。</p>';
    if (exampleResultCount) {
      exampleResultCount.textContent = "0台を表示中";
    }
  }
}

function renderExampleVehicles(vehicles) {
  if (!vehicles.length) {
    exampleGrid.innerHTML = '<p class="example-empty">現在表示できるご提案例はありません。</p>';
    if (exampleResultCount) {
      exampleResultCount.textContent = "0台を表示中";
    }
    return;
  }

  exampleGrid.innerHTML = vehicles.map(createExampleCard).join("");
  filterExamples(getActiveExampleFilter());
}

function createExampleCard(vehicle) {
  const name = vehicle.name || "車両名未設定";
  const image = vehicle.image || "assets/example-suv.png";
  const budget = vehicle.budget || "mid";
  const category = vehicle.category || "family";

  return `
    <article class="car-card" data-budget="${escapeHtml(budget)}" data-category="${escapeHtml(category)}">
      <img class="car-photo" src="${escapeHtml(image)}" alt="${escapeHtml(name)}のご提案例" loading="lazy" />
      <h3>${escapeHtml(name)}</h3>
      <dl>
        <div><dt>年式</dt><dd>${escapeHtml(vehicle.year || "未定")}</dd></div>
        <div><dt>走行距離</dt><dd>${escapeHtml(vehicle.mileage || "未定")}</dd></div>
        <div><dt>価格目安</dt><dd>${escapeHtml(vehicle.price || "応相談")}</dd></div>
      </dl>
    </article>
  `;
}

function getActiveExampleFilter() {
  return document.querySelector(".filter-button.is-active")?.dataset.filter || "all";
}

async function loadStockVehicles() {
  if (!stockGrid) {
    return;
  }

  try {
    const response = await fetch(`${stockDataUrl}?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error("Stock data fetch failed");
    }

    const csvText = await response.text();
    const vehicles = parseCsv(csvText)
      .filter((vehicle) => String(vehicle.visible || "TRUE").toUpperCase() !== "FALSE")
      .filter((vehicle) => vehicle.name);

    renderStockVehicles(vehicles);
  } catch {
    stockGrid.innerHTML = '<p class="stock-empty">在庫データを読み込めませんでした。</p>';
  }
}

function renderStockVehicles(vehicles) {
  if (!vehicles.length) {
    stockGrid.innerHTML = '<p class="stock-empty">現在表示できる在庫はありません。</p>';
    return;
  }

  stockGrid.innerHTML = vehicles.map(createStockCard).join("");
}

function createStockCard(vehicle) {
  const maker = vehicle.maker || "";
  const name = vehicle.name || "車両名未設定";
  const image = vehicle.image || "assets/example-suv.png";
  const label = vehicle.label || "在庫あり";
  const note = vehicle.note || "詳細はお問い合わせください。";
  const consultHref = form ? "#contact" : `contact.html?car=${encodeURIComponent(name)}`;

  return `
    <article class="stock-card">
      <div class="stock-photo-wrap">
        <img class="stock-photo" src="${escapeHtml(image)}" alt="${escapeHtml(name)}の在庫車両" loading="lazy" />
        <span class="stock-badge">${escapeHtml(label)}</span>
      </div>
      <div class="stock-body">
        <p class="stock-maker">${escapeHtml(maker)}</p>
        <h3>${escapeHtml(name)}</h3>
        <dl>
          ${createStockSpec("年式", vehicle.year)}
          ${createStockSpec("走行距離", vehicle.mileage)}
          ${createStockSpec("色", vehicle.color)}
          ${createStockSpec("車検", vehicle.inspection)}
        </dl>
        <p class="stock-price">${escapeHtml(vehicle.price || "応相談")}<span>総額目安</span></p>
        <p class="stock-note">${escapeHtml(note)}</p>
        <a class="primary-link stock-consult-link" href="${consultHref}" data-car-name="${escapeHtml(name)}">この車を相談する</a>
      </div>
    </article>
  `;
}

function applyUrlPrefill() {
  if (!form) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const carName = params.get("car");
  const contactMethod = params.get("method");
  const needs = params.getAll("need");
  const inquiryType = params.get("type");
  const area = params.get("area");

  if (carName) {
    const carModel = form.querySelector('[name="carModel"]');
    if (carModel) {
      carModel.value = carName;
    }
  }

  if (contactMethod) {
    const methodField = [...form.querySelectorAll('[name="contactMethod"]')].find(
      (field) => field.value === contactMethod,
    );
    if (methodField) {
      methodField.checked = true;
    }
  }

  if (inquiryType) {
    const typeField = [...form.querySelectorAll('[name="inquiryType"]')].find((field) => field.value === inquiryType);
    if (typeField) {
      typeField.checked = true;
    } else {
      const hiddenTypeField = form.querySelector('input[type="hidden"][name="inquiryType"]');
      if (hiddenTypeField) {
        hiddenTypeField.value = inquiryType;
      }
    }
  }

  if (area) {
    const areaField = form.querySelector('[name="area"]');
    if (areaField) {
      areaField.value = area === "その他" ? "その他（全国対応・陸送費別途）" : area;
    }
  }

  needs.forEach((need) => {
    const needField = [...form.querySelectorAll('[name="supportNeeds"]')].find((field) => field.value === need);
    if (needField) {
      needField.checked = true;
    }
  });
}

function applyInquiryExample(button) {
  if (!form) {
    return;
  }

  const supportNeed = button.dataset.supportNeed;
  const values = {
    area: button.dataset.area,
    carModel: button.dataset.carModel,
    budget: button.dataset.budget,
    paymentMethod: button.dataset.paymentMethod,
    monthlyPayment: button.dataset.monthlyPayment,
    downPayment: button.dataset.downPayment,
    loanConcern: button.dataset.loanConcern,
    notes: button.dataset.notes,
  };

  if (supportNeed) {
    const supportNeeds = supportNeed.split(",").map((need) => need.trim()).filter(Boolean);
    form.querySelectorAll('[name="supportNeeds"]').forEach((field) => {
      field.checked = supportNeeds.includes(field.value);
    });
  }

  Object.entries(values).forEach(([name, value]) => {
    if (!value) {
      return;
    }
    const field = form.querySelector(`[name="${name}"]`);
    if (field) {
      field.value = value;
    }
  });

  updateDynamicForm();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function createStockSpec(label, value) {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || "未定")}</dd></div>`;
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((cell) => cell.trim())) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim())) {
    rows.push(row);
  }

  const headers = rows.shift()?.map((header) => header.trim()) || [];
  return rows.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, String(cells[index] || "").trim()])),
  );
}

function updateDynamicForm() {
  if (!form) {
    return;
  }

  let formData = new FormData(form);
  const inquiryType = String(formData.get("inquiryType") || "格安軽・ローン相談");
  const wantsLoanSupport = true;
  setLoanSectionState(wantsLoanSupport);
  formData = new FormData(form);
  const contactMethod = String(formData.get("contactMethod") || "メール");
  const area = getFieldValue(formData, "area", "未選択");
  const carModel = getFieldValue(formData, "carModel", "未入力");
  const budget = getFieldValue(formData, "budget", "未入力");
  const paymentMethod = getFieldValue(formData, "paymentMethod", "未定");
  const supportNeeds = getFieldValues(formData, "supportNeeds", "未選択");
  const monthlyPayment = getFieldValue(formData, "monthlyPayment", "未入力");
  const downPayment = getFieldValue(formData, "downPayment", "未定");
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
        : contactMethod === "LINE"
          ? "LINE相談を送信する"
          : "メール相談を送信する";
  }

  if (liveSummaryList) {
    const summaryRows = [
      ["相談方法", contactMethod],
      ["相談したいこと", supportNeeds],
      ["対応地域", area],
      ["希望車種", carModel],
      ["予算", budget],
      ["支払い方法", paymentMethod],
      ["月々の希望", monthlyPayment],
      ["頭金", downPayment],
      ["購入時期", timing],
    ];

    liveSummaryList.innerHTML = summaryRows
      .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
      .join("");
  }

  if (needGuide) {
    needGuide.innerHTML = createNeedGuide(formData.getAll("supportNeeds"), area);
  }

  const requiredNames =
    contactMethod === "電話"
      ? ["area", "carModel", "budget", "customerName", "email", "phone", "consent"]
      : ["area", "carModel", "budget", "customerName", "email", "consent"];
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

function getSubmissionLabelEntries(inquiryType) {
  const names = [
    "inquiryType",
    "contactMethod",
    "supportNeeds",
    "area",
    "carModel",
    "year",
    "mileage",
    "color",
    "budget",
    "paymentMethod",
    "monthlyPayment",
    "downPayment",
    "timing",
    "loanConcern",
    "notes",
    "customerName",
    "email",
    "phone",
  ];

  return names.map((name) => [name, labels[name]]).filter(([, label]) => label);
}

function setLoanSectionState(isVisible) {
  loanSections.forEach((section) => {
    section.hidden = !isVisible;
    section.querySelectorAll("input, select, textarea").forEach((field) => {
      field.disabled = !isVisible;
    });
  });

  if (exampleAssist) {
    exampleAssist.hidden = !isVisible;
  }
}

function getFieldValues(formData, name, fallback) {
  const values = formData.getAll(name).map((value) => String(value).trim()).filter(Boolean);
  return values.length ? values.join("、") : fallback;
}

function getFormEntryValue(formData, name) {
  return formData.getAll(name).map((value) => String(value).trim()).filter(Boolean).join("、");
}

function createNeedGuide(needs, area = "") {
  const selectedNeeds = needs.map((need) => String(need));
  const guideItems = [];

  if (selectedNeeds.includes("格安の軽自動車を探したい")) {
    guideItems.push("総額予算、用途、通勤距離、車検付き希望などを書くと候補を絞りやすくなります。");
  }

  if (selectedNeeds.includes("ローン審査が不安")) {
    guideItems.push("月々の希望額、頭金、支払回数の希望があれば入力してください。未定でも相談できます。");
  }

  if (selectedNeeds.includes("月々の支払いを抑えたい")) {
    guideItems.push("無理なく払える月額の上限を入れると、車両価格と支払い方法を考えやすくなります。");
  }

  if (selectedNeeds.includes("頭金なしで相談したい")) {
    guideItems.push("頭金なし希望の場合も、月々の上限や購入時期を一緒に入力してください。");
  }

  if (area.includes("その他")) {
    guideItems.push("全国対応の場合は、車両代とは別に陸送費・登録費などがかかる場合があります。");
  } else if (area) {
    guideItems.push(`${area}を中心に、納車までの費用感を確認してご案内します。`);
  }

  if (!guideItems.length) {
    guideItems.push("総額予算、地域、月々の希望額を入力してください。決まっていない項目は未定で大丈夫です。");
  }

  return `<strong>入力のポイント</strong><ul>${guideItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
