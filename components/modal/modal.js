function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function defaultButtons() {
  return [{ label: "Close", variant: "secondary", close: true }];
}

function parseJsonScript(element, selector, fallback = {}) {
  const script = element.querySelector(selector);

  if (!script) {
    return fallback;
  }

  try {
    return JSON.parse(script.textContent || "");
  } catch (_error) {
    return fallback;
  }
}

function normalizeButtons(buttons) {
  return Array.isArray(buttons) && buttons.length ? buttons : defaultButtons();
}

function textOr(value, fallback) {
  return typeof value === "string" && value ? value : fallback;
}

function normalizeModalConfig(config = {}) {
  return {
    title: textOr(config.title, "Modal"),
    message: typeof config.message === "string" ? config.message : "",
    bodyHtml: typeof config.bodyHtml === "string" ? config.bodyHtml : "",
    buttons: normalizeButtons(config.buttons)
  };
}

function createMessageConfig(options = {}) {
  // message
  return {
    title: textOr(options.title, "Message"),
    message: typeof options.message === "string" ? options.message : "",
    buttons: [
      {
        label: textOr(options.closeText, "Close"),
        variant: textOr(options.variant, "secondary"),
        close: true
      }
    ]
  };
}

function createConfirmationConfig(options = {}) {
  // confirmation
  return {
    title: textOr(options.title, "Confirmation"),
    message: typeof options.message === "string" ? options.message : "",
    buttons: [
      {
        label: textOr(options.cancelText, "Cancel"),
        variant: "secondary",
        close: true,
        onClick: options.onCancel
      },
      {
        label: textOr(options.confirmText, "OK"),
        variant: textOr(options.confirmVariant, "primary"),
        close: options.closeOnConfirm !== false,
        onClick: options.onConfirm
      }
    ]
  };
}

function createCustomConfig(options = {}) {
  // custom
  return {
    title: textOr(options.title, "Custom Modal"),
    bodyHtml: typeof options.bodyHtml === "string" ? options.bodyHtml : "",
    buttons: options.buttons
  };
}

// mode switcher
function createModalConfig(config = {}) {
  if (config.mode === "confirmation") {
    return createConfirmationConfig(config);
  }

  if (config.mode === "custom") {
    return createCustomConfig(config);
  }

  return createMessageConfig(config);
}

// body
function renderBody(body, config) {
  if (!body) {
    return;
  }

  if (config.bodyHtml) {
    body.innerHTML = config.bodyHtml;
    return;
  }

  if (config.message) {
    body.innerHTML = `<p class="ui-modal__message">${escapeHtml(config.message)}</p>`;
    return;
  }

  body.innerHTML = "";
}

// footer
function renderFooter(modal, footer, buttons) {
  if (!footer) {
    return;
  }

  footer.innerHTML = "";

  buttons.forEach((buttonConfig) => {
    const button = document.createElement("button");
    const variant =
      typeof buttonConfig.variant === "string" && buttonConfig.variant
        ? buttonConfig.variant
        : "secondary";

    button.type = "button";
    button.className = `ui-button ui-button--${variant} ui-button--md`;
    button.textContent =
      typeof buttonConfig.label === "string" && buttonConfig.label
        ? buttonConfig.label
        : "Close";

    if (buttonConfig.close !== false) {
      button.setAttribute("data-modal-close", "");
    }

    button.addEventListener("click", () => {
      if (typeof buttonConfig.onClick === "function") {
        buttonConfig.onClick(modal);
      }

      if (buttonConfig.close !== false && typeof modal.closeModal === "function") {
        modal.closeModal();
      }
    });

    footer.appendChild(button);
  });
}

// controller
function createModalController(modal) {
  const title = modal.querySelector("[data-modal-title]");
  const body = modal.querySelector("[data-modal-body]");
  const footer = modal.querySelector("[data-modal-footer]");
  const dialog = modal.querySelector(".ui-modal__dialog");
  let previousActiveElement = null;

  function open(config = {}) {
    const nextConfig = normalizeModalConfig(config);

    if (title) {
      title.textContent = nextConfig.title;
    }

    renderBody(body, nextConfig);
    renderFooter(modal, footer, nextConfig.buttons);

    previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    window.requestAnimationFrame(() => {
      const focusTarget =
        dialog?.querySelector(
          "[data-modal-close], button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        ) || dialog;
      focusTarget?.focus?.();
    });
  }

  function close() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    if (!document.querySelector(".ui-modal.is-open")) {
      document.body.classList.remove("modal-open");
    }

    previousActiveElement?.focus?.();
  }

  function openConfigured() {
    const config = parseJsonScript(modal, "[data-modal-config]", {});
    open(createModalConfig(config));
  }

  modal.openModal = open;
  modal.closeModal = close;
  modal.openConfiguredModal = openConfigured;

  modal.querySelectorAll("[data-modal-close]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      close();
    });
  });

  // close if backdrop clicked
  modal.addEventListener("click", (event) => {
    if (event.target === modal.querySelector(".ui-modal__backdrop")) {
      close();
    }
  });

  // close if esc
  modal.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
    }
  });
}

function resolveModal(target) {
  if (target instanceof HTMLElement && target.matches("[data-component='modal']")) {
    return target;
  }

  if (typeof target === "string") {
    return document.querySelector(target);
  }

  return document.querySelector("[data-component='modal']");
}

export function initModals(root = document) {
  root.querySelectorAll("[data-component='modal']").forEach((modal) => {
    if (modal.dataset.modalInitialized === "true") {
      return;
    }

    createModalController(modal);
    modal.dataset.modalInitialized = "true";
  });

  window.uiModal = {
    openConfigured(target) {
      const modal = resolveModal(target);
      modal?.openConfiguredModal?.();
    },

    message(options = {}) {
      const modal = resolveModal(options.target);
      modal?.openModal(createMessageConfig(options));
    },

    confirmation(options = {}) {
      const modal = resolveModal(options.target);
      modal?.openModal(createConfirmationConfig(options));
    },

    custom(options = {}) {
      const modal = resolveModal(options.target);
      modal?.openModal(createCustomConfig(options));
    }
  };
}