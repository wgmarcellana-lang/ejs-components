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

function parseDateValue(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return Date.UTC(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function createDefaultFilterState(filters) {
  const state = {};

  filters.forEach((filter) => {
    if (filter.type === "date-range") {
      state[filter.key] = { from: "", to: "" };
      return;
    }

    state[filter.key] = new Set(filter.options.map((option) => String(option.value)));
  });

  return state;
}

function cloneFilterState(source, filters) {
  const next = createDefaultFilterState(filters);

  filters.forEach((filter) => {
    const currentValue = source?.[filter.key];

    if (filter.type === "date-range") {
      next[filter.key] = {
        from: typeof currentValue?.from === "string" ? currentValue.from : "",
        to: typeof currentValue?.to === "string" ? currentValue.to : "",
      };
      return;
    }

    if (currentValue instanceof Set) {
      next[filter.key] = new Set(currentValue);
      return;
    }

    if (Array.isArray(currentValue)) {
      next[filter.key] = new Set(currentValue.map(String));
    }
  });

  return next;
}

function countActiveFilterGroups(filters, appliedFilters) {
  return filters.reduce((count, filter) => {
    const currentValue = appliedFilters[filter.key];

    if (filter.type === "date-range") {
      return currentValue?.from || currentValue?.to ? count + 1 : count;
    }

    const selectedCount = currentValue instanceof Set ? currentValue.size : filter.options.length;
    return selectedCount > 0 && selectedCount < filter.options.length ? count + 1 : count;
  }, 0);
}

function filterRows(rows, columns, query, filters, appliedFilters) {
  const q = query.trim().toLowerCase();

  return rows.filter((row) => {
    if (q) {
      const matchesQuery = columns.some((col) => {
        if (col.type === "action") return false;
        const val = String(getNestedValue(row, col.key) ?? "").toLowerCase();
        return val.includes(q);
      });
      if (!matchesQuery) return false;
    }

    for (const filter of filters) {
      const currentValue = appliedFilters[filter.key];

      if (filter.type === "date-range") {
        const fromValue = currentValue?.from || "";
        const toValue = currentValue?.to || "";

        if (!fromValue && !toValue) continue;

        const rowDate = parseDateValue(String(getNestedValue(row, filter.key) ?? ""));
        if (rowDate == null) return false;

        const fromDate = parseDateValue(fromValue);
        const toDate = parseDateValue(toValue);

        if (fromDate != null && rowDate < fromDate) return false;
        if (toDate != null && rowDate > toDate) return false;
        continue;
      }

      const allowedValues = currentValue instanceof Set ? currentValue : new Set(filter.options.map((option) => option.value));
      if (allowedValues.size === 0 || allowedValues.size === filter.options.length) continue;

      const val = String(getNestedValue(row, filter.key) ?? "");
      if (!allowedValues.has(val)) return false;
    }

    return true;
  });
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

function serializeAppliedFilters(filters, appliedFilters) {
  return filters.map((filter) => {
    const value = appliedFilters[filter.key];

    if (filter.type === "date-range") {
      return {
        key: filter.key,
        type: filter.type,
        value: {
          from: value?.from || "",
          to: value?.to || "",
        },
      };
    }

    return {
      key: filter.key,
      type: filter.type,
      value: value instanceof Set ? [...value] : [],
    };
  });
}

function getFocusableElements(container) {
  if (!(container instanceof HTMLElement)) return [];

  return Array.from(
    container.querySelectorAll(
      "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
    )
  ).filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
}

function initDataTable(element) {
  if (element.dataset.datatableInitialized === "true") return;

  const columns = parseJsonScript(element, "[data-table-columns]", []);
  const allRows = parseJsonScript(element, "[data-table-rows]", []);
  parseJsonScript(element, "[data-table-page-size-options]", [10]);
  const filters = parseJsonScript(element, "[data-table-filters]", []);
  const emptyText = element.dataset.emptyText || "No records found.";
  const selectable = element.dataset.selectable === "true";
  const filterPresentation = element.dataset.filterPresentation === "modal" ? "modal" : "popup";
  const usesModalFilter = filterPresentation === "modal";

  const tbody = element.querySelector("[data-table-body]");
  const searchInput = element.querySelector("[data-table-search]");
  const pageSizeSelect = element.querySelector("[data-table-page-size]");
  const prevBtn = element.querySelector("[data-table-prev]");
  const nextBtn = element.querySelector("[data-table-next]");
  const pagesContainer = element.querySelector("[data-table-pages]");
  const infoEl = element.querySelector("[data-table-info]");
  const exportBtn = element.querySelector("[data-table-export]");
  const filterBtn = element.querySelector("[data-table-filter-btn]");
  const filterModal = element.querySelector("[data-table-filter-panel]");
  const filterDialog = element.querySelector(".ui-data-table__filter-panel");
  const filterCloseBtns = element.querySelectorAll("[data-table-filter-close]");
  const filterClearBtn = element.querySelector("[data-table-filter-clear]");
  const filterCancelBtn = element.querySelector("[data-table-filter-cancel]");
  const filterApplyBtn = element.querySelector("[data-table-filter-apply]");
  const filterBadge = element.querySelector("[data-filter-badge]");
  const filterChecks = element.querySelectorAll(".ui-data-table__filter-check");
  const filterPills = element.querySelectorAll("[data-filter-pill]");
  const filterDateInputs = element.querySelectorAll(".ui-data-table__filter-date-input");
  const selectAllCheck = element.querySelector("[data-table-select-all]");
  const sortButtons = element.querySelectorAll("[data-table-sort]");

  if (!tbody) return;

  const state = {
    query: "",
    sortKey: null,
    sortDir: "asc",
    page: 1,
    pageSize: parseInt(element.dataset.pageSize, 10) || 10,
    selectedIds: new Set(),
    appliedFilters: createDefaultFilterState(filters),
    draftFilters: createDefaultFilterState(filters),
  };
  let previousFocusedElement = null;

  if (usesModalFilter && filterModal && filterModal.parentElement !== document.body) {
    document.body.appendChild(filterModal);
  }

  function getProcessedRows() {
    let rows = filterRows(allRows, columns, state.query, filters, state.appliedFilters);
    if (state.sortKey) {
      rows = sortRows(rows, state.sortKey, state.sortDir);
    }
    return rows;
  }

  function getPageRows(processed) {
    const start = (state.page - 1) * state.pageSize;
    return processed.slice(start, start + state.pageSize);
  }

  function renderRows(pageRows) {
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
    sortButtons.forEach((button) => {
      const key = button.dataset.tableSort;
      const header = button.closest("th");

      if (!header) {
        return;
      }

      if (key === state.sortKey) {
        header.setAttribute("aria-sort", state.sortDir === "asc" ? "ascending" : "descending");
      } else {
        header.setAttribute("aria-sort", "none");
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

    renderRows(pageRows);
    renderPagination(processed.length);
    renderInfo(processed.length);
    renderSortHeaders();
    renderSelectAll(pageRows, processed.length);
  }

  function updateFilterBadge() {
    if (!filterBadge || !filterBtn) return;

    const activeCount = countActiveFilterGroups(filters, state.appliedFilters);

    if (activeCount > 0) {
      filterBadge.textContent = String(activeCount);
      filterBadge.hidden = false;
      filterBtn.classList.add("is-active");
    } else {
      filterBadge.hidden = true;
      filterBtn.classList.remove("is-active");
    }
  }

  function syncFilterControlsFromDraft() {
    filterChecks.forEach((check) => {
      const key = check.dataset.filterKey;
      const value = check.dataset.filterValue || "";
      const selectedValues = state.draftFilters[key];
      check.checked = selectedValues instanceof Set ? selectedValues.has(value) : true;
    });

    filterPills.forEach((pill) => {
      const key = pill.dataset.filterKey;
      const value = pill.dataset.filterValue || "";
      const selectedValues = state.draftFilters[key];
      const isSelected = selectedValues instanceof Set ? selectedValues.has(value) : true;

      pill.classList.toggle("is-selected", isSelected);
      pill.setAttribute("aria-pressed", String(isSelected));
    });

    filterDateInputs.forEach((input) => {
      const key = input.dataset.filterKey;
      const dateState = state.draftFilters[key];

      if (input.hasAttribute("data-filter-date-from")) {
        input.value = dateState?.from || "";
      } else {
        input.value = dateState?.to || "";
      }
    });
  }

  function resetDraftFilters() {
    state.draftFilters = createDefaultFilterState(filters);
    syncFilterControlsFromDraft();
  }

  function closeFilterPanel({ resetDraft = true } = {}) {
    if (resetDraft) {
      state.draftFilters = cloneFilterState(state.appliedFilters, filters);
      syncFilterControlsFromDraft();
    }

    if (filterModal) filterModal.hidden = true;
    filterBtn?.setAttribute("aria-expanded", "false");
    if (usesModalFilter) {
      filterBtn?.classList.remove("is-open");
    }

    if (usesModalFilter && !document.querySelector(".ui-data-table__filter-modal--modal:not([hidden])")) {
      document.body.classList.remove("ui-data-table-filter-open");
    }

    if (usesModalFilter) {
      previousFocusedElement?.focus?.();
      previousFocusedElement = null;
    }
  }

  function openFilterPanel() {
    state.draftFilters = cloneFilterState(state.appliedFilters, filters);
    syncFilterControlsFromDraft();
    if (usesModalFilter) {
      previousFocusedElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : filterBtn;
    }

    if (filterModal) filterModal.hidden = false;
    filterBtn?.setAttribute("aria-expanded", "true");
    if (usesModalFilter) {
      filterBtn?.classList.add("is-open");
      document.body.classList.add("ui-data-table-filter-open");
    }

    if (usesModalFilter) {
      window.requestAnimationFrame(() => {
        const focusTarget = filterCloseBtns[0] || getFocusableElements(filterDialog)[0] || filterDialog;
        focusTarget?.focus?.();
      });
    }
  }

  function emitFilterChange() {
    element.dispatchEvent(new CustomEvent("datatable:filter", {
      bubbles: true,
      detail: {
        component: "data-table",
        id: element.id,
        filters: serializeAppliedFilters(filters, state.appliedFilters),
      }
    }));
  }

  function applyDraftFilters() {
    state.appliedFilters = cloneFilterState(state.draftFilters, filters);
    state.page = 1;
    state.selectedIds.clear();
    updateFilterBadge();
    render();
    closeFilterPanel({ resetDraft: false });
    emitFilterChange();
  }

  searchInput?.addEventListener("input", () => {
    state.query = searchInput.value;
    state.page = 1;
    state.selectedIds.clear();
    render();
  });

  pageSizeSelect?.addEventListener("change", () => {
    state.pageSize = parseInt(pageSizeSelect.value, 10) || 10;
    state.page = 1;
    state.selectedIds.clear();
    render();
  });

  prevBtn?.addEventListener("click", () => {
    if (state.page > 1) {
      state.page--;
      render();
    }
  });

  nextBtn?.addEventListener("click", () => {
    const total = Math.max(1, Math.ceil(getProcessedRows().length / state.pageSize));
    if (state.page < total) {
      state.page++;
      render();
    }
  });

  pagesContainer?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn) return;
    state.page = parseInt(btn.dataset.page, 10);
    render();
  });

  sortButtons.forEach((button) => {
    function doSort() {
      const key = button.dataset.tableSort;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = key;
        state.sortDir = "asc";
      }
      state.page = 1;
      render();
    }

    button.addEventListener("click", doSort);
  });

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

  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action-event]");
    if (!btn) return;
    const eventName = btn.dataset.actionEvent;
    let payload = {};
    try {
      payload = JSON.parse(btn.dataset.actionPayload || "{}");
    } catch (_error) {}
    element.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      detail: { component: "data-table", id: element.id, row: payload }
    }));
  });

  filterBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = filterModal && !filterModal.hidden;
    if (isOpen) {
      closeFilterPanel();
    } else {
      openFilterPanel();
    }
  });

  filterCloseBtns.forEach((button) => {
    button.addEventListener("click", () => {
      closeFilterPanel();
    });
  });

  filterCancelBtn?.addEventListener("click", () => {
    closeFilterPanel();
  });

  filterClearBtn?.addEventListener("click", () => {
    resetDraftFilters();
  });

  filterApplyBtn?.addEventListener("click", () => {
    applyDraftFilters();
  });

  filterChecks.forEach((check) => {
    check.addEventListener("change", () => {
      const key = check.dataset.filterKey;
      if (!key) return;

      const selectedValues = state.draftFilters[key];
      if (!(selectedValues instanceof Set)) return;

      const filterConfig = filters.find((filter) => filter.key === key);
      const allowMultiple = filterConfig?.allowMultiple !== false;
      const value = check.dataset.filterValue || "";

      if (!allowMultiple) {
        selectedValues.clear();
      }

      if (check.checked) {
        selectedValues.add(value);
      } else {
        selectedValues.delete(value);
      }

      syncFilterControlsFromDraft();
    });
  });

  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const key = pill.dataset.filterKey;
      const value = pill.dataset.filterValue || "";
      const selectedValues = state.draftFilters[key];
      const filterConfig = filters.find((filter) => filter.key === key);

      if (!(selectedValues instanceof Set) || !filterConfig) return;

      if (filterConfig.allowMultiple === false) {
        selectedValues.clear();
        selectedValues.add(value);
      } else if (selectedValues.has(value)) {
        selectedValues.delete(value);
      } else {
        selectedValues.add(value);
      }

      syncFilterControlsFromDraft();
    });
  });

  filterDateInputs.forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.filterKey;
      if (!key) return;

      const currentDateRange = state.draftFilters[key];
      if (!currentDateRange || typeof currentDateRange !== "object" || currentDateRange instanceof Set) return;

      if (input.hasAttribute("data-filter-date-from")) {
        currentDateRange.from = input.value;
      } else {
        currentDateRange.to = input.value;
      }
    });
  });

  if (usesModalFilter) {
    filterModal?.addEventListener("click", (e) => {
      if (e.target === filterModal) {
        closeFilterPanel();
      }
    });
  } else {
    document.addEventListener("click", (e) => {
      if (filterModal && !filterModal.hidden && !element.contains(e.target)) {
        closeFilterPanel();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && filterModal && !filterModal.hidden) {
      closeFilterPanel();
      return;
    }

    if (usesModalFilter && e.key === "Tab" && filterModal && !filterModal.hidden && filterDialog) {
      const focusable = getFocusableElements(filterDialog);

      if (!focusable.length) {
        e.preventDefault();
        filterDialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

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
    state.appliedFilters = createDefaultFilterState(filters);
    state.draftFilters = createDefaultFilterState(filters);
    if (searchInput) searchInput.value = "";
    if (pageSizeSelect) pageSizeSelect.value = String(parseInt(element.dataset.pageSize, 10) || 10);
    syncFilterControlsFromDraft();
    updateFilterBadge();
    closeFilterPanel({ resetDraft: false });
    render();
  };

  element.dataset.datatableInitialized = "true";
  updateFilterBadge();
  render();
}

export function initDataTables(root = document) {
  root.querySelectorAll("[data-component='data-table']").forEach(initDataTable);
}

if (typeof document !== "undefined") {
  initDataTables();
}
