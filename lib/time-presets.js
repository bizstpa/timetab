export function tomorrowAt(hour) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return date.getTime();
}

export function tomorrowMorning() {
  return tomorrowAt(8);
}

export function tomorrowAfternoon() {
  return tomorrowAt(13);
}

export function tomorrowNight() {
  return tomorrowAt(19);
}

export function fromNow(ms) {
  return Date.now() + ms;
}

export const ALARM_MIN_DELAY_MS = 30000;

export function computeCustomWakeAt(mode, values = {}) {
  const now = Date.now();
  if (mode === "absolute") {
    if (!values.datetimeLocal) return { error: "Pick a time in the future." };
    const wakeAt = new Date(values.datetimeLocal).getTime();
    if (Number.isNaN(wakeAt)) return { error: "Pick a valid date and time." };
    if (wakeAt <= now) return { error: "Pick a time in the future." };
    return { wakeAt, shortDelay: wakeAt - now < ALARM_MIN_DELAY_MS };
  }
  const hours = Number(values.hours) || 0;
  const minutes = Number(values.minutes) || 0;
  if (hours <= 0 && minutes <= 0) return { error: "Enter a duration." };
  const wakeAt = now + hours * 3600000 + minutes * 60000;
  return { wakeAt, shortDelay: wakeAt - now < ALARM_MIN_DELAY_MS };
}

export const PRESETS = Object.freeze({
  "30min": { label: "30 minutes", getWakeAt: () => fromNow(1800000) },
  "1hour": { label: "1 hour", getWakeAt: () => fromNow(3600000) },
  "3hours": { label: "3 hours", getWakeAt: () => fromNow(10800000) },
  "6hours": { label: "6 hours", getWakeAt: () => fromNow(21600000) },
  "9hours": { label: "9 hours", getWakeAt: () => fromNow(32400000) },
  "12hours": { label: "12 hours", getWakeAt: () => fromNow(43200000) },
  tomorrowMorning: {
    label: "Tomorrow morning (8 AM)",
    getWakeAt: tomorrowMorning,
  },
  tomorrowAfternoon: {
    label: "Tomorrow afternoon (1 PM)",
    getWakeAt: tomorrowAfternoon,
  },
  tomorrowNight: { label: "Tomorrow night (7 PM)", getWakeAt: tomorrowNight },
});
