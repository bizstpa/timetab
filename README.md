# TimeTab

TimeTab is a Chrome extension for snoozing tabs. Snoozing a tab closes it now
and reopens it automatically at a time you pick.

## Install (unpacked)

1. Open chrome://extensions.
2. Turn on Developer mode.
3. Click Load unpacked and select this folder.

## How it works

Each snooze is scheduled with chrome.alarms, and the snoozed tabs are stored in
chrome.storage.local. When an alarm fires, the tab is reopened and removed from
storage. If a snooze time passed while the browser was closed, the tab is
reopened the next time the browser starts.

## Permissions

- storage: keep the list of snoozed tabs and the theme setting.
- alarms: schedule the wake time for each snoozed tab.
- activeTab: read the current tab's URL, title, and icon when you snooze it.

## License

MIT. See LICENSE.
