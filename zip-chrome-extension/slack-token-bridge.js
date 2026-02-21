(function () {
  "use strict";

  try {
    if (window.__ZIP_SLACK_TOKEN_BRIDGE__) return;
    window.__ZIP_SLACK_TOKEN_BRIDGE__ = true;

    var currentScript = document.currentScript;
    var dataset = currentScript && currentScript.dataset ? currentScript.dataset : {};
    var EVENT_NAME = dataset.eventName || "zip-slack-token";
    var TYPE = dataset.messageType || "ZIP_SLACK_TOKEN_BRIDGE";
    var TOKEN_REGEX = /xox[a-z]-[A-Za-z0-9-]+/i;
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

    function inspectHeaders(headers, depth) {
      if (!headers || depth > 4) return;
      try {
        if (typeof headers.forEach === "function") {
          headers.forEach(function (value, key) {
            inspect(key, depth + 1);
            inspect(value, depth + 1);
          });
          return;
        }
      } catch (_) {}
      if (Array.isArray(headers)) {
        for (var i = 0; i < headers.length && i < 80; i += 1) {
          var pair = headers[i];
          if (!Array.isArray(pair)) continue;
          inspect(pair[0], depth + 1);
          inspect(pair[1], depth + 1);
        }
        return;
      }
      if (typeof headers === "object") {
        var keys = Object.keys(headers);
        for (var j = 0; j < keys.length && j < 80; j += 1) {
          inspect(keys[j], depth + 1);
          inspect(headers[keys[j]], depth + 1);
        }
      }
    }

    var originalFetch = window.fetch;
    if (typeof originalFetch === "function") {
      window.fetch = function (input, init) {
        try {
          if (init && Object.prototype.hasOwnProperty.call(init, "body")) inspect(init.body, 0);
          if (init && Object.prototype.hasOwnProperty.call(init, "headers")) inspectHeaders(init.headers, 0);
          if (input && typeof input === "object" && Object.prototype.hasOwnProperty.call(input, "body")) inspect(input.body, 0);
          if (input && typeof input === "object" && Object.prototype.hasOwnProperty.call(input, "headers")) inspectHeaders(input.headers, 0);
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

    var xhrSetRequestHeader = window.XMLHttpRequest && window.XMLHttpRequest.prototype && window.XMLHttpRequest.prototype.setRequestHeader;
    if (typeof xhrSetRequestHeader === "function") {
      window.XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
        try {
          inspect(name, 0);
          inspect(value, 0);
        } catch (_) {}
        return xhrSetRequestHeader.apply(this, arguments);
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

    if (currentScript && currentScript.dataset) {
      currentScript.dataset.loaded = "true";
    }
  } catch (_) {}
})();
