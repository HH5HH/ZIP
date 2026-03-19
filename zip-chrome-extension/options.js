(function () {
  "use strict";

  const ZIP_CLEAR_KEY_CONFIRMATION_MESSAGE = "Clear ZIP.KEY and reset SLACKTIVATION now? Zendesk stays signed in, and Slack actions stay disabled until you load a new ZIP.KEY.";

  const els = {
    clearBtn: document.getElementById("zipClearBtn"),
    refreshBtn: document.getElementById("zipRefreshBtn"),
    status: document.getElementById("zipSettingsStatus")
  };

  function setStatus(message, options) {
    if (!els.status) return;
    const text = String(message || "").trim() || "Ready.";
    const opts = options && typeof options === "object" ? options : {};
    els.status.textContent = text;
    els.status.classList.toggle("is-error", !!opts.error);
    els.status.classList.toggle("is-ok", !!opts.ok && !opts.error);
  }

  function setClearButtonDisabled(disabled) {
    if (els.clearBtn) els.clearBtn.disabled = !!disabled;
  }

  function sendBackgroundRequest(type, payload) {
    const body = payload && typeof payload === "object" ? payload : {};
    return new Promise((resolve, reject) => {
      if (
        typeof chrome === "undefined"
        || !chrome.runtime
        || typeof chrome.runtime.sendMessage !== "function"
      ) {
        reject(new Error("Chrome runtime is unavailable."));
        return;
      }
      chrome.runtime.sendMessage({ type, ...body }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || "Extension request failed."));
          return;
        }
        resolve(response || {});
      });
    });
  }

  function describeMissingFields(missing) {
    const fields = Array.isArray(missing)
      ? missing.map((entry) => String(entry || "").trim()).filter(Boolean)
      : [];
    return fields.length ? fields.join(", ") : "unknown required fields";
  }

  async function refreshStatus() {
    setStatus("Checking ZIP.KEY SLACKTIVATION status…");
    setClearButtonDisabled(true);
    try {
      const status = await sendBackgroundRequest("ZIP_CHECK_SECRETS");
      if (status && status.ok) {
        setClearButtonDisabled(false);
        setStatus("ZIP.KEY is loaded. Return to ZipTool and use the avatar menu for Slacktivation and Slack login.", { ok: true });
        return;
      }
      if (status && status.loaded) {
        setClearButtonDisabled(false);
        setStatus(
          "Stored ZIP.KEY is incomplete or stale (" + describeMissingFields(status.missing) + "). Re-SLACKTIVATE from the ZipTool avatar menu.",
          { error: true }
        );
        return;
      }
      setStatus("ZIP.KEY is not loaded. Open ZipTool and use the avatar menu to SLACKTIVATE when needed.");
    } catch (err) {
      setStatus("Unable to read ZIP.KEY SLACKTIVATION status: " + (err && err.message ? err.message : "Unknown error"), { error: true });
    }
  }

  async function clearZipKey() {
    const shouldClear = (
      typeof window === "undefined"
      || typeof window.confirm !== "function"
      || window.confirm(ZIP_CLEAR_KEY_CONFIRMATION_MESSAGE)
    );
    if (!shouldClear) {
      setStatus("Clear ZIP.KEY canceled.");
      return;
    }
    setClearButtonDisabled(true);
    setStatus("Clearing ZIP.KEY SLACKTIVATION secrets…");
    let shouldRefresh = true;
    try {
      const response = await sendBackgroundRequest("ZIP_CLEAR_KEY");
      if (!response || response.ok !== true) {
        throw new Error(String(response && response.error || "Unable to clear ZIP.KEY."));
      }
      shouldRefresh = false;
      setStatus("ZIP.KEY cleared. Open ZipTool and use the avatar menu to SLACKTIVATE again.", { ok: true });
    } catch (err) {
      setStatus(String(err && err.message || "Unable to clear ZIP.KEY."), { error: true });
    } finally {
      if (shouldRefresh) {
        refreshStatus().catch(() => {});
      }
    }
  }

  if (els.clearBtn) {
    els.clearBtn.addEventListener("click", () => {
      clearZipKey().catch(() => {});
    });
  }
  if (els.refreshBtn) {
    els.refreshBtn.addEventListener("click", () => {
      refreshStatus().catch(() => {});
    });
  }

  refreshStatus().catch(() => {});
})();
