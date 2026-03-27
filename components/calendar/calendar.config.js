function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

function requiredText(value, propName) {
  if (typeof value === "string" && value) {
    return value;
  }

  throw new Error(`calendar requires a non-empty "${propName}" prop`);
}

module.exports = ({ props }) => {
  const calendarProps = props && typeof props === "object" ? props : {};
  const label = textOr(calendarProps.label, "");
  const mode = calendarProps.mode === "range" ? "range" : "single";
  const isRange = mode === "range";

  return {
    id: textOr(calendarProps.id, ""),
    label,
    name: requiredText(calendarProps.name, "name"),
    singleLabel: textOr(calendarProps.singleLabel, ""),
    startLabel: textOr(calendarProps.startLabel, ""),
    endLabel: textOr(calendarProps.endLabel, ""),
    startName: isRange
      ? requiredText(calendarProps.startName, "startName")
      : textOr(calendarProps.startName, "startDate", true),
    endName: isRange
      ? requiredText(calendarProps.endName, "endName")
      : textOr(calendarProps.endName, "endDate", true),
    startValue: textOr(calendarProps.startValue, ""),
    endValue: textOr(calendarProps.endValue, ""),
    helper: textOr(calendarProps.helper, ""),
    mode,
    showLabel: calendarProps.showLabel !== false && Boolean(label),
    showInputLabels: calendarProps.showInputLabels !== false,
    allowModeSwitch: calendarProps.allowModeSwitch === true,
    required: calendarProps.required === true,
    standalone: calendarProps.standalone === true,
    isRange,
  };
};
