function getMode(value) {
  return value === "range" ? "range" : "single";
}

export function initCalendars(root = document) {
  root.querySelectorAll("[data-component='calendar']").forEach((element) => {
    if (element.dataset.calendarInitialized === "true") {
      return;
    }

    const config = {
      mode: getMode(element.dataset.mode),
      singleLabel: element.dataset.singleLabel || "Date",
      startLabel: element.dataset.startLabel || "Start Date"
    };
    const modeInputs = element.querySelectorAll("[data-calendar-mode]");
    const startLabel = element.querySelector("[data-calendar-start-label]");
    const endWrap = element.querySelector("[data-calendar-end-wrap]");
    const inputsWrap = element.querySelector("[data-calendar-inputs]");
    const toggleOptions = element.querySelectorAll(".ui-calendar__toggle-option");

    if (!startLabel || !endWrap || !inputsWrap) {
      return;
    }

    function syncMode(mode) {
      const isRange = mode === "range";
      startLabel.textContent = isRange ? config.startLabel : config.singleLabel;
      endWrap.classList.toggle("ui-calendar__slot--hidden", !isRange);
      inputsWrap.classList.toggle("ui-calendar__inputs--range", isRange);
      toggleOptions.forEach((option) => {
        const input = option.querySelector("input");
        option.classList.toggle("is-active", input?.value === mode);
      });
    }

    modeInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) {
          config.mode = input.value === "range" ? "range" : "single";
          syncMode(config.mode);
        }
      });
    });

    element.resetComponent = () => {
      config.mode = getMode(element.dataset.mode);
      modeInputs.forEach((input) => {
        input.checked = input.value === config.mode;
      });
      syncMode(config.mode);
    };

    syncMode(config.mode);
    element.dataset.calendarInitialized = "true";
  });
}
