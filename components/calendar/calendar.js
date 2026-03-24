function getMode(value) {
  return value === "range" ? "range" : "single";
}

function toBoolean(value) {
  return value === "true";
}

function initCalendar(element) {
  if (element.dataset.calendarInitialized === "true") {
    return;
  }

  const config = {
    mode: getMode(element.dataset.mode),
    name: element.dataset.name || "date",
    startName: element.dataset.startName || "startDate",
    endName: element.dataset.endName || "endDate",
    singleLabel: element.dataset.singleLabel || "",
    startLabel: element.dataset.startLabel || "",
    endLabel: element.dataset.endLabel || "",
    required: toBoolean(element.dataset.required)
  };

  const modeInputs = element.querySelectorAll("[data-calendar-mode]");
  const startLabel = element.querySelector("[data-calendar-start-label]");
  const endLabel = element.querySelector("[data-calendar-end-label]");
  const endWrap = element.querySelector("[data-calendar-end-wrap]");
  const inputsWrap = element.querySelector("[data-calendar-inputs]");
  const toggleOptions = element.querySelectorAll(".ui-calendar__toggle-option");
  const startInput = element.querySelector("[data-calendar-start-input]");
  const endInput = element.querySelector("[data-calendar-end-input]");

  if (!endWrap || !inputsWrap || !startInput || !endInput) {
    return;
  }

  function syncMode(mode) {
    const isRange = mode === "range";
    const activeStartLabel = isRange ? config.startLabel : config.singleLabel;

    if (startLabel) {
      startLabel.textContent = activeStartLabel;
      startLabel.hidden = !activeStartLabel;
    }

    if (endLabel) {
      endLabel.hidden = !config.endLabel;
    }
    endWrap.classList.toggle("ui-calendar__slot--hidden", !isRange);
    inputsWrap.classList.toggle("ui-calendar__inputs--range", isRange);
    startInput.name = isRange ? config.startName : config.name;
    startInput.required = config.required;
    endInput.name = config.endName;
    endInput.disabled = !isRange;
    endInput.required = config.required && isRange;
    startInput.setAttribute("aria-label", isRange ? config.startLabel || "Start Date" : config.singleLabel || "Date");
    endInput.setAttribute("aria-label", config.endLabel || "End Date");

    toggleOptions.forEach((option) => {
      const input = option.querySelector("input");
      option.classList.toggle("is-active", input?.value === mode);
    });
  }

  function syncInputState() {
    startInput.dataset.hasValue = String(Boolean(startInput.value));
    endInput.dataset.hasValue = String(Boolean(endInput.value));
  }

  modeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        config.mode = input.value === "range" ? "range" : "single";
        syncMode(config.mode);
        syncInputState();
      }
    });
  });

  startInput.addEventListener("input", syncInputState);
  endInput.addEventListener("input", syncInputState);
  startInput.addEventListener("change", syncInputState);
  endInput.addEventListener("change", syncInputState);

  element.resetComponent = () => {
    config.mode = getMode(element.dataset.mode);
    modeInputs.forEach((input) => {
      input.checked = input.value === config.mode;
    });
    syncMode(config.mode);
    syncInputState();
  };

  syncMode(config.mode);
  syncInputState();
  element.dataset.calendarInitialized = "true";
}

export function initCalendars(root = document) {
  root.querySelectorAll("[data-component='calendar']").forEach(initCalendar);
}

if (typeof document !== "undefined") {
  initCalendars();
}
