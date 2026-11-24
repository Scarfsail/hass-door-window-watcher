export interface OpenSensorInfo {
    entity_id: string;
    opened_at: string; // ISO datetime string
    alert_at: string | null; // ISO datetime string, null when there is no limit or the alert was dismissed
    adjusted_seconds: number;
    alert_triggered: boolean;
    dismissed: boolean;
}

export interface SensorInfo {
    entity_id: string;
    state: string;
    last_changed: string; // ISO datetime string
    opened_at: string | null;
    alert_at: string | null;
    adjusted_seconds: number;
    alert_triggered: boolean;
    dismissed: boolean;
}
