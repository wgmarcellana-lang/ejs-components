function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

module.exports = ({ props }) => {
  const calendarProps = props && typeof props === "object" ? props : {};
  const label = textOr(calendarProps.label, "");
  const mode = calendarProps.mode === "range" ? "range" : "single";

  return {
    label,
    name: textOr(calendarProps.name, "date", true),
    singleLabel: textOr(calendarProps.singleLabel, ""),
    startLabel: textOr(calendarProps.startLabel, ""),
    endLabel: textOr(calendarProps.endLabel, ""),
    startName: textOr(calendarProps.startName, "startDate", true),
    endName: textOr(calendarProps.endName, "endDate", true),
    startValue: textOr(calendarProps.startValue, ""),
    endValue: textOr(calendarProps.endValue, ""),
    helper: textOr(calendarProps.helper, ""),
    mode,
    showLabel: calendarProps.showLabel !== false && Boolean(label),
    showInputLabels: calendarProps.showInputLabels !== false,
    allowModeSwitch: calendarProps.allowModeSwitch === true,
    required: calendarProps.required === true,
    standalone: calendarProps.standalone === true,
    isRange: mode === "range",
  };
};
