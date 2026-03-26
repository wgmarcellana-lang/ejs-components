function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseJsonScript(element, selector, fallback) {
  const script = element.querySelector(selector);
  if (!script) return fallback;
  try {
    return JSON.parse(script.textContent || "");
  } catch (_error) {
    return fallback;
  }
}

function renderBadge(value, badgeMap) {
  const entry = badgeMap[value];
  const color = entry?.color || "gray";
  const label = entry?.label ?? value;
  return `<span class="ui-data-table__badge ui-data-table__badge--${escapeHtml(color)}">${escapeHtml(label)}</span>`;
}

function renderActionBtn(rowData, colConfig) {
  const label = escapeHtml(colConfig.action.label);
  const event = escapeHtml(colConfig.action.event);
  const payload = escapeHtml(JSON.stringify(rowData));
  return `<button
    class="ui-data-table__action-btn"
    type="button"
    data-action-event="${event}"
    data-action-payload='${payload}'
    aria-label="${label}"
  >${label}</button>`;
}

function renderCell(value, colConfig, rowData) {
  if (colConfig.type === "badge") {
    return renderBadge(value ?? "", colConfig.badgeMap);
  }
  if (colConfig.type === "action") {
    return renderActionBtn(rowData, colConfig);
  }
  return escapeHtml(value ?? "");
}

function getNestedValue(obj, key) {
  return key.split(".").reduce((acc, k) => (acc != null ? acc[k] : ""), obj);
}

