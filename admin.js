const adminDataSources = {
  stock: {
    url: "data/stock.csv",
    countSelector: "#stockPreviewCount",
    bodySelector: "#stockPreviewBody",
  },
  examples: {
    url: "data/examples.csv",
    countSelector: "#examplePreviewCount",
    bodySelector: "#examplePreviewBody",
  },
};

loadAdminPreview(adminDataSources.stock);
loadAdminPreview(adminDataSources.examples);
initializeStockBuilder();

async function loadAdminPreview(source) {
  const count = document.querySelector(source.countSelector);
  const body = document.querySelector(source.bodySelector);

  if (!count || !body) {
    return;
  }

  try {
    const response = await fetch(`${source.url}?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error("CSV fetch failed");
    }

    const rows = parseCsv(await response.text());
    const visibleRows = rows.filter((row) => String(row.visible || "TRUE").toUpperCase() !== "FALSE");
    count.textContent = `${visibleRows.length}台表示`;
    body.innerHTML = visibleRows.map(createPreviewRow).join("");
  } catch {
    count.textContent = "読込エラー";
    body.innerHTML = '<tr><td colspan="5">データを読み込めませんでした。</td></tr>';
  }
}

function createPreviewRow(row) {
  return `
    <tr>
      <td>${escapeHtml(row.name || "未設定")}</td>
      <td>${escapeHtml(row.year || "未定")}</td>
      <td>${escapeHtml(row.mileage || "未定")}</td>
      <td>${escapeHtml(row.price || "応相談")}</td>
      <td>${escapeHtml(row.visible || "TRUE")}</td>
    </tr>
  `;
}

function initializeStockBuilder() {
  const builder = document.querySelector("#stockBuilder");

  if (!builder) {
    return;
  }

  const body = document.querySelector("#stockBuilderBody");
  const output = document.querySelector("#stockCsvOutput");
  const message = document.querySelector("#stockBuilderMessage");
  const addButton = document.querySelector("#addStockRowButton");
  const clearButton = document.querySelector("#clearStockRowsButton");
  const copyButton = document.querySelector("#copyStockCsvButton");
  const downloadButton = document.querySelector("#downloadStockCsvButton");
  const loadCurrentButton = document.querySelector("#loadCurrentStockButton");
  const importInput = document.querySelector("#stockCsvImport");

  if (!body || !output) {
    return;
  }

  const stockHeaders = ["maker", "name", "year", "mileage", "color", "inspection", "price", "label", "note", "image", "visible"];
  const stockLabels = {
    maker: "メーカー",
    name: "車名",
    year: "年式",
    mileage: "走行距離",
    color: "色",
    inspection: "車検",
    price: "価格",
    label: "表示ラベル",
    note: "説明文",
    image: "画像パス",
    visible: "表示",
  };

  addButton?.addEventListener("click", () => {
    addStockBuilderRow(body);
    updateStockCsvOutput(body, output, stockHeaders);
    setBuilderMessage(message, "1台分の入力欄を追加しました。");
  });

  clearButton?.addEventListener("click", () => {
    body.innerHTML = "";
    addStockBuilderRow(body);
    updateStockCsvOutput(body, output, stockHeaders);
    setBuilderMessage(message, "入力欄を空にしました。");
  });

  copyButton?.addEventListener("click", async () => {
    updateStockCsvOutput(body, output, stockHeaders);
    try {
      await navigator.clipboard.writeText(output.value);
      setBuilderMessage(message, "CSVをコピーしました。");
    } catch {
      output.focus();
      output.select();
      setBuilderMessage(message, "コピーできない場合は、CSV欄を選択してコピーしてください。");
    }
  });

  downloadButton?.addEventListener("click", () => {
    updateStockCsvOutput(body, output, stockHeaders);
    downloadCsv(output.value, "stock.csv");
    setBuilderMessage(message, "stock.csvをダウンロードしました。");
  });

  loadCurrentButton?.addEventListener("click", async () => {
    try {
      const response = await fetch(`${adminDataSources.stock.url}?v=${Date.now()}`);
      if (!response.ok) {
        throw new Error("CSV fetch failed");
      }
      const rows = parseCsv(await response.text());
      renderStockBuilderRows(body, rows, stockHeaders, stockLabels);
      updateStockCsvOutput(body, output, stockHeaders);
      setBuilderMessage(message, "現在の在庫CSVを読み込みました。");
    } catch {
      setBuilderMessage(message, "現在の在庫CSVを読み込めませんでした。CSV読み込みを使ってください。");
    }
  });

  importInput?.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) {
      return;
    }
    const rows = parseCsv(await file.text());
    renderStockBuilderRows(body, rows, stockHeaders, stockLabels);
    updateStockCsvOutput(body, output, stockHeaders);
    importInput.value = "";
    setBuilderMessage(message, "選択したCSVを読み込みました。");
  });

  body.addEventListener("input", () => updateStockCsvOutput(body, output, stockHeaders));
  body.addEventListener("change", () => updateStockCsvOutput(body, output, stockHeaders));
  body.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".js-remove-stock-row");
    if (!removeButton) {
      return;
    }
    const row = removeButton.closest("tr");
    const rowId = row?.dataset.stockRow;
    if (rowId) {
      body.querySelectorAll(`[data-stock-row="${rowId}"]`).forEach((item) => item.remove());
    }
    if (!body.querySelector("tr")) {
      addStockBuilderRow(body);
    }
    updateStockCsvOutput(body, output, stockHeaders);
    setBuilderMessage(message, "1台分を削除しました。");
  });

  addStockBuilderRow(body, {
    maker: "ダイハツ",
    name: "ミライース L",
    year: "2015年",
    mileage: "8.9万km",
    color: "ホワイト",
    inspection: "車検整備付",
    price: "29.8万円",
    label: "掲載中",
    note: "通勤や買い物用に費用を抑えたい方向けの軽自動車です。",
    image: "assets/example-kei.png",
    visible: "TRUE",
  });
  updateStockCsvOutput(body, output, stockHeaders);
}

function renderStockBuilderRows(body, rows, headers, labels) {
  body.innerHTML = "";

  if (!rows.length) {
    addStockBuilderRow(body);
    return;
  }

  rows.forEach((row) => addStockBuilderRow(body, normalizeStockBuilderRow(row, headers, labels)));
}

function normalizeStockBuilderRow(row, headers, labels) {
  return Object.fromEntries(
    headers.map((header) => [header, row[header] || row[labels[header]] || ""]),
  );
}

function addStockBuilderRow(body, values = {}) {
  const rowId = `stock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const row = document.createElement("tr");
  row.dataset.stockRow = rowId;
  row.innerHTML = `
    <td><input type="text" data-stock-field="maker" value="${escapeAttribute(values.maker || "")}" placeholder="ダイハツ" /></td>
    <td><input type="text" data-stock-field="name" value="${escapeAttribute(values.name || "")}" placeholder="ミライース L" /></td>
    <td><input type="text" data-stock-field="year" value="${escapeAttribute(values.year || "")}" placeholder="2015年" /></td>
    <td><input type="text" data-stock-field="mileage" value="${escapeAttribute(values.mileage || "")}" placeholder="8.9万km" /></td>
    <td><input type="text" data-stock-field="color" value="${escapeAttribute(values.color || "")}" placeholder="ホワイト" /></td>
    <td><input type="text" data-stock-field="inspection" value="${escapeAttribute(values.inspection || "")}" placeholder="車検整備付" /></td>
    <td><input type="text" data-stock-field="price" value="${escapeAttribute(values.price || "")}" placeholder="29.8万円" /></td>
    <td>
      <select data-stock-field="visible">
        <option value="TRUE"${String(values.visible || "TRUE").toUpperCase() !== "FALSE" ? " selected" : ""}>表示</option>
        <option value="FALSE"${String(values.visible || "").toUpperCase() === "FALSE" ? " selected" : ""}>非表示</option>
      </select>
    </td>
    <td><button type="button" class="admin-row-remove js-remove-stock-row" aria-label="この車両を削除">削除</button></td>
  `;

  const extraRow = document.createElement("tr");
  extraRow.className = "admin-builder-extra-row";
  extraRow.dataset.stockRow = rowId;
  extraRow.innerHTML = `
    <td class="admin-builder-extra" colspan="9">
      <label>説明文<input type="text" data-stock-field="note" value="${escapeAttribute(values.note || "")}" placeholder="通勤や買い物用に費用を抑えたい方向けの軽自動車です。" /></label>
      <label>画像パス<input type="text" data-stock-field="image" value="${escapeAttribute(values.image || "assets/example-kei.png")}" placeholder="assets/example-kei.png" /></label>
      <label>表示ラベル<input type="text" data-stock-field="label" value="${escapeAttribute(values.label || "掲載中")}" placeholder="掲載中" /></label>
    </td>
  `;
  body.append(row, extraRow);
}

function updateStockCsvOutput(body, output, headers) {
  const rows = getStockBuilderRows(body).filter((row) => row.name || row.maker || row.price);
  output.value = createCsv(headers, rows);
}

function getStockBuilderRows(body) {
  return [...body.querySelectorAll("tr")]
    .filter((row) => row.dataset.stockRow && !row.classList.contains("admin-builder-extra-row"))
    .map((row) => {
      const nextRow = row.nextElementSibling?.classList.contains("admin-builder-extra-row")
        ? row.nextElementSibling
        : null;
      const fields = [...row.querySelectorAll("[data-stock-field]"), ...(nextRow ? [...nextRow.querySelectorAll("[data-stock-field]")] : [])];
      return Object.fromEntries(fields.map((field) => [field.dataset.stockField, field.value.trim()]));
    });
}

function createCsv(headers, rows) {
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header] || "")).join(","))].join("\n");
}

function escapeCsvCell(value) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsv(csvText, filename) {
  const blob = new Blob([`\ufeff${csvText}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setBuilderMessage(message, text) {
  if (message) {
    message.textContent = text;
  }
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

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
