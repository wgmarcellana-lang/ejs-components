import { initTextInputs } from "../text-input/text-input.js";
import { initTextareas } from "../textarea/textarea.js";
import { initChoiceGroups } from "../choice-group/choice-group.js";

function getEnabledTriggers(element) {
  return Array.from(element.querySelectorAll("[data-tab-trigger]")).filter((trigger) => !trigger.disabled);
}

function initTabsComponent(element) {
  if (element.dataset.tabsInitialized === "true") {
    return;
  }

  const triggers = Array.from(element.querySelectorAll("[data-tab-trigger]"));
  const panels = Array.from(element.querySelectorAll("[data-tab-panel]"));
  let activeId = element.dataset.defaultActive || triggers.find((trigger) => !trigger.disabled)?.dataset.tabId || "";

  if (!triggers.length || !panels.length) {
    return;
  }

  function syncUi(nextId, shouldFocus = false) {
    activeId = nextId;

    triggers.forEach((trigger) => {
      const isActive = trigger.dataset.tabId === activeId;
      trigger.setAttribute("aria-selected", String(isActive));
      trigger.tabIndex = isActive ? 0 : -1;

      if (isActive && shouldFocus) {
        trigger.focus();
      }
    });

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.tabId !== activeId;

      if (!panel.hidden) {
        initTextInputs(panel);
        initTextareas(panel);
        initChoiceGroups(panel);
      }
    });

    element.dispatchEvent(
      new CustomEvent("component:change", {
        bubbles: true,
        detail: {
          component: "tabs",
          name: element.id || "",
          value: activeId
        }
      })
    );
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      if (trigger.disabled) {
        return;
      }

      syncUi(trigger.dataset.tabId || "", false);
    });

    trigger.addEventListener("keydown", (event) => {
      const enabledTriggers = getEnabledTriggers(element);
      const currentIndex = enabledTriggers.indexOf(trigger);

      if (!enabledTriggers.length || currentIndex === -1) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        const nextTrigger = enabledTriggers[(currentIndex + 1) % enabledTriggers.length];
        syncUi(nextTrigger.dataset.tabId || "", true);
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        const nextTrigger = enabledTriggers[(currentIndex - 1 + enabledTriggers.length) % enabledTriggers.length];
        syncUi(nextTrigger.dataset.tabId || "", true);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        syncUi(enabledTriggers[0].dataset.tabId || "", true);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        syncUi(enabledTriggers[enabledTriggers.length - 1].dataset.tabId || "", true);
      }
    });
  });

  element.dataset.tabsInitialized = "true";
  syncUi(activeId, false);
}

export function initTabs(root = document) {
  root.querySelectorAll("[data-component='tabs']").forEach(initTabsComponent);
}

if (typeof document !== "undefined") {
  initTabs();
}
