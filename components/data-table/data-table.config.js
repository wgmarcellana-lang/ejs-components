function textOr(value, fallback, requireValue = false) {
  return typeof value === "string" && (!requireValue || value) ? value : fallback;
}

function requiredText(value, propName) {
  if (typeof value === "string" && value) {
    return value;
  }

  throw new Error(`data-table requires a non-empty "${propName}" prop`);
}

module.exports = ({ props }) => {
  const tableProps = props && typeof props === "object" ? props : {};

  const columns = Array.isArray(tableProps.columns) ? tableProps.columns : [];
  const rows = Array.isArray(tableProps.rows) ? tableProps.rows : [];

  const normalizedColumns = columns.map((col) => ({
    key: requiredText(col.key, "columns[].key"),
    label: textOr(col.label, col.key, true),
    sortable: col.sortable !== false,
    type: ["text", "badge", "action"].includes(col.type) ? col.type : "text",
    badgeMap: col.type === "badge" && col.badgeMap && typeof col.badgeMap === "object"
      ? col.badgeMap
      : {},
    action: col.type === "action" && col.action && typeof col.action === "object"
      ? {
          label: textOr(col.action.label, "View", true),
          event: textOr(col.action.event, "datatable:action", true),
        }
      : { label: "View", event: "datatable:action" },
  }));

  const pageSize = typeof tableProps.pageSize === "number" && tableProps.pageSize > 0
    ? tableProps.pageSize
    : 10;

  const pageSizeOptions = Array.isArray(tableProps.pageSizeOptions)
    ? tableProps.pageSizeOptions.filter((n) => typeof n === "number" && n > 0)
    : [5, 10, 25, 50];

  return {
    id: requiredText(tableProps.id, "id"),
    columns: normalizedColumns,
    rows,
    pageSize,
    pageSizeOptions,
    searchable: tableProps.searchable !== false,
    searchPlaceholder: textOr(tableProps.searchPlaceholder, "Search records…"),
    selectable: tableProps.selectable === true,
    exportable: tableProps.exportable !== false,
    exportLabel: textOr(tableProps.exportLabel, "Export"),
    emptyText: textOr(tableProps.emptyText, "No records found."),
    standalone: tableProps.standalone === true,
    caption: textOr(tableProps.caption, ""),
  };
};
