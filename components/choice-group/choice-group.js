function getSelectedValue(element, controls, type) {
  if (type === "radio") {
    return controls.find((control) => control.checked)?.value || "";
  }

  return controls.filter((control) => control.checked).map((control) => control.value);
}

function initChoiceGroup(element) {
  if (element.dataset.choiceGroupInitialized === "true") {
    return;
  }

  const controls = Array.from(element.querySelectorAll(".ui-choice-group__control"));
  const type = element.dataset.type === "radio" ? "radio" : "checkbox";
  const initialValue = controls.filter((control) => control.checked).map((control) => control.value);

  if (!controls.length) {
    return;
  }

  function emitChange() {
    element.dispatchEvent(
      new CustomEvent("component:change", {
        bubbles: true,
        detail: {
          component: "choice-group",
          name: element.dataset.name || controls[0].name,
          value: getSelectedValue(element, controls, type)
        }
      })
    );
  }

  controls.forEach((control) => {
    control.addEventListener("change", emitChange);
  });

  element.resetComponent = () => {
    controls.forEach((control) => {
      control.checked = initialValue.includes(control.value);
    });
    emitChange();
  };

  element.dataset.choiceGroupInitialized = "true";
  emitChange();
}

export function initChoiceGroups(root = document) {
  root.querySelectorAll("[data-component='choice-group']").forEach(initChoiceGroup);
}

if (typeof document !== "undefined") {
  initChoiceGroups();
}
