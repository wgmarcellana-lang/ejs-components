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
          const optionId = `${config.optionIdPrefix}-${escapeHtml(option.value)}`;

          return `
            <label
              class="ui-dropdown__option ${selected ? "is-selected" : ""}"
              id="${optionId}"
              role="option"
              aria-selected="${selected ? "true" : "false"}"
              tabindex="-1"
            >
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
  const name = element.dataset.name;
  const config = {
    name,
    groupName: `${name}-selection`,
    optionIdPrefix: `${element.id || name}-option`,
    placeholder: element.dataset.placeholder || "Select an option",
    emptyText: element.dataset.emptyText || "No matching options",
    showLabel: element.dataset.showLabel !== "false",
    mode: element.dataset.mode === "multiple" ? "multiple" : "single",
    searchable: toBoolean(element.dataset.searchable),
    hasOptions: toBoolean(element.dataset.hasOptions),
    options,
  };

  const state = {
    selectedValues: config.mode === "multiple" ? initialSelected : initialSelected.slice(0, 1),
    activeIndex: -1,
  };

  const trigger = element.querySelector("[data-dropdown-trigger]");
  const panel = element.querySelector("[data-dropdown-panel]");
  const summary = element.querySelector("[data-dropdown-summary]");
  const optionsList = element.querySelector("[data-dropdown-options-list]");
  const hiddenInputs = element.querySelector("[data-dropdown-inputs]");
  const searchInput = element.querySelector("[data-dropdown-search]");
  const tags = element.querySelector("[data-dropdown-tags]");
  const searchWrap = element.querySelector(".ui-dropdown__search-wrap");

  if (!trigger || !panel || !summary || !optionsList || !hiddenInputs) {
    return;
  }

  function selectedOptions() {
    return config.options.filter((option) => state.selectedValues.includes(option.value));
  }

  function getOptionElements() {
    return Array.from(optionsList.querySelectorAll(".ui-dropdown__option[role='option']"));
  }

  function emitChange() {
    const values = config.mode === "multiple" ? [...state.selectedValues] : state.selectedValues[0] || "";

    element.dispatchEvent(
      new CustomEvent("component:change", {
        bubbles: true,
        detail: {
          component: "dropdown",
          name: config.name,
          value: values,
        },
      })
    );
  }

  function syncUi() {
    const pickedOptions = selectedOptions();

    summary.textContent = getSummary(config, pickedOptions);
    summary.dataset.hasSelection = String(pickedOptions.length > 0);
    element.dataset.hasSelection = String(pickedOptions.length > 0);
    renderTags(tags, pickedOptions);
    renderHiddenInputs(hiddenInputs, config, pickedOptions);
    renderOptions(optionsList, searchInput?.value || "", state, config);
    state.activeIndex = -1;

    if (searchWrap) {
      searchWrap.hidden = !config.hasOptions;
    }
  }

  function closePanel() {
    trigger.setAttribute("aria-expanded", "false");
    panel.hidden = true;
    trigger.removeAttribute("aria-activedescendant");
    state.activeIndex = -1;
  }

  function setActiveOption(index) {
    const optionElements = getOptionElements();

    if (!optionElements.length) {
      state.activeIndex = -1;
      trigger.removeAttribute("aria-activedescendant");
      return;
    }

    const boundedIndex = Math.max(0, Math.min(index, optionElements.length - 1));
    const activeOption = optionElements[boundedIndex];

    state.activeIndex = boundedIndex;

    if (activeOption?.id) {
      trigger.setAttribute("aria-activedescendant", activeOption.id);
    }

    activeOption?.focus();
    activeOption?.scrollIntoView({ block: "nearest" });
  }

  function moveActiveOption(delta) {
    const optionElements = getOptionElements();

    if (!optionElements.length) {
      return;
    }

    const fallbackIndex = optionElements.findIndex((optionElement) =>
      optionElement.classList.contains("is-selected")
    );
    const startIndex = state.activeIndex >= 0 ? state.activeIndex : Math.max(fallbackIndex, 0);

    setActiveOption(startIndex + delta);
  }

  function activateFocusedOption() {
    const optionElements = getOptionElements();
    const activeOption = optionElements[state.activeIndex];
    const activeControl = activeOption?.querySelector(".ui-dropdown__control[data-value]");

    if (!activeControl) {
      return;
    }

    if (config.mode === "multiple") {
      activeControl.checked = !activeControl.checked;
    } else {
      activeControl.checked = true;
    }

    activeControl.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function openPanel() {
    trigger.setAttribute("aria-expanded", "true");
    panel.hidden = false;

    if (searchInput) {
      searchInput.focus();
      setActiveOption(0);
    } else {
      setActiveOption(0);
    }
  }

  trigger.addEventListener("click", () => {
    if (panel.hidden) {
      openPanel();
      return;
    }

    closePanel();
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (panel.hidden) {
        openPanel();
      } else {
        moveActiveOption(event.key === "ArrowDown" ? 1 : -1);
      }
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (panel.hidden) {
        openPanel();
      } else {
        closePanel();
      }
      return;
    }

    if (event.key === "Escape" && !panel.hidden) {
      event.preventDefault();
      closePanel();
    }
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
      trigger.focus();
    }

    syncUi();
    emitChange();
  });

  optionsList.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveOption(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveOption(-1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveOption(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveOption(getOptionElements().length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateFocusedOption();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closePanel();
      trigger.focus();
    }
  });

  optionsList.addEventListener("focusin", (event) => {
    const focusedOption = event.target.closest(".ui-dropdown__option[role='option']");
    const optionElements = getOptionElements();

    if (!focusedOption) {
      return;
    }

    state.activeIndex = optionElements.indexOf(focusedOption);

    if (focusedOption.id) {
      trigger.setAttribute("aria-activedescendant", focusedOption.id);
    }
  });

  searchInput?.addEventListener("input", () => {
    renderOptions(optionsList, searchInput.value, state, config);
    setActiveOption(0);
  });

  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveOption(0);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closePanel();
      trigger.focus();
    }
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
    emitChange();
  };

  element.dataset.dropdownInitialized = "true";
  syncUi();
  emitChange();
}

export function initDropdowns(root = document) {
  root.querySelectorAll("[data-component='dropdown']").forEach(initDropdown);
}

if (typeof document !== "undefined") {
  initDropdowns();
}
