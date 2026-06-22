import { getTheme, setTheme } from "./storage.js";

export { getTheme, setTheme };

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light" || theme === "dark") {
    root.setAttribute("data-theme", theme);
  } else {
    root.removeAttribute("data-theme");
  }
}

export async function initTheme() {
  const theme = await getTheme();
  applyTheme(theme);
  return theme;
}

export async function setAndApplyTheme(theme) {
  applyTheme(theme);
  await setTheme(theme);
}

export function setControlActive(root, theme) {
  if (!root) return;
  for (const btn of root.querySelectorAll("[data-theme-choice]")) {
    btn.classList.toggle("active", btn.dataset.themeChoice === theme);
  }
}

export function initThemeControl(root, current) {
  if (!root) return;
  setControlActive(root, current);
  root.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-theme-choice]");
    if (!btn) return;
    const choice = btn.dataset.themeChoice;
    await setAndApplyTheme(choice);
    setControlActive(root, choice);
  });
}

export function watchTheme(onChange) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.theme) {
      onChange(changes.theme.newValue ?? "system");
    }
  });
}
