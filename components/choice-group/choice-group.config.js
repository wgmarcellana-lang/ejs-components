function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

function requiredText(value, propName) {
  if (typeof value === "string" && value) {
    return value;
  }

  throw new Error(`choice-group requires a non-empty "${propName}" prop`);
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

module.exports = ({ props }) => {
  const groupProps = props && typeof props === "object" ? props : {};
  const label = textOr(groupProps.label, "");
  const type = oneOf(groupProps.type, ["checkbox", "radio"], "checkbox");
  const options = Array.isArray(groupProps.options)
    ? groupProps.options.map((option, index) => ({
        id: textOr(option.id, ""),
        label: textOr(option.label, `Option ${index + 1}`, true),
        value: textOr(option.value, String(index + 1), true),
        disabled: option.disabled === true,
      }))
    : [];
  const selectedValues = Array.isArray(groupProps.selected)
    ? groupProps.selected.map((value) => String(value))
    : [];
  const radioValue = typeof groupProps.value === "string" ? groupProps.value : selectedValues[0] || "";

  return {
    id: textOr(groupProps.id, ""),
    label,
    name: requiredText(groupProps.name, "name"),
    type,
    helper: textOr(groupProps.helper, ""),
    options,
    selected: type === "checkbox"
      ? selectedValues
      : radioValue
        ? [radioValue]
        : [],
    orientation: oneOf(groupProps.orientation, ["vertical", "horizontal"], "vertical"),
    required: groupProps.required === true,
    disabled: groupProps.disabled === true,
    showLabel: groupProps.showLabel !== false && Boolean(label),
    standalone: groupProps.standalone === true,
  };
};
