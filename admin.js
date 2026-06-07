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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
