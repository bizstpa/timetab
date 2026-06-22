import { PRESETS, computeCustomWakeAt } from "../lib/time-presets.js";
import {
  initTheme,
  initThemeControl,
  applyTheme,
  setControlActive,
  watchTheme,
} from "../lib/theme.js";

const themeReady = initTheme();

document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("status");
  const fixedContainer = document.getElementById("snooze-for");
  const untilContainer = document.getElementById("snooze-until");

  for (const [key, preset] of Object.entries(PRESETS)) {
    const button = document.createElement("button");
    button.dataset.key = key;
    button.textContent = preset.label;
    const target = key.startsWith("tomorrow") ? untilContainer : fixedContainer;
    target.appendChild(button);
  }

  function setStatus(text, isError = false) {
    status.textContent = text;
    status.classList.toggle("error", isError);
  }

  async function sendSnooze(wakeAt, note = "") {
    try {
      const res = await chrome.runtime.sendMessage({ type: "snooze", wakeAt });
      if (res.ok) {
        const when = new Date(wakeAt).toLocaleString(undefined, {
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
        });
        setStatus("Snoozed until " + when + note);
        setTimeout(() => window.close(), 700);
      } else {
        setStatus("Error: " + res.error, true);
      }
    } catch (error) {
      setStatus("Error: " + (error?.message ?? String(error)), true);
    }
  }

  let customMode = "absolute";
  const datetimeInput = document.getElementById("custom-datetime");
  const hoursInput = document.getElementById("custom-hours");
  const minutesInput = document.getElementById("custom-minutes");
  const absoluteInputs = document.getElementById("custom-absolute");
  const relativeInputs = document.getElementById("custom-relative");
  const modeToggle = document.getElementById("mode-toggle");

  const pad = (n) => String(n).padStart(2, "0");
  const nowLocal = new Date();
  datetimeInput.min = `${nowLocal.getFullYear()}-${pad(nowLocal.getMonth() + 1)}-${pad(
    nowLocal.getDate()
  )}T${pad(nowLocal.getHours())}:${pad(nowLocal.getMinutes())}`;

  function setMode(mode) {
    customMode = mode;
    absoluteInputs.hidden = mode !== "absolute";
    relativeInputs.hidden = mode !== "relative";
    for (const btn of modeToggle.querySelectorAll("[data-mode]")) {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    }
  }

  function submitCustom() {
    const result = computeCustomWakeAt(customMode, {
      datetimeLocal: datetimeInput.value,
      hours: hoursInput.value,
      minutes: minutesInput.value,
    });
    if (result.error) {
      setStatus(result.error, true);
      return;
    }
    const note = result.shortDelay
      ? " (very short — may fire slightly late)"
      : "";
    sendSnooze(result.wakeAt, note);
  }

  document.addEventListener("click", (event) => {
    const presetBtn = event.target.closest("button[data-key]");
    if (presetBtn) {
      sendSnooze(PRESETS[presetBtn.dataset.key].getWakeAt());
      return;
    }
    const modeBtn = event.target.closest("button[data-mode]");
    if (modeBtn) {
      setMode(modeBtn.dataset.mode);
      return;
    }
  });

  document.getElementById("custom-snooze").addEventListener("click", submitCustom);

  document.getElementById("manage").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  const themeControl = document.getElementById("theme-control");
  themeReady.then((current) => initThemeControl(themeControl, current));
  watchTheme((theme) => {
    applyTheme(theme);
    setControlActive(themeControl, theme);
  });
});
