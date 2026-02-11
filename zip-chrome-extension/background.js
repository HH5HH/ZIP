"use strict";

const ZENDESK_ORIGIN = "https://adobeprimetime.zendesk.com";

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab?.url) return;
  try {
    const url = new URL(tab.url);
    if (url.origin === ZENDESK_ORIGIN) {
      await chrome.sidePanel.setOptions({ tabId, path: "sidepanel.html", enabled: true });
    } else {
      await chrome.sidePanel.setOptions({ tabId, enabled: false });
    }
  } catch (_) {}
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "ZIP_REQUEST") {
    const { requestId, tabId, inner } = msg;
    chrome.tabs.sendMessage(tabId, { type: "ZIP_FROM_BACKGROUND", requestId, inner }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ type: "ZIP_RESPONSE", requestId, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response || { type: "ZIP_RESPONSE", requestId, error: "No response" });
      }
    });
    return true;
  }
  if (msg.type === "ZIP_NAVIGATE") {
    const { tabId, url } = msg;
    chrome.tabs.update(tabId, { url }, () => sendResponse({ error: chrome.runtime.lastError?.message }));
    return true;
  }
  if (msg.type === "ZIP_GET_ACTIVE_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let tabId = tabs[0]?.id ?? null;
      if (!tabId) {
        chrome.tabs.query({ url: ZENDESK_ORIGIN + "/*" }, (zdTabs) => {
          tabId = zdTabs[0]?.id ?? null;
          sendResponse({ tabId });
        });
      } else {
        sendResponse({ tabId });
      }
    });
    return true;
  }
  if (msg.type === "ZIP_OPEN_LOGIN") {
    const url = msg.url || ZENDESK_ORIGIN + "/auth/v3/signin?return_to=" + encodeURIComponent(ZENDESK_ORIGIN + "/agent/dashboard");
    chrome.tabs.create({ url }, (tab) => {
      sendResponse({ tabId: tab?.id ?? null, error: chrome.runtime.lastError?.message });
    });
    return true;
  }
});
