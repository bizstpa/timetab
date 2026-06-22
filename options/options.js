import { getSnoozedTabs } from "../lib/storage.js";
import {
  initTheme,
  initThemeControl,
  applyTheme,
  setControlActive,
  watchTheme,
} from "../lib/theme.js";

const themeReady = initTheme();

const list = document.getElementById("list");
const errorEl = document.getElementById("error");

function setError(message) {
  if (!message) {
    errorEl.hidden = true;
    errorEl.textContent = "";
    return;
  }
  errorEl.hidden = false;
  errorEl.textContent = message;
}

function formatWake(wakeAt) {
  return new Date(wakeAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildFavicon(favIconUrl) {
  if (!favIconUrl) {
    const span = document.createElement("span");
    span.className = "favicon placeholder";
    return span;
  }
  const img = document.createElement("img");
  img.className = "favicon";
  img.alt = "";
  img.src = favIconUrl;
  img.addEventListener("error", () => {
    const span = document.createElement("span");
    span.className = "favicon placeholder";
    img.replaceWith(span);
  });
  return img;
}

async function sendAction(message, row) {
  setError(null);
  for (const btn of row.querySelectorAll("button")) btn.disabled = true;
  try {
    const res = await chrome.runtime.sendMessage(message);
    if (!res?.ok) {
      setError("Action failed: " + (res?.error ?? "unknown error"));
      for (const btn of row.querySelectorAll("button")) btn.disabled = false;
    }
  } catch (error) {
    setError("Action failed: " + (error?.message ?? String(error)));
    for (const btn of row.querySelectorAll("button")) btn.disabled = false;
  }
}

function buildRow(tab) {
  const row = document.createElement("div");
  row.className = "row";

  row.appendChild(buildFavicon(tab.favIconUrl));

  const meta = document.createElement("div");
  meta.className = "meta";

  const title = document.createElement("div");
  title.className = "title";
  title.textContent = tab.title || tab.url || "(untitled)";
  title.title = tab.url || "";

  const wake = document.createElement("div");
  wake.className = "wake";
  wake.textContent = formatWake(tab.wakeAt);

  meta.append(title, wake);
  row.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "actions";

  const openBtn = document.createElement("button");
  openBtn.className = "open";
  openBtn.textContent = "Open";
  openBtn.addEventListener("click", () =>
    sendAction({ type: "wakeNow", id: tab.id, focus: true }, row)
  );

  const openBgBtn = document.createElement("button");
  openBgBtn.className = "open-bg";
  openBgBtn.textContent = "Open in background";
  openBgBtn.addEventListener("click", () =>
    sendAction({ type: "wakeNow", id: tab.id, focus: false }, row)
  );

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "cancel";
  cancelBtn.textContent = "Cancel";
  cancelBtn.addEventListener("click", () =>
    sendAction({ type: "cancel", id: tab.id }, row)
  );

  actions.append(openBtn, openBgBtn, cancelBtn);
  row.appendChild(actions);

  return row;
}

async function render() {
  try {
    const tabs = await getSnoozedTabs();
    tabs.sort((a, b) => a.wakeAt - b.wakeAt);

    list.replaceChildren();

    if (tabs.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent =
        "No snoozed tabs — snooze one from the toolbar to see it here.";
      list.appendChild(empty);
      return;
    }

    for (const tab of tabs) list.appendChild(buildRow(tab));
  } catch (error) {
    setError("Could not load snoozed tabs: " + (error?.message ?? String(error)));
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.snoozedTabs) render();
});

render();

const themeControl = document.getElementById("theme-control");
themeReady.then((current) => initThemeControl(themeControl, current));
watchTheme((theme) => {
  applyTheme(theme);
  setControlActive(themeControl, theme);
});
