import {
  getSnoozedTabs,
  addSnoozedTab,
  removeSnoozedTab,
} from "../lib/storage.js";

console.log("TimeTab service worker loaded");

async function claimAndReopen(id, { focus = false, windowId } = {}) {
  const claimed = await removeSnoozedTab(id);
  if (!claimed) return false;

  const createOptions = { url: claimed.url, active: focus };
  if (windowId !== undefined) createOptions.windowId = windowId;

  try {
    await chrome.tabs.create(createOptions);
  } catch (createError) {
    await addSnoozedTab(claimed);
    throw createError;
  }

  await chrome.alarms.clear(id);
  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message?.type) {
        case "snooze": {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          const obj = {
            id: crypto.randomUUID(),
            url: tab.url,
            title: tab.title,
            favIconUrl: tab.favIconUrl,
            wakeAt: message.wakeAt,
          };
          await addSnoozedTab(obj);
          await chrome.alarms.create(obj.id, { when: message.wakeAt });
          chrome.tabs.remove(tab.id);
          sendResponse({ ok: true, snoozed: obj });
          break;
        }

        case "cancel": {
          await chrome.alarms.clear(message.id);
          await removeSnoozedTab(message.id);
          sendResponse({ ok: true });
          break;
        }

        case "wakeNow": {
          const reopened = await claimAndReopen(message.id, {
            focus: !!message.focus,
          });
          if (!reopened) {
            sendResponse({ ok: false, error: "not found" });
            break;
          }
          sendResponse({ ok: true });
          break;
        }

        default:
          sendResponse({ ok: false, error: "unknown message type" });
      }
    } catch (error) {
      sendResponse({ ok: false, error: error?.message ?? String(error) });
    }
  })();

  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    await claimAndReopen(alarm.name);
  } catch (error) {
    console.error("TimeTab alarm handling failed:", error);
  }
});

async function reopenOverdueInto(overdue, windowId) {
  for (const tab of overdue) {
    try {
      await claimAndReopen(tab.id, { windowId });
    } catch (error) {
      console.error("TimeTab overdue reopen failed:", error);
    }
  }
}

async function sweepOverdueIntoWindow(windowId) {
  const now = Date.now();
  const tabs = await getSnoozedTabs();
  const overdue = tabs.filter((tab) => tab.wakeAt <= now);
  if (overdue.length === 0) return;
  await reopenOverdueInto(overdue, windowId);
}

async function reopenOverdueTabs() {
  try {
    const windows = await chrome.windows.getAll();
    if (windows.length > 0) {
      await sweepOverdueIntoWindow(windows[0].id);
    }
  } catch (error) {
    console.error("TimeTab overdue sweep failed:", error);
  }
}

async function rearmFutureAlarms() {
  try {
    const now = Date.now();
    const tabs = await getSnoozedTabs();
    for (const tab of tabs) {
      if (tab.wakeAt > now) {
        const existing = await chrome.alarms.get(tab.id);
        if (!existing) await chrome.alarms.create(tab.id, { when: tab.wakeAt });
      }
    }
  } catch (error) {
    console.error("TimeTab alarm re-arm failed:", error);
  }
}

async function runStartupSweep() {
  await reopenOverdueTabs();
  await rearmFutureAlarms();
}

chrome.runtime.onStartup.addListener(runStartupSweep);
chrome.runtime.onInstalled.addListener(runStartupSweep);

chrome.windows.onCreated.addListener(async (win) => {
  try {
    await sweepOverdueIntoWindow(win.id);
  } catch (error) {
    console.error("TimeTab windows.onCreated handler failed:", error);
  }
});
