function toBoolean(value) {
  return value === "true";
}

// security??
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseJsonScript(element, selector) {
  const script = element.querySelector(selector);

  if (!script) {
    return [];
  }

  try {
    const parsed = JSON.parse(script.textContent || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

// placeholder
function getSummary(config, selectedOptions) {
  if (!selectedOptions.length) {
    return config.placeholder;
  }

  if (config.mode === "multiple") {
    return `${selectedOptions.length} selected`;
  }

  return selectedOptions[0].label;
}

// cute tags
function renderTags(container, selectedOptions) {
  if (!container) {
    return;
  }

  container.innerHTML = selectedOptions
    .map(
      (option) => `
        <span class="ui-dropdown__tag">${escapeHtml(option.label)}</span>
      `
    )
    .join("");
}

function renderHiddenInputs(container, config, selectedOptions) {
  if (!container) {
    return;
  }

  const inputName =
    config.mode === "multiple" && !config.name.endsWith("[]")
      ? `${config.name}[]`
      : config.name;

  container.innerHTML = selectedOptions
    .map(
      (option) =>
        `<input type="hidden" name="${escapeHtml(inputName)}" value="${escapeHtml(option.value)}" />`
    )
    .join("");
}

// dropdown
function renderOptions(list, searchValue, state, config) {
  if (!list) {
    return;
  }

  const selectedValues = new Set(state.selectedValues);
  const normalizedQuery = searchValue.trim().toLowerCase();

  const filtered = config.options.filter((option) =>
    option.label.toLowerCase().includes(normalizedQuery)
  );

  list.innerHTML = filtered.length
    ? filtered
        .map((option) => {
          const selected = selectedValues.has(option.value);

          return `
            <label class="ui-dropdown__option ${selected ? "is-selected" : ""}">
              <span class="ui-dropdown__option-main">
                <input
                  class="ui-dropdown__control"
                  type="${config.mode === "multiple" ? "checkbox" : "radio"}"
                  name="${escapeHtml(config.groupName)}"
                  value="${escapeHtml(option.value)}"
                  data-value="${escapeHtml(option.value)}"
                  ${selected ? "checked" : ""}
                />
                <span>${escapeHtml(option.label)}</span>
              </span>
              ${
                config.mode === "multiple"
                  ? `<span class="ui-dropdown__indicator">${selected ? "Selected" : "Add"}</span>`
                  : ""
              }
            </label>
          `;
        })
        .join("")
    : `<div class="ui-dropdown__empty">${escapeHtml(config.emptyText)}</div>`;
}

// main function
function initDropdown(element) {
  if (element.dataset.dropdownInitialized === "true") {
    return;
  }

  const options = parseJsonScript(element, "[data-dropdown-options]");
  const initialSelected = parseJsonScript(element, "[data-dropdown-selected]");
  const config = {
    name: element.dataset.name || "dropdown",
    groupName: `${element.dataset.name || "dropdown"}-selection`,
    placeholder: element.dataset.placeholder || "Select an option",
    emptyText: element.dataset.emptyText || "No matching options",
    showLabel: element.dataset.showLabel !== "false",
    mode: element.dataset.mode === "multiple" ? "multiple" : "single",
    searchable: toBoolean(element.dataset.searchable),
    options
  };

  const state = {
    selectedValues: config.mode === "multiple" ? initialSelected : initialSelected.slice(0, 1)
  };

  const trigger = element.querySelector("[data-dropdown-trigger]");
  const panel = element.querySelector("[data-dropdown-panel]");
  const summary = element.querySelector("[data-dropdown-summary]");
  const optionsList = element.querySelector("[data-dropdown-options-list]");
  const hiddenInputs = element.querySelector("[data-dropdown-inputs]");
  const searchInput = element.querySelector("[data-dropdown-search]");
  const tags = element.querySelector("[data-dropdown-tags]");

  if (!trigger || !panel || !summary || !optionsList || !hiddenInputs) {
    return;
  }

  function selectedOptions() {
    return config.options.filter((option) => state.selectedValues.includes(option.value));
  }

  function syncUi() {
    const pickedOptions = selectedOptions();
    summary.textContent = getSummary(config, pickedOptions);
    renderTags(tags, pickedOptions);
    renderHiddenInputs(hiddenInputs, config, pickedOptions);
    renderOptions(optionsList, searchInput?.value || "", state, config);
  }

  function closePanel() {
    trigger.setAttribute("aria-expanded", "false");
    panel.hidden = true;
  }

  function openPanel() {
    trigger.setAttribute("aria-expanded", "true");
    panel.hidden = false;

    if (searchInput) {
      searchInput.focus();
    }
  }

  trigger.addEventListener("click", () => {
    if (panel.hidden) {
      openPanel();
      return;
    }

    closePanel();
  });

  optionsList.addEventListener("change", (event) => {
    const optionControl = event.target.closest(".ui-dropdown__control[data-value]");

    if (!optionControl) {
      return;
    }

    const { value } = optionControl.dataset;

    if (config.mode === "multiple") {
      state.selectedValues = optionControl.checked
        ? [...new Set([...state.selectedValues, value])]
        : state.selectedValues.filter((selectedValue) => selectedValue !== value);
    } else {
      state.selectedValues = [value];
      closePanel();
    }

    syncUi();
  });

  searchInput?.addEventListener("input", () => {
    renderOptions(optionsList, searchInput.value, state, config);
  });

  document.addEventListener("click", (event) => {
    if (!element.contains(event.target)) {
      closePanel();
    }
  });

  element.resetComponent = () => {
    state.selectedValues =
      config.mode === "multiple" ? [...initialSelected] : initialSelected.slice(0, 1);

    if (searchInput) {
      searchInput.value = "";
    }

    syncUi();
    closePanel();
  };

  element.dataset.dropdownInitialized = "true";
  syncUi();
}

export function initDropdowns(root = document) {
  root.querySelectorAll("[data-component='dropdown']").forEach(initDropdown);
}