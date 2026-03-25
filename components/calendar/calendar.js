function getMode(value) {
  return value === "range" ? "range" : "single";
}

function toBoolean(value) {
  return value === "true";
}

function createUtcDate(year, month, day) {
  return new Date(Date.UTC(year, month, day));
}

function parseIsoDate(value) {
  if (!value) {
    return null;
  }

  const parts = String(value).split("-");

  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts.map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return createUtcDate(year, month - 1, day);
}

function formatIsoDate(date) {
  if (!date) {
    return "";
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  if (!date) {
    return "MM/DD/YYYY";
  }

  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${month}/${day}/${year}`;
}

function formatMonthTitle(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

// month choose
function getMonthOptions() {
  return Array.from({ length: 12 }, (_value, index) => ({
    value: String(index),
    label: new Intl.DateTimeFormat("en-US", {
      month: "long",
      timeZone: "UTC"
    }).format(createUtcDate(2024, index, 1))
  }));
}

function getYearOptions(baseYear) {
  return Array.from({ length: 21 }, (_value, index) => {
    const year = baseYear - 10 + index;
    return { value: String(year), label: String(year) };
  });
}

function addMonths(date, delta) {
  return createUtcDate(date.getUTCFullYear(), date.getUTCMonth() + delta, 1);
}

function getTodayUtc() {
  const now = new Date();
  return createUtcDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function compareDates(a, b) {
  return formatIsoDate(a).localeCompare(formatIsoDate(b));
}

function isSameDay(a, b) {
  return Boolean(a && b && formatIsoDate(a) === formatIsoDate(b));
}

function isBetween(date, start, end) {
  if (!date || !start || !end) {
    return false;
  }

  return compareDates(date, start) > 0 && compareDates(date, end) < 0;
}

function getMonthCells(viewDate) {
  const year = viewDate.getUTCFullYear();
  const month = viewDate.getUTCMonth();
  const firstOfMonth = createUtcDate(year, month, 1);
  const leadingEmpty = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [];

  for (let index = 0; index < leadingEmpty; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(createUtcDate(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
  const toggleOptions = element.querySelectorAll(".ui-calendar__toggle-option");
  const singleWrap = element.querySelector("[data-calendar-single-wrap]");
  const rangeWrap = element.querySelector("[data-calendar-range-wrap]");
  const singleInput = element.querySelector("[data-calendar-single-input]");
  const startInput = element.querySelector("[data-calendar-start-input]");
  const endInput = element.querySelector("[data-calendar-end-input]");
  const singleTrigger = element.querySelector("[data-calendar-single-trigger]");
  const startTrigger = element.querySelector("[data-calendar-start-trigger]");
  const endTrigger = element.querySelector("[data-calendar-end-trigger]");
  const singleDisplay = element.querySelector("[data-calendar-single-display]");
  const startDisplay = element.querySelector("[data-calendar-start-display]");
  const endDisplay = element.querySelector("[data-calendar-end-display]");
  const panel = element.querySelector("[data-calendar-panel]");
  const title = element.querySelector("[data-calendar-title]");
  const grid = element.querySelector("[data-calendar-grid]");
  const prevButton = element.querySelector("[data-calendar-prev]");
  const nextButton = element.querySelector("[data-calendar-next]");
  const monthSelect = element.querySelector("[data-calendar-month]");
  const yearSelect = element.querySelector("[data-calendar-year]");

  if (
    !singleWrap ||
    !rangeWrap ||
    !singleInput ||
    !startInput ||
    !endInput ||
    !singleTrigger ||
    !startTrigger ||
    !endTrigger ||
    !singleDisplay ||
    !startDisplay ||
    !endDisplay ||
    !panel ||
    !grid ||
    !prevButton ||
    !nextButton ||
    !monthSelect ||
    !yearSelect
  ) {
    return;
  }

  const initialValues = {
    mode: config.mode,
    singleValue: singleInput.value,
    startValue: startInput.value,
    endValue: endInput.value
  };

  const state = {
    mode: config.mode,
    isOpen: false,
    activeBoundary: "start",
    singleDate: parseIsoDate(singleInput.value),
    rangeStart: parseIsoDate(startInput.value),
    rangeEnd: parseIsoDate(endInput.value),
    viewDate:
      parseIsoDate(startInput.value) ||
      parseIsoDate(endInput.value) ||
      parseIsoDate(singleInput.value) ||
      getTodayUtc()
  };

  const monthOptions = getMonthOptions();

  function syncTriggerStates() {
    singleTrigger.dataset.panelOpen = String(state.isOpen && state.mode === "single");
    startTrigger.dataset.panelOpen = String(state.isOpen && state.mode === "range");
    endTrigger.dataset.panelOpen = String(state.isOpen && state.mode === "range");
    startTrigger.dataset.activeBoundary = String(
      state.isOpen && state.mode === "range" && state.activeBoundary === "start"
    );
    endTrigger.dataset.activeBoundary = String(
      state.isOpen && state.mode === "range" && state.activeBoundary === "end"
    );
  }

  function syncSingleState() {
    singleInput.value = formatIsoDate(state.singleDate);
    singleInput.dataset.hasValue = String(Boolean(singleInput.value));
    singleDisplay.textContent = formatDisplayDate(state.singleDate);
    singleTrigger.dataset.hasValue = String(Boolean(state.singleDate));
    singleDisplay.dataset.hasValue = String(Boolean(state.singleDate));
  }

  function syncRangeState() {
    startInput.value = formatIsoDate(state.rangeStart);
    endInput.value = formatIsoDate(state.rangeEnd);
    startDisplay.textContent = formatDisplayDate(state.rangeStart);
    endDisplay.textContent = formatDisplayDate(state.rangeEnd);
    startTrigger.dataset.hasValue = String(Boolean(state.rangeStart));
    endTrigger.dataset.hasValue = String(Boolean(state.rangeEnd));
    startDisplay.dataset.hasValue = String(Boolean(state.rangeStart));
    endDisplay.dataset.hasValue = String(Boolean(state.rangeEnd));
  }

  function emitChange() {
    const detail = {
      component: "calendar",
      mode: state.mode,
      values: {
        [config.name]: state.mode === "single" ? formatIsoDate(state.singleDate) : "",
        [config.startName]: state.mode === "range" ? formatIsoDate(state.rangeStart) : "",
        [config.endName]: state.mode === "range" ? formatIsoDate(state.rangeEnd) : ""
      }
    };

    element.dispatchEvent(
      new CustomEvent("component:change", {
        bubbles: true,
        detail
      })
    );
  }

  function syncPickerOptions() {
    const viewYear = state.viewDate.getUTCFullYear();
    const years = getYearOptions(viewYear);

    monthSelect.innerHTML = monthOptions
      .map(
        (option) =>
          `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`
      )
      .join("");
    yearSelect.innerHTML = years
      .map(
        (option) =>
          `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`
      )
      .join("");

    monthSelect.value = String(state.viewDate.getUTCMonth());
    yearSelect.value = String(viewYear);
  }

  function renderCalendar() {
    if (!state.isOpen) {
      panel.hidden = true;
      syncTriggerStates();
      return;
    }

    panel.hidden = false;
    syncTriggerStates();
    syncPickerOptions();

    const cells = getMonthCells(state.viewDate);

    grid.innerHTML = cells
      .map((date, index) => {
        if (!date) {
          return '<div class="ui-calendar__cell ui-calendar__cell--empty"></div>';
        }

        const isoDate = formatIsoDate(date);
        const isStart = isSameDay(date, state.rangeStart);
        const isEnd = isSameDay(date, state.rangeEnd);
        const isSingleSelected = state.mode === "single" && isSameDay(date, state.singleDate);
        const inRange = isBetween(date, state.rangeStart, state.rangeEnd);
        const classNames = [
          "ui-calendar__cell",
          state.mode === "range" && inRange ? "is-in-range" : "",
          state.mode === "range" && isStart ? "is-range-start" : "",
          state.mode === "range" && isEnd ? "is-range-end" : "",
          isSingleSelected ? "is-single-selected" : "",
          index % 7 === 0 ? "is-week-start" : "",
          index % 7 === 6 ? "is-week-end" : ""
        ]
          .filter(Boolean)
          .join(" ");

        return `
          <div class="${classNames}">
            <button
              class="ui-calendar__day"
              type="button"
              data-calendar-day="${escapeHtml(isoDate)}"
              aria-pressed="${
                state.mode === "single"
                  ? isSingleSelected
                    ? "true"
                    : "false"
                  : isStart || isEnd
                    ? "true"
                    : "false"
              }"
            >
              ${date.getUTCDate()}
            </button>
          </div>
        `;
      })
      .join("");
  }

  function syncMode(mode) {
    const isRange = mode === "range";

    state.mode = mode;
    singleWrap.classList.toggle("ui-calendar__slot--hidden", isRange);
    rangeWrap.classList.toggle("ui-calendar__range--hidden", !isRange);

    if (isRange && !state.rangeStart) {
      state.rangeStart = state.singleDate;
      setViewDate(state.rangeStart || state.rangeEnd || getTodayUtc());
    }

    if (!isRange) {
      if (!state.singleDate && state.rangeStart) {
        state.singleDate = state.rangeStart;
      }
      setViewDate(state.singleDate || getTodayUtc());
    }

    singleInput.name = isRange ? "" : config.name;
    singleInput.disabled = isRange;
    singleInput.required = config.required && !isRange;
    startInput.name = config.startName;
    startInput.disabled = !isRange;
    endInput.name = config.endName;
    endInput.disabled = !isRange;

    toggleOptions.forEach((option) => {
      const input = option.querySelector("input");
      option.classList.toggle("is-active", input?.value === mode);
    });

    syncSingleState();
    syncRangeState();
    renderCalendar();
    emitChange();
  }

  function setViewDate(date) {
    if (!date) {
      return;
    }

    state.viewDate = createUtcDate(date.getUTCFullYear(), date.getUTCMonth(), 1);
  }

  function handleRangeSelection(nextDate) {
    if (!state.rangeStart || state.rangeEnd || state.activeBoundary === "start") {
      state.rangeStart = nextDate;
      state.rangeEnd = null;
      state.activeBoundary = "end";
    } else {
      if (compareDates(nextDate, state.rangeStart) < 0) {
        state.rangeEnd = state.rangeStart;
        state.rangeStart = nextDate;
      } else {
        state.rangeEnd = nextDate;
      }

      state.activeBoundary = "start";
    }

    setViewDate(nextDate);
    syncRangeState();
    renderCalendar();
    emitChange();
  }

  function handleSingleSelection(nextDate) {
    state.singleDate = nextDate;
    setViewDate(nextDate);
    syncSingleState();
    renderCalendar();
    emitChange();
    closePanel();
  }

  function openPanel(boundary) {
    state.isOpen = true;

    if (boundary === "start" || boundary === "end") {
      state.activeBoundary = boundary;
    }

    if (state.mode === "single") {
      setViewDate(state.singleDate || getTodayUtc());
    } else {
      const focusDate =
        state.activeBoundary === "end"
          ? state.rangeEnd || state.rangeStart || getTodayUtc()
          : state.rangeStart || state.rangeEnd || getTodayUtc();
      setViewDate(focusDate);
    }

    renderCalendar();
  }

  function closePanel() {
    state.isOpen = false;
    panel.hidden = true;
    syncTriggerStates();
  }

  function togglePanel(boundary) {
    if (state.isOpen) {
      closePanel();
      return;
    }

    openPanel(boundary);
  }

  modeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        syncMode(getMode(input.value));
      }
    });
  });

  singleInput.addEventListener("input", () => {
    state.singleDate = parseIsoDate(singleInput.value);
    syncSingleState();
  });

  singleInput.addEventListener("change", () => {
    state.singleDate = parseIsoDate(singleInput.value);
    syncSingleState();
  });

  singleTrigger.addEventListener("click", () => {
    if (state.mode !== "single") {
      return;
    }

    togglePanel("single");
  });

  startTrigger.addEventListener("click", () => {
    if (state.mode !== "range") {
      return;
    }

    togglePanel("start");
  });

  endTrigger.addEventListener("click", () => {
    if (state.mode !== "range") {
      return;
    }

    togglePanel("end");
  });

  panel.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  grid.addEventListener("click", (event) => {
    event.stopPropagation();

    const dayButton = event.target.closest("[data-calendar-day]");

    if (!dayButton) {
      return;
    }

    const nextDate = parseIsoDate(dayButton.dataset.calendarDay);

    if (!nextDate) {
      return;
    }

    if (state.mode === "single") {
      handleSingleSelection(nextDate);
      return;
    }

    handleRangeSelection(nextDate);
  });

  prevButton.addEventListener("click", () => {
    state.viewDate = addMonths(state.viewDate, -1);
    renderCalendar();
  });

  nextButton.addEventListener("click", () => {
    state.viewDate = addMonths(state.viewDate, 1);
    renderCalendar();
  });

  monthSelect.addEventListener("change", () => {
    state.viewDate = createUtcDate(
      state.viewDate.getUTCFullYear(),
      Number(monthSelect.value),
      1
    );
    renderCalendar();
  });

  yearSelect.addEventListener("change", () => {
    state.viewDate = createUtcDate(
      Number(yearSelect.value),
      state.viewDate.getUTCMonth(),
      1
    );
    renderCalendar();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!element.contains(event.target)) {
      closePanel();
    }
  });

  element.resetComponent = () => {
    closePanel();
    state.activeBoundary = "start";
    state.mode = initialValues.mode;
    state.singleDate = parseIsoDate(initialValues.singleValue);
    state.rangeStart = parseIsoDate(initialValues.startValue);
    state.rangeEnd = parseIsoDate(initialValues.endValue);
    state.viewDate =
      state.rangeStart ||
      state.rangeEnd ||
      state.singleDate ||
      getTodayUtc();

    singleInput.value = initialValues.singleValue;
    startInput.value = initialValues.startValue;
    endInput.value = initialValues.endValue;

    modeInputs.forEach((input) => {
      input.checked = input.value === state.mode;
    });

    syncMode(state.mode);
  };

  syncMode(state.mode);
  emitChange();
  element.dataset.calendarInitialized = "true";
}

export function initCalendars(root = document) {
  root.querySelectorAll("[data-component='calendar']").forEach(initCalendar);
}

if (typeof document !== "undefined") {
  initCalendars();
}
