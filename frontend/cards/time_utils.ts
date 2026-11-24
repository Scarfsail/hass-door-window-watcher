/** Seconds elapsed since the given ISO datetime (negative when it is in the future). */
export function secondsSince(iso: string, now: number = Date.now()): number {
    return (now - new Date(iso).getTime()) / 1000;
}

/** Seconds left until the alert fires. */
export function secondsLeft(alertAt: string, now: number = Date.now()): number {
    return -secondsSince(alertAt, now);
}

/** Seconds the alert is overdue. */
export function secondsOver(alertAt: string, now: number = Date.now()): number {
    return secondsSince(alertAt, now);
}

/** Share of the allowed open time already used, 0..1. */
export function fractionElapsed(openedAt: string, alertAt: string, now: number = Date.now()): number {
    const total = secondsSince(openedAt, new Date(alertAt).getTime());
    if (total <= 0) return 1;
    return Math.min(1, Math.max(0, secondsSince(openedAt, now) / total));
}

/** True while the sensor has an alert due in the future. */
export function isCountingDown(sensor: { alert_at: string | null; alert_triggered: boolean }, now: number = Date.now()): boolean {
    return !sensor.alert_triggered && sensor.alert_at !== null && secondsLeft(sensor.alert_at, now) > 0;
}

export function formatMmSs(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return minutes + ":" + String(secs).padStart(2, "0");
}
