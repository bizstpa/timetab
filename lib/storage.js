const STORAGE_KEY = "snoozedTabs";

let mutationChain = Promise.resolve();
function withLock(operation) {
  const result = mutationChain.then(operation, operation);
  mutationChain = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

export async function getSnoozedTabs() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] ?? [];
}

async function saveSnoozedTabs(tabs) {
  await chrome.storage.local.set({ [STORAGE_KEY]: tabs });
}

export function addSnoozedTab(tabObj) {
  return withLock(async () => {
    const tabs = await getSnoozedTabs();
    tabs.push(tabObj);
    await saveSnoozedTabs(tabs);
    return tabObj;
  });
}

export function removeSnoozedTab(id) {
  return withLock(async () => {
    const tabs = await getSnoozedTabs();
    const index = tabs.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const [removed] = tabs.splice(index, 1);
    await saveSnoozedTabs(tabs);
    return removed;
  });
}

export async function getSnoozedTab(id) {
  const tabs = await getSnoozedTabs();
  return tabs.find((t) => t.id === id) ?? null;
}

const THEME_KEY = "theme";

export async function getTheme() {
  const result = await chrome.storage.local.get(THEME_KEY);
  return result[THEME_KEY] ?? "system";
}

export async function setTheme(theme) {
  await chrome.storage.local.set({ [THEME_KEY]: theme });
}
