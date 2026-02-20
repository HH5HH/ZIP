(function () {
  "use strict";

  if (window.__ZIP_LOGIN_FALLBACK_LOADED__) return;
  window.__ZIP_LOGIN_FALLBACK_LOADED__ = true;

  const ZENDESK_BASE_URL = "https://adobeprimetime.zendesk.com";
  const ZENDESK_TAB_QUERY = "*://adobeprimetime.zendesk.com/*";

  function queryZendeskTabs() {
    return new Promise((resolve) => {
      try {
        if (!chrome || !chrome.tabs || typeof chrome.tabs.query !== "function") {
          resolve([]);
          return;
        }
        chrome.tabs.query({ url: ZENDESK_TAB_QUERY }, (tabs) => {
          void chrome.runtime.lastError;
          resolve(Array.isArray(tabs) ? tabs : []);
        });
      } catch (_) {
        resolve([]);
      }
    });
  }

function focusZendeskTab(tab) {
  return new Promise((resolve) => {
    if (!tab || tab.id == null) {
      resolve({ ok: false });
      return;
    }
    try {
      chrome.tabs.update(tab.id, { active: true, url: ZENDESK_BASE_URL }, () => {
        void chrome.runtime.lastError;
        if (tab.windowId != null && chrome.windows && typeof chrome.windows.update === "function") {
          chrome.windows.update(tab.windowId, { focused: true }, () => {
              void chrome.runtime.lastError;
              resolve({ ok: true, tabId: tab.id, openedNewTab: false });
            });
            return;
          }
          resolve({ ok: true, tabId: tab.id, openedNewTab: false });
        });
      } catch (_) {
        resolve({ ok: false });
      }
    });
  }

  function openZendeskTab() {
    return new Promise((resolve) => {
      try {
        if (!chrome || !chrome.tabs || typeof chrome.tabs.create !== "function") {
          resolve({ ok: false, error: "tabs API unavailable" });
          return;
        }
        chrome.tabs.create({ url: ZENDESK_BASE_URL }, (tab) => {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message || "Unable to open Zendesk tab." });
            return;
          }
          resolve({
            ok: true,
            tabId: tab && tab.id != null ? tab.id : null,
            openedNewTab: true
          });
        });
      } catch (err) {
        resolve({ ok: false, error: err && err.message ? err.message : "Unable to open Zendesk tab." });
      }
    });
  }

  async function openZendeskMainTab() {
    const tabs = await queryZendeskTabs();
    if (tabs && tabs.length > 0) {
      return focusZendeskTab(tabs[0]);
    }
    return openZendeskTab();
  }

  window.ZIP_LOGIN_FALLBACK_OPEN = openZendeskMainTab;

  function installFallbackClickHandler() {
    const button = document.getElementById("zipLoginBtn");
    if (!button || button.__zipLoginFallbackBound) return;
    button.__zipLoginFallbackBound = true;
    button.addEventListener("click", () => {
      // If sidepanel.js login handler is active, let it drive behavior first.
      if (window.__ZIP_LOGIN_HANDLER_READY__) return;
      openZendeskMainTab().catch(() => {});
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installFallbackClickHandler, { once: true });
  } else {
    installFallbackClickHandler();
  }
})();