function sortRows(rows, key, direction) {
  return [...rows].sort((a, b) => {
    const av = String(getNestedValue(a, key) ?? "").toLowerCase();
    const bv = String(getNestedValue(b, key) ?? "").toLowerCase();
    if (av < bv) return direction === "asc" ? -1 : 1;
    if (av > bv) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

function filterRows(rows, columns, query) {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    columns.some((col) => {
      if (col.type === "action") return false;
      const val = String(getNestedValue(row, col.key) ?? "").toLowerCase();
      return val.includes(q);
    })
  );
}

function buildPageNumbers(current, total) {
  const pages = new Set();
  pages.add(1);
  pages.add(total);
  for (let i = Math.max(1, current - 1); i <= Math.min(total, current + 1); i++) pages.add(i);

  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

function initDataTable(element) {
  if (element.dataset.datatableInitialized === "true") return;

  const columns = parseJsonScript(element, "[data-table-columns]", []);
  const allRows = parseJsonScript(element, "[data-table-rows]", []);
  const pageSizeOptions = parseJsonScript(element, "[data-table-page-size-options]", [10]);
  const emptyText = element.dataset.emptyText || "No records found.";
  const selectable = element.dataset.selectable === "true";

  const tbody = element.querySelector("[data-table-body]");
  const searchInput = element.querySelector("[data-table-search]");
  const pageSizeSelect = element.querySelector("[data-table-page-size]");
  const prevBtn = element.querySelector("[data-table-prev]");
  const nextBtn = element.querySelector("[data-table-next]");
  const pagesContainer = element.querySelector("[data-table-pages]");
  const infoEl = element.querySelector("[data-table-info]");
  const exportBtn = element.querySelector("[data-table-export]");
  const selectAllCheck = element.querySelector("[data-table-select-all]");
  const sortHeaders = element.querySelectorAll("[data-table-sort]");

  if (!tbody) return;

  const state = {
    query: "",
    sortKey: null,
    sortDir: "asc",
    page: 1,
    pageSize: parseInt(element.dataset.pageSize, 10) || 10,
    selectedIds: new Set(), // tracks row indices in filtered+sorted set
  };

  function getProcessedRows() {
    let rows = filterRows(allRows, columns, state.query);
    if (state.sortKey) {
      rows = sortRows(rows, state.sortKey, state.sortDir);
    }
    return rows;
  }

  function getPageRows(processed) {
    const start = (state.page - 1) * state.pageSize;
    return processed.slice(start, start + state.pageSize);
  }

  function renderRows(pageRows, processedTotal) {
    if (!pageRows.length) {
      tbody.innerHTML = `<tr><td class="ui-data-table__empty" colspan="${columns.length + (selectable ? 1 : 0)}">${escapeHtml(emptyText)}</td></tr>`;
      return;
    }

    tbody.innerHTML = pageRows
      .map((row, localIdx) => {
        const globalIdx = (state.page - 1) * state.pageSize + localIdx;
        const isSelected = state.selectedIds.has(globalIdx);
        const cells = columns
          .map((col) => {
            const val = getNestedValue(row, col.key);
            return `<td class="ui-data-table__td">${renderCell(val, col, row)}</td>`;
          })
          .join("");

        const checkCell = selectable
          ? `<td class="ui-data-table__td ui-data-table__td--check">
               <input type="checkbox" class="ui-data-table__check" data-row-index="${globalIdx}" ${isSelected ? "checked" : ""} aria-label="Select row" />
             </td>`
          : "";

        return `<tr${isSelected ? ' class="is-selected"' : ""} data-row-index="${globalIdx}">${checkCell}${cells}</tr>`;
      })
      .join("");
  }

  function renderPagination(total) {
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));

    if (prevBtn) prevBtn.disabled = state.page <= 1;
    if (nextBtn) nextBtn.disabled = state.page >= totalPages;

    if (pagesContainer) {
      const nums = buildPageNumbers(state.page, totalPages);
      pagesContainer.innerHTML = nums
        .map((n) =>
          n === "…"
            ? `<span class="ui-data-table__page-ellipsis">…</span>`
            : `<button class="ui-data-table__page-num${n === state.page ? " is-active" : ""}" type="button" data-page="${n}" aria-label="Page ${n}"${n === state.page ? ' aria-current="page"' : ""}>${n}</button>`
        )
        .join("");
    }
  }

  function renderInfo(total) {
    if (!infoEl) return;
    if (total === 0) {
      infoEl.textContent = "of 0";
      return;
    }
    infoEl.textContent = `of ${total}`;
  }

  function renderSortHeaders() {
    sortHeaders.forEach((th) => {
      const key = th.dataset.tableSort;
      if (key === state.sortKey) {
        th.setAttribute("aria-sort", state.sortDir === "asc" ? "ascending" : "descending");
      } else {
        th.setAttribute("aria-sort", "none");
      }
    });
  }

  function renderSelectAll(pageRows, processedTotal) {
    if (!selectAllCheck) return;
    const start = (state.page - 1) * state.pageSize;
    const end = Math.min(start + state.pageSize, processedTotal);
    const allSelected = pageRows.length > 0 && Array.from({ length: end - start }, (_, i) => start + i).every((i) => state.selectedIds.has(i));
    selectAllCheck.checked = allSelected;
    selectAllCheck.indeterminate = !allSelected && state.selectedIds.size > 0;
  }

  function render() {
    const processed = getProcessedRows();
    const totalPages = Math.max(1, Math.ceil(processed.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;

    const pageRows = getPageRows(processed);

    renderRows(pageRows, processed.length);
    renderPagination(processed.length);
    renderInfo(processed.length);
    renderSortHeaders();
    renderSelectAll(pageRows, processed.length);
  }

  // ──search ──
  searchInput?.addEventListener("input", () => {
    state.query = searchInput.value;
    state.page = 1;
    state.selectedIds.clear();
    render();
  });

  // ── page size ──
  pageSizeSelect?.addEventListener("change", () => {
    state.pageSize = parseInt(pageSizeSelect.value, 10) || 10;
    state.page = 1;
    state.selectedIds.clear();
    render();
  });

  // ── prev/next ──
  prevBtn?.addEventListener("click", () => {
    if (state.page > 1) { state.page--; render(); }
  });

  nextBtn?.addEventListener("click", () => {
    const total = Math.max(1, Math.ceil(getProcessedRows().length / state.pageSize));
    if (state.page < total) { state.page++; render(); }
  });

  // ── page number buttons ──
  pagesContainer?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn) return;
    state.page = parseInt(btn.dataset.page, 10);
    render();
  });

  // ── sort headers ──
  sortHeaders.forEach((th) => {
    function doSort() {
      const key = th.dataset.tableSort;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = key;
        state.sortDir = "asc";
      }
      state.page = 1;
      render();
    }
    th.addEventListener("click", doSort);
    th.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doSort(); }
    });
  });

  // ── row selection ──
  tbody.addEventListener("change", (e) => {
    const check = e.target.closest(".ui-data-table__check[data-row-index]");
    if (!check) return;
    const idx = parseInt(check.dataset.rowIndex, 10);
    if (check.checked) {
      state.selectedIds.add(idx);
    } else {
      state.selectedIds.delete(idx);
    }
    const row = check.closest("tr");
    if (row) row.classList.toggle("is-selected", check.checked);
    renderSelectAll(getPageRows(getProcessedRows()), getProcessedRows().length);
    emitSelectionChange();
  });

  // ── select all ──
  selectAllCheck?.addEventListener("change", () => {
    const processed = getProcessedRows();
    const start = (state.page - 1) * state.pageSize;
    const end = Math.min(start + state.pageSize, processed.length);
    for (let i = start; i < end; i++) {
      if (selectAllCheck.checked) {
        state.selectedIds.add(i);
      } else {
        state.selectedIds.delete(i);
      }
    }
    render();
    emitSelectionChange();
  });

  // ── action buttons ──
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action-event]");
    if (!btn) return;
    const eventName = btn.dataset.actionEvent;
    let payload = {};
    try { payload = JSON.parse(btn.dataset.actionPayload || "{}"); } catch (_error) {}
    element.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      detail: { component: "data-table", id: element.id, row: payload }
    }));
  });

  // ── export ──
  exportBtn?.addEventListener("click", () => {
    const processed = getProcessedRows();
    element.dispatchEvent(new CustomEvent("datatable:export", {
      bubbles: true,
      detail: { component: "data-table", id: element.id, rows: processed }
    }));
  });

  function emitSelectionChange() {
    const processed = getProcessedRows();
    const selected = [...state.selectedIds].map((i) => processed[i]).filter(Boolean);
    element.dispatchEvent(new CustomEvent("datatable:selectionchange", {
      bubbles: true,
      detail: { component: "data-table", id: element.id, selected }
    }));
  }

  // ── public api ──
  element.getSelectedRows = () => {
    const processed = getProcessedRows();
    return [...state.selectedIds].map((i) => processed[i]).filter(Boolean);
  };

  element.resetComponent = () => {
    state.query = "";
    state.sortKey = null;
    state.sortDir = "asc";
    state.page = 1;
    state.selectedIds.clear();
    if (searchInput) searchInput.value = "";
    if (pageSizeSelect) pageSizeSelect.value = String(parseInt(element.dataset.pageSize, 10) || 10);
    render();
  };

  element.dataset.datatableInitialized = "true";
  render();
}

export function initDataTables(root = document) {
  root.querySelectorAll("[data-component='data-table']").forEach(initDataTable);
}

if (typeof document !== "undefined") {
  initDataTables();
}