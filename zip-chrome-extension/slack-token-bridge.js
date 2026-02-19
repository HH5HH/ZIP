(function () {
  "use strict";

  try {
    if (window.__ZIP_SLACK_TOKEN_BRIDGE__) return;
    window.__ZIP_SLACK_TOKEN_BRIDGE__ = true;

    var currentScript = document.currentScript;
    var dataset = currentScript && currentScript.dataset ? currentScript.dataset : {};
    var STORAGE_KEY = dataset.storageKey || "__zipSlackCapturedXoxcTokenV1";
    var EVENT_NAME = dataset.eventName || "zip-slack-token";
    var TYPE = dataset.messageType || "ZIP_SLACK_TOKEN_BRIDGE";
    var TOKEN_REGEX = /xoxc-[A-Za-z0-9-]+/;
    var seen = typeof WeakSet !== "undefined" ? new WeakSet() : null;

    function extract(value) {
      var text = String(value == null ? "" : value);
      var match = text.match(TOKEN_REGEX);
      return match ? match[0] : "";
    }

    function emit(token) {
      var normalized = extract(token);
      if (!normalized) return;
      try {
        window.localStorage.setItem(STORAGE_KEY, normalized);
      } catch (_) {}
      try {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { token: normalized } }));
      } catch (_) {}
      try {
        window.postMessage({ type: TYPE, token: normalized }, "*");
      } catch (_) {}
    }

    function inspect(value, depth) {
      if (depth > 4 || value == null) return;
      var direct = extract(value);
      if (direct) {
        emit(direct);
        return;
      }
      if (typeof FormData !== "undefined" && value instanceof FormData) {
        value.forEach(function (entry) {
          inspect(entry, depth + 1);
        });
        return;
      }
      if (typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams) {
        value.forEach(function (entry) {
          inspect(entry, depth + 1);
        });
        return;
      }
      if (Array.isArray(value)) {
        for (var i = 0; i < value.length && i < 80; i += 1) {
          inspect(value[i], depth + 1);
        }
        return;
      }
      if (typeof value === "object") {
        if (seen) {
          if (seen.has(value)) return;
          seen.add(value);
        }
        var keys = Object.keys(value);
        for (var j = 0; j < keys.length && j < 80; j += 1) {
          inspect(value[keys[j]], depth + 1);
        }
      }
    }

    var originalFetch = window.fetch;
    if (typeof originalFetch === "function") {
      window.fetch = function (input, init) {
        try {
          if (init && Object.prototype.hasOwnProperty.call(init, "body")) inspect(init.body, 0);
          if (input && typeof input === "object" && Object.prototype.hasOwnProperty.call(input, "body")) inspect(input.body, 0);
          inspect(input, 0);
        } catch (_) {}
        return originalFetch.apply(this, arguments);
      };
    }

    var xhrSend = window.XMLHttpRequest && window.XMLHttpRequest.prototype && window.XMLHttpRequest.prototype.send;
    if (typeof xhrSend === "function") {
      window.XMLHttpRequest.prototype.send = function (body) {
        try {
          inspect(body, 0);
        } catch (_) {}
        return xhrSend.apply(this, arguments);
      };
    }

    try {
      if (navigator && typeof navigator.sendBeacon === "function") {
        var beacon = navigator.sendBeacon.bind(navigator);
        navigator.sendBeacon = function (url, data) {
          try {
            inspect(url, 0);
            inspect(data, 0);
          } catch (_) {}
          return beacon(url, data);
        };
      }
    } catch (_) {}

    try {
      emit(window.localStorage.getItem(STORAGE_KEY));
    } catch (_) {}

    if (currentScript && currentScript.dataset) {
      currentScript.dataset.loaded = "true";
    }
  } catch (_) {}
})();
