function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

function requiredText(value, propName) {
  if (typeof value === "string" && value) {
    return value;
  }

  throw new Error(`textarea requires a non-empty "${propName}" prop`);
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

module.exports = ({ props }) => {
  const textareaProps = props && typeof props === "object" ? props : {};
  const label = textOr(textareaProps.label, "");

  return {
    label,
    name: requiredText(textareaProps.name, "name"),
    id: textOr(textareaProps.id, ""),
    placeholder: textOr(textareaProps.placeholder, ""),
    helper: textOr(textareaProps.helper, ""),
    value: textOr(textareaProps.value, ""),
    rows: Number.isInteger(textareaProps.rows) && textareaProps.rows > 0 ? textareaProps.rows : 4,
    resize: oneOf(textareaProps.resize, ["none", "vertical", "horizontal", "both"], "vertical"),
    required: textareaProps.required === true,
    disabled: textareaProps.disabled === true,
    readonly: textareaProps.readonly === true,
    maxLength: Number.isInteger(textareaProps.maxLength) && textareaProps.maxLength > 0 ? textareaProps.maxLength : 0,
    showLabel: textareaProps.showLabel !== false && Boolean(label),
    standalone: textareaProps.standalone === true,
  };
};
