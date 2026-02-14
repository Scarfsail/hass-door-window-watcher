export interface OpenSensorInfo {
    entity_id: string;
    opened_at: string; // ISO datetime string
    remaining_seconds: number;
    adjusted_seconds: number;
    alert_triggered: boolean;
}

export interface SensorInfo {
    entity_id: string;
    state: string;
    last_changed: string; // ISO datetime string
    opened_at: string | null;
    remaining_seconds: number;
    adjusted_seconds: number;
    alert_triggered: boolean;
    dismissed: boolean;
}