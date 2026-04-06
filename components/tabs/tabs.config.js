function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

function requiredText(value, propName) {
  if (typeof value === "string" && value) {
    return value;
  }

  throw new Error(`tabs requires a non-empty "${propName}" prop`);
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

module.exports = ({ props }) => {
  const tabsProps = props && typeof props === "object" ? props : {};
  const label = textOr(tabsProps.label, "");
  const tabs = Array.isArray(tabsProps.tabs)
    ? tabsProps.tabs.map((tab, index) => ({
        id: requiredText(tab.id, `tabs[${index}].id`),
        label: textOr(tab.label, tab.id, true),
        contentHtml: typeof tab.contentHtml === "string" ? tab.contentHtml : "",
        disabled: tab.disabled === true,
      }))
    : [];
  const firstEnabled = tabs.find((tab) => !tab.disabled);
  const defaultActive = tabs.find((tab) => tab.id === tabsProps.defaultActive && !tab.disabled)?.id || firstEnabled?.id || "";

  return {
    id: requiredText(tabsProps.id, "id"),
    label,
    tabs,
    defaultActive,
    variant: oneOf(tabsProps.variant, ["underline", "pill"], "underline"),
    showLabel: tabsProps.showLabel !== false && Boolean(label),
    standalone: tabsProps.standalone === true,
  };
};
