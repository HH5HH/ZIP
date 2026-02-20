/* Shared install-hub copy helper for ZIP landing pages. */
(function () {
  var EXTENSIONS_URL_DEFAULT = "chrome://extensions";
  var btn = document.getElementById("open-extensions-btn");
  var feedback = document.getElementById("extensions-feedback");
  var hint = document.getElementById("extensions-hint");

  if (!btn) return;

  function getExtensionsUrl() {
    var fromButton = btn.getAttribute("data-copy-url");
    if (fromButton && fromButton.trim()) return fromButton.trim();
    var fromBody = document.body && document.body.getAttribute("data-extensions-url");
    if (fromBody && fromBody.trim()) return fromBody.trim();
    return EXTENSIONS_URL_DEFAULT;
  }

  function showFeedback(message) {
    if (feedback) feedback.textContent = message;
    if (hint) hint.classList.add("visible");
    if (feedback && message) {
      setTimeout(function () {
        feedback.textContent = "";
      }, 4000);
    }
  }

  function copyWithTextarea(value) {
    var textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  function copyExtensionsUrl() {
    var extensionsUrl = getExtensionsUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(extensionsUrl).then(function () {
        showFeedback("Copied! ");
      }).catch(function () {
        try {
          copyWithTextarea(extensionsUrl);
          showFeedback("Copied! ");
        } catch (_error) {
          showFeedback("Copy this: " + extensionsUrl);
        }
      });
      return;
    }
    try {
      copyWithTextarea(extensionsUrl);
      showFeedback("Copied! ");
    } catch (_error) {
      showFeedback("Copy this: " + extensionsUrl);
    }
  }

  btn.addEventListener("click", copyExtensionsUrl);
})();
