(function () {
  "use strict";

  const ZIP_KEY_FILE_PREFIX = "ZIPKEY1:";
  const DEFAULT_SCOPE = "openid profile email";
  const DEFAULT_REDIRECT_PATH = "slack-user";
  const ZIP_CLEAR_KEY_CONFIRMATION_MESSAGE = "Clear ZIP.KEY and reset SLACKTIVATION now? Zendesk stays signed in, and Slack actions stay disabled until you load a new ZIP.KEY.";

  const els = {
    file: document.getElementById("zipKeyFile"),
    text: document.getElementById("zipKeyText"),
    importBtn: document.getElementById("zipImportBtn"),
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

  function sendBackgroundRequest(type, payload) {
    const body = payload && typeof payload === "object" ? payload : {};
    return new Promise((resolve, reject) => {
      if (!chrome || !chrome.runtime || typeof chrome.runtime.sendMessage !== "function") {
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

  function getZipKeyValueByPath(payload, pathExpr) {
    if (!payload || typeof payload !== "object") return undefined;
    const expr = String(pathExpr || "").trim();
    if (!expr) return undefined;
    if (Object.prototype.hasOwnProperty.call(payload, expr)) {
      return payload[expr];
    }
    const parts = expr.split(".").map((part) => part.trim()).filter(Boolean);
    if (!parts.length) return undefined;
    let node = payload;
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      if (!node || typeof node !== "object" || !Object.prototype.hasOwnProperty.call(node, part)) {
        return undefined;
      }
      node = node[part];
    }
    return node;
  }

  function readZipKeyValue(payload, candidates) {
    const list = Array.isArray(candidates) ? candidates : [];
    for (let i = 0; i < list.length; i += 1) {
      const value = getZipKeyValueByPath(payload, list[i]);
      if (value == null) continue;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed) return trimmed;
        continue;
      }
      if (typeof value === "number" && Number.isFinite(value)) return String(value);
      if (typeof value === "boolean") return value ? "true" : "false";
    }
    return "";
  }

  function readZipKeyListValue(payload, candidates) {
    const list = Array.isArray(candidates) ? candidates : [];
    for (let i = 0; i < list.length; i += 1) {
      const value = getZipKeyValueByPath(payload, list[i]);
      if (value == null) continue;
      if (Array.isArray(value)) return normalizeSlackUserIdCsv(value);
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed) return trimmed;
      }
    }
    return "";
  }

  function normalizeScope(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return DEFAULT_SCOPE;
    const parts = raw.split(/[\s,]+/).map((part) => part.trim()).filter(Boolean);
    const allowed = new Set(["openid", "profile", "email"]);
    const unique = [];
    for (let i = 0; i < parts.length; i += 1) {
      const scope = parts[i];
      if (!allowed.has(scope)) continue;
      if (!unique.includes(scope)) unique.push(scope);
    }
    if (!unique.includes("openid")) unique.unshift("openid");
    return unique.length ? unique.join(" ") : DEFAULT_SCOPE;
  }

  function normalizeRedirectPath(value) {
    const raw = String(value || "").trim().replace(/^\/+/, "");
    if (!raw) return DEFAULT_REDIRECT_PATH;
    const normalized = raw.replace(/[^a-zA-Z0-9._/-]/g, "");
    if (!normalized || normalized.includes("..")) return DEFAULT_REDIRECT_PATH;
    return normalized;
  }

  function normalizeRedirectUri(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    let parsed = null;
    try {
      parsed = new URL(raw);
    } catch (_) {
      parsed = null;
    }
    if (!parsed) return "";
    const host = String(parsed.hostname || "").toLowerCase();
    if (parsed.protocol !== "https:") return "";
    if (!host || !host.endsWith(".chromiumapp.org")) return "";
    const pathname = String(parsed.pathname || "").trim() || "/";
    return parsed.origin + pathname;
  }

  function normalizeSlackToken(value) {
    const token = String(value || "").trim();
    return /^(?:xoxe\.)?xox[a-z]-/i.test(token) ? token : "";
  }

  function normalizeChannelId(value) {
    const channelId = String(value || "").trim().toUpperCase();
    return /^[CGD][A-Z0-9]{8,}$/.test(channelId) ? channelId : "";
  }

  function normalizeChannelName(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const withoutPrefix = raw.replace(/^#+/, "").trim();
    if (!withoutPrefix) return "";
    return "#" + withoutPrefix;
  }

  function normalizeSlackUserIdList(value) {
    const out = [];
    const seen = new Set();
    const add = (candidate) => {
      const normalized = String(candidate || "").trim().toUpperCase();
      if (!/^[UW][A-Z0-9]{8,}$/.test(normalized) || seen.has(normalized)) return;
      seen.add(normalized);
      out.push(normalized);
    };
    if (Array.isArray(value)) {
      value.forEach(add);
      return out;
    }
    const raw = String(value || "").trim();
    if (!raw) return out;
    if (raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(add);
          return out;
        }
      } catch (_) {}
    }
    raw.split(/[\s,|]+/).forEach(add);
    return out;
  }

  function normalizeSlackUserIdCsv(value) {
    return normalizeSlackUserIdList(value).join(",");
  }

  function normalizeIsoDateTime(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const stamp = Date.parse(raw);
    return Number.isFinite(stamp) ? new Date(stamp).toISOString() : "";
  }

  function normalizeMention(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^<@[UW][A-Z0-9]{8,}>$/i.test(raw)) return raw;
    const plain = raw.startsWith("@") ? raw.slice(1).trim() : raw;
    if (!plain) return "";
    return "@" + plain;
  }

  function decodeZipKeyPayloadBase64(value) {
    const compact = String(value || "")
      .replace(/\s+/g, "")
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    if (!compact) return "";
    const remainder = compact.length % 4;
    const padded = remainder === 0 ? compact : (compact + "=".repeat(4 - remainder));
    const binary = atob(padded);
    try {
      const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch (_) {
      return binary;
    }
  }

  function parseKeyValueText(rawText) {
    const payload = {};
    const rows = String(rawText || "").split(/\r?\n/);
    for (let i = 0; i < rows.length; i += 1) {
      const line = rows[i];
      const match = line.match(/^\s*([^=:\s]+)\s*[:=]\s*(.+)\s*$/);
      if (!match) continue;
      payload[String(match[1] || "").trim()] = String(match[2] || "").trim();
    }
    return payload;
  }

  function parseZipKeyPayload(rawText) {
    const raw = String(rawText || "").trim();
    if (!raw) throw new Error("ZIP.KEY payload is empty.");

    let payloadText = raw;
    if (raw.slice(0, ZIP_KEY_FILE_PREFIX.length).toUpperCase() === ZIP_KEY_FILE_PREFIX) {
      payloadText = raw.slice(ZIP_KEY_FILE_PREFIX.length).trim();
    }

    if (!payloadText) throw new Error("ZIP.KEY payload is empty.");

    if (payloadText.startsWith("{")) {
      try {
        const parsed = JSON.parse(payloadText);
        if (parsed && typeof parsed === "object") return parsed;
      } catch (_) {}
      throw new Error("ZIP.KEY JSON payload could not be parsed.");
    }

    try {
      const decoded = decodeZipKeyPayloadBase64(payloadText).trim();
      if (decoded.startsWith("{")) {
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (_) {}

    const fromKeyValue = parseKeyValueText(payloadText);
    if (Object.keys(fromKeyValue).length) return fromKeyValue;

    throw new Error("Unknown ZIP.KEY format. Use ZIPKEY1 base64 JSON, raw JSON, or KEY=VALUE lines.");
  }

  function normalizeZipKeyConfig(parsedPayload) {
    const payload = parsedPayload && typeof parsedPayload === "object" ? parsedPayload : {};

    const clientId = readZipKeyValue(payload, [
      "services.slacktivation.client_id",
      "services.slacktivation.clientId",
      "services.slacktivation.oidc.client_id",
      "services.slacktivation.oidc.clientId",
      "slacktivation.client_id",
      "slacktivation.clientId",
      "slacktivation.oidc.client_id",
      "slacktivation.oidc.clientId",
      "client_id",
      "clientId"
    ]);
    const clientSecret = readZipKeyValue(payload, [
      "services.slacktivation.client_secret",
      "services.slacktivation.clientSecret",
      "services.slacktivation.oidc.client_secret",
      "services.slacktivation.oidc.clientSecret",
      "slacktivation.client_secret",
      "slacktivation.clientSecret",
      "slacktivation.oidc.client_secret",
      "slacktivation.oidc.clientSecret",
      "client_secret",
      "clientSecret"
    ]);

    if (!clientId || !clientSecret) {
      throw new Error("Parsed ZIP.KEY is missing required SLACKTIVATION values: client_id/client_secret.");
    }

    const scope = normalizeScope(readZipKeyValue(payload, [
      "services.slacktivation.scope",
      "services.slacktivation.oidc.scope",
      "slacktivation.scope",
      "slacktivation.oidc.scope",
      "scope"
    ]));
    const redirectPath = normalizeRedirectPath(readZipKeyValue(payload, [
      "services.slacktivation.redirect_path",
      "services.slacktivation.redirectPath",
      "services.slacktivation.oidc.redirect_path",
      "services.slacktivation.oidc.redirectPath",
      "slacktivation.redirect_path",
      "slacktivation.redirectPath",
      "slacktivation.oidc.redirect_path",
      "slacktivation.oidc.redirectPath",
      "redirectPath"
    ]));
    const redirectUri = normalizeRedirectUri(readZipKeyValue(payload, [
      "services.slacktivation.redirect_uri",
      "services.slacktivation.redirectUri",
      "services.slacktivation.oidc.redirect_uri",
      "services.slacktivation.oidc.redirectUri",
      "slacktivation.redirect_uri",
      "slacktivation.redirectUri",
      "slacktivation.oidc.redirect_uri",
      "slacktivation.oidc.redirectUri",
      "redirect_uri",
      "redirectUri"
    ]));
    const rawApiTokens = [
      readZipKeyValue(payload, [
        "services.slacktivation.bot_token",
        "services.slacktivation.botToken",
        "services.slacktivation.api.bot_token",
        "services.slacktivation.api.botToken",
        "slacktivation.bot_token",
        "slacktivation.botToken",
        "slacktivation.api.bot_token",
        "slacktivation.api.botToken",
        "api.bot_token",
        "api.botToken",
        "bot_token",
        "botToken"
      ]),
      readZipKeyValue(payload, [
        "services.slacktivation.user_token",
        "services.slacktivation.userToken",
        "services.slacktivation.api.user_token",
        "services.slacktivation.api.userToken",
        "slacktivation.user_token",
        "slacktivation.userToken",
        "slacktivation.api.user_token",
        "slacktivation.api.userToken",
        "api.user_token",
        "api.userToken",
        "oauth_token",
        "oauthToken",
        "userToken"
      ]),
      readZipKeyValue(payload, [
        "services.slacktivation.oauth_token",
        "services.slacktivation.oauthToken",
        "services.slacktivation.api.oauth_token",
        "services.slacktivation.api.oauthToken",
        "slacktivation.oauth_token",
        "slacktivation.oauthToken",
        "slacktivation.api.oauth_token",
        "slacktivation.api.oauthToken",
        "api.oauth_token",
        "api.oauthToken",
        "oauth_token",
        "oauthToken"
      ])
    ];
    const botCandidates = [];
    const userCandidates = [];
    rawApiTokens.forEach((entry) => {
      const token = normalizeSlackToken(entry);
      if (!token) return;
      if (/^xoxb-/i.test(token) || /^xoxe\.xoxb-/i.test(token)) {
        if (!botCandidates.includes(token)) botCandidates.push(token);
        return;
      }
      if (!userCandidates.includes(token)) {
        userCandidates.push(token);
      }
    });
    const botToken = botCandidates[0] || "";
    const userToken = userCandidates[0] || "";
    const oauthToken = userCandidates[0] || "";
    const singularityChannelId = normalizeChannelId(readZipKeyValue(payload, [
      "services.slacktivation.singularity_channel_id",
      "services.slacktivation.singularityChannelId",
      "slacktivation.singularity_channel_id",
      "slacktivation.singularityChannelId",
      "singularity.channelId",
      "channelId"
    ]));
    const singularityMention = normalizeMention(readZipKeyValue(payload, [
      "services.slacktivation.singularity_mention",
      "services.slacktivation.singularityMention",
      "slacktivation.singularity_mention",
      "slacktivation.singularityMention",
      "singularity.mention",
      "mention"
    ]));
    const passTransitionChannelId = normalizeChannelId(readZipKeyValue(payload, [
      "services.slacktivation.pass_transition.channel_id",
      "services.slacktivation.pass_transition.channelId",
      "services.slacktivation.pass_transition_channel_id",
      "services.slacktivation.passTransitionChannelId",
      "slacktivation.pass_transition.channel_id",
      "slacktivation.pass_transition.channelId",
      "slacktivation.pass_transition_channel_id",
      "slacktivation.passTransitionChannelId",
      "pass_transition.channel_id",
      "pass_transition.channelId",
      "pass_transition_channel_id",
      "passTransitionChannelId"
    ]));
    const passTransitionChannelName = normalizeChannelName(readZipKeyValue(payload, [
      "services.slacktivation.pass_transition.channel_name",
      "services.slacktivation.pass_transition.channelName",
      "services.slacktivation.pass_transition_channel_name",
      "services.slacktivation.passTransitionChannelName",
      "slacktivation.pass_transition.channel_name",
      "slacktivation.pass_transition.channelName",
      "slacktivation.pass_transition_channel_name",
      "slacktivation.passTransitionChannelName",
      "pass_transition.channel_name",
      "pass_transition.channelName",
      "pass_transition_channel_name",
      "passTransitionChannelName"
    ]));
    const passTransitionMemberIds = normalizeSlackUserIdList(readZipKeyListValue(payload, [
      "services.slacktivation.pass_transition.member_ids",
      "services.slacktivation.pass_transition.memberIds",
      "services.slacktivation.pass_transition.members",
      "services.slacktivation.pass_transition_member_ids",
      "services.slacktivation.passTransitionMemberIds",
      "slacktivation.pass_transition.member_ids",
      "slacktivation.pass_transition.memberIds",
      "slacktivation.pass_transition.members",
      "slacktivation.pass_transition_member_ids",
      "slacktivation.passTransitionMemberIds",
      "pass_transition.member_ids",
      "pass_transition.memberIds",
      "pass_transition.members",
      "pass_transition_member_ids",
      "passTransitionMemberIds"
    ]));
    const passTransitionMembersSyncedAt = normalizeIsoDateTime(readZipKeyValue(payload, [
      "services.slacktivation.pass_transition.members_synced_at",
      "services.slacktivation.pass_transition.membersSyncedAt",
      "services.slacktivation.pass_transition.last_synced_at",
      "services.slacktivation.pass_transition.lastSyncedAt",
      "services.slacktivation.pass_transition_members_synced_at",
      "services.slacktivation.passTransitionMembersSyncedAt",
      "slacktivation.pass_transition.members_synced_at",
      "slacktivation.pass_transition.membersSyncedAt",
      "slacktivation.pass_transition.last_synced_at",
      "slacktivation.pass_transition.lastSyncedAt",
      "slacktivation.pass_transition_members_synced_at",
      "slacktivation.passTransitionMembersSyncedAt",
      "pass_transition.members_synced_at",
      "pass_transition.membersSyncedAt",
      "pass_transition.last_synced_at",
      "pass_transition.lastSyncedAt",
      "pass_transition_members_synced_at",
      "passTransitionMembersSyncedAt"
    ]));
    const missingFields = [];
    if (!(userToken || oauthToken)) missingFields.push("user_token");
    if (!singularityChannelId) missingFields.push("singularity_channel_id");
    if (!singularityMention) missingFields.push("singularity_mention");
    if (missingFields.length) {
      throw new Error("Parsed ZIP.KEY is missing required SLACKTIVATION values: " + missingFields.join("/") + ".");
    }

    return {
      oidc: {
        clientId,
        clientSecret,
        scope,
        redirectPath,
        redirectUri
      },
      api: {
        botToken,
        userToken,
        oauthToken
      },
      singularity: {
        channelId: singularityChannelId,
        mention: singularityMention
      },
      passTransition: {
        channelId: passTransitionChannelId,
        channelName: passTransitionChannelName,
        memberIds: passTransitionMemberIds,
        membersSyncedAt: passTransitionMembersSyncedAt
      },
      meta: {
        keyVersion: String(readZipKeyValue(payload, ["keyVersion", "version", "meta.version"]) || "").trim(),
        services: ["slacktivation"],
        source: "options",
        importedAt: new Date().toISOString()
      }
    };
  }

  async function readFileInputText() {
    const fileInput = els.file;
    const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    if (!file || typeof file.text !== "function") return "";
    return String(await file.text() || "");
  }

  async function getImportPayloadText() {
    const pasted = String(els.text && els.text.value || "").trim();
    if (pasted) return pasted;
    const fileText = String(await readFileInputText() || "").trim();
    if (fileText) return fileText;
    return "";
  }

  async function refreshStatus() {
    setStatus("Checking ZIP.KEY SLACKTIVATION status…");
    try {
      const status = await sendBackgroundRequest("ZIP_CHECK_SECRETS");
      if (status && status.ok) {
        setStatus("ZIP.KEY is loaded and SLACKTIVATION secrets are available.", { ok: true });
      } else {
        setStatus("ZIP.KEY is not loaded. Import a ZIP.KEY file to continue.", { error: true });
      }
    } catch (err) {
      setStatus("Unable to read ZIP.KEY SLACKTIVATION status: " + (err && err.message ? err.message : "Unknown error"), { error: true });
    }
  }

  async function importZipKey() {
    if (els.importBtn) els.importBtn.disabled = true;
    setStatus("SLACKTIVATING ZIP.KEY…");
    try {
      const payloadText = await getImportPayloadText();
      if (!payloadText) {
        throw new Error("Please upload ZIP.KEY or paste its contents.");
      }
      const parsed = parseZipKeyPayload(payloadText);
      const config = normalizeZipKeyConfig(parsed);
      const response = await sendBackgroundRequest("ZIP_IMPORT_KEY_PAYLOAD", { config });
      if (!response || response.ok !== true) {
        throw new Error(String(response && response.error || "ZIP.KEY import failed."));
      }
      if (els.text) els.text.value = "";
      if (els.file) els.file.value = "";
      setStatus("ZIP.KEY imported successfully. SLACKTIVATION is ready.", { ok: true });
    } catch (err) {
      setStatus(String(err && err.message || "Unable to import ZIP.KEY."), { error: true });
    } finally {
      if (els.importBtn) els.importBtn.disabled = false;
      refreshStatus().catch(() => {});
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
    if (els.clearBtn) els.clearBtn.disabled = true;
    setStatus("Clearing ZIP.KEY SLACKTIVATION secrets…");
    try {
      const response = await sendBackgroundRequest("ZIP_CLEAR_KEY");
      if (!response || response.ok !== true) {
        throw new Error(String(response && response.error || "Unable to clear ZIP.KEY."));
      }
      setStatus("ZIP.KEY SLACKTIVATION secrets cleared.", { ok: true });
    } catch (err) {
      setStatus(String(err && err.message || "Unable to clear ZIP.KEY."), { error: true });
    } finally {
      if (els.clearBtn) els.clearBtn.disabled = false;
      refreshStatus().catch(() => {});
    }
  }

  if (els.importBtn) {
    els.importBtn.addEventListener("click", () => {
      importZipKey().catch(() => {});
    });
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
