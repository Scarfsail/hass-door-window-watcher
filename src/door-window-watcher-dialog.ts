import { LitElement, css, html, nothing } from "lit-element"
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant } from "../hass-frontend/src/types";
import { SensorInfo } from "./models";
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration'
import { getDurationMmSs } from "./time_utils";
import { classMap } from "lit/directives/class-map.js";
import { keyed } from 'lit/directives/keyed.js';
import { getLocalizeFunction } from "./localize";

dayjs.extend(duration);

export interface DoorWindowWatcherDialogParams {
    entityId: string;
}

@customElement("door-window-watcher-dialog")
export class DoorWindowWatcherDialog extends LitElement {

    @property({ attribute: false }) public hass!: HomeAssistant;
    @state() private _params?: DoorWindowWatcherDialogParams;
    @state() private onlyOpen = true;
    @state() private monitoredEntityIds: string[] = [];

    public showDialog(params: DoorWindowWatcherDialogParams): void {
        this._params = params;
    }

    public closeDialog(): void {
        this._params = undefined;
        this.dispatchEvent(new CustomEvent("dialog-closed", {
            bubbles: true,
            composed: true,
            detail: { dialog: "door-window-watcher-dialog" },
        }));
    }

    private async toggleOnlyOpen() {
        this.onlyOpen = !this.onlyOpen;
        if (!this.onlyOpen && this.monitoredEntityIds.length === 0) {
            await this.fetchMonitoredEntityIds();
        }
    }

    private async fetchMonitoredEntityIds() {
        if (!this.hass) return;

        try {
            const response = await this.hass.callService(
                "door_window_watcher",
                "get_sensors",
                { only_open: false },
                undefined,
                false,
                true,
            );
            const allSensors = (response?.response?.sensors ?? []) as SensorInfo[];
            this.monitoredEntityIds = allSensors.map(s => s.entity_id);
        } catch (e) {
            console.error("Failed to fetch monitored entity IDs", e);
        }
    }

    private sortAllSensors(sensors: SensorInfo[]): SensorInfo[] {
        return [...sensors].sort((a, b) => {
            if (a.alert_triggered && !b.alert_triggered) return -1;
            if (!a.alert_triggered && b.alert_triggered) return 1;

            const aOpen = a.opened_at !== null;
            const bOpen = b.opened_at !== null;

            if (aOpen && bOpen) {
                if (a.remaining_seconds > 0 && b.remaining_seconds > 0)
                    return a.remaining_seconds - b.remaining_seconds;
                if (a.remaining_seconds > 0) return -1;
                if (b.remaining_seconds > 0) return 1;
            }

            if (aOpen && !bOpen) return -1;
            if (!aOpen && bOpen) return 1;

            return new Date(b.last_changed).getTime() - new Date(a.last_changed).getTime();
        });
    }

    static styles = css`
        .alert-active { color: var(--error-color) }
        .countdown-active { color: var(--warning-color) }
        .inactive { color: var(--primary-text-color) }
        .sensor-card {
            margin: 5px;
            padding: 5px;
            padding-left: 10px;
        }
        .sensor-title {
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        .sensor-title:hover {
            opacity: 0.8;
        }
        .elapsed-time {
            opacity: 0.6;
            margin-left: 10px;
            font-size: 12px;
        }
        .sensor-actions {
            display: flex;
            align-items: center;
        }
        .animate-fading {
            animation: fading 2s infinite;
        }
        @keyframes fading {
            0% { opacity: 0.3 }
            50% { opacity: 1 }
            100% { opacity: 0.3 }
        }
        .dialog-filter {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .sensor-state {
            opacity: 0.6;
            margin-left: 10px;
            font-size: 12px;
            font-weight: normal;
        }
    `

    private openMoreInfo(entity_id: string) {
        const event = new CustomEvent('hass-more-info', {
            bubbles: true,
            composed: true,
            detail: { entityId: entity_id },
        });
        this.dispatchEvent(event);
    }

    private getSensorsToDisplay(): SensorInfo[] {
        if (!this._params || !this.hass) return [];

        const entity = this.hass.states[this._params.entityId];
        if (!entity) return [];

        // Always get current open sensors from attributes
        const openSensors = (entity.attributes.open_sensors || []) as any[];
        const openSensorMap = new Map(
            openSensors.map(s => [s.entity_id, s])
        );

        if (this.onlyOpen) {
            // Show only open sensors
            return openSensors.map(s => ({
                entity_id: s.entity_id,
                state: this.hass.states[s.entity_id]?.state || "on",
                last_changed: this.hass.states[s.entity_id]?.last_changed || "",
                opened_at: s.opened_at,
                remaining_seconds: s.remaining_seconds,
                adjusted_seconds: s.adjusted_seconds,
                alert_triggered: s.alert_triggered,
                dismissed: false,
            }));
        }

        // Show all monitored sensors - get state from attributes and hass.states
        return this.monitoredEntityIds.map(entityId => {
            const entityState = this.hass.states[entityId];
            const openInfo = openSensorMap.get(entityId);
            
            return {
                entity_id: entityId,
                state: entityState?.state || "unknown",
                last_changed: entityState?.last_changed || "",
                opened_at: openInfo?.opened_at || null,
                remaining_seconds: openInfo?.remaining_seconds || 0,
                adjusted_seconds: openInfo?.adjusted_seconds || 0,
                alert_triggered: openInfo?.alert_triggered || false,
                dismissed: false,
            };
        }).filter(s => this.hass.states[s.entity_id]); // Only include entities that exist
    }

    render() {
        if (!this._params) return nothing;

        const localize = getLocalizeFunction(this.hass);
        const sortedSensors = this.sortAllSensors(this.getSensorsToDisplay());

        return html`
            <ha-dialog
                open
                @closed=${this.closeDialog}
                .heading=${localize('dialog.title')}
            >
                <div>
                    <div class="dialog-filter">
                        <label>${localize('dialog.only_open')}</label>
                        <ha-switch
                            .checked=${this.onlyOpen}
                            @change=${this.toggleOnlyOpen}
                        ></ha-switch>
                    </div>
                    ${sortedSensors.length === 0
                        ? html`<p style="opacity: 0.6; text-align: center; padding: 16px;">${localize('dialog.no_sensors')}</p>`
                        : sortedSensors.map(sensor => keyed(sensor.entity_id, this.renderDialogSensor(sensor)))
                    }
                </div>
            </ha-dialog>
        `;
    }

    private renderDialogSensor(sensor: SensorInfo) {
        const localize = getLocalizeFunction(this.hass);
        const haState = this.hass?.states[sensor.entity_id];
        const isOpen = sensor.opened_at !== null;
        const color_class = {
            "alert-active": sensor.alert_triggered,
            "countdown-active": !sensor.alert_triggered && sensor.remaining_seconds > 0,
            "inactive": !isOpen || (!sensor.alert_triggered && sensor.remaining_seconds <= 0),
        };

        if (!isOpen) {
            return html`
                <ha-card class="sensor-card">
                    <div class="sensor-title" @click=${() => this.openMoreInfo(sensor.entity_id)}>
                        ${haState?.attributes.friendly_name ?? sensor.entity_id}
                        <span class="sensor-state">
                            ${this.formatLastChanged(sensor.last_changed)}
                        </span>
                    </div>
                </ha-card>
            `;
        }

        return html`
            <ha-card class="sensor-card">
                <div class=${classMap({ ...color_class, "sensor-title": true })}
                     @click=${() => this.openMoreInfo(sensor.entity_id)}>
                    ${haState?.attributes.friendly_name ?? sensor.entity_id}
                    <span class=${classMap({ ...color_class, "elapsed-time": true })}>
                        <ha-icon style="--mdc-icon-size: 18px" icon="mdi:clock-outline"></ha-icon>
                        <span>${getDurationMmSs(sensor.opened_at)}</span>
                    </span>
                </div>
                <div class="sensor-actions">
                    <span class=${classMap({ ...color_class, "animate-fading": sensor.alert_triggered })}>
                        ${sensor.remaining_seconds > 0 || sensor.alert_triggered
                            ? html`<ha-icon icon="mdi:alert-circle"></ha-icon>`
                            : ""}
                        <span>${getDurationMmSs(dayjs().subtract(sensor.remaining_seconds, "second"))}</span>
                    </span>
                    <ha-button @click=${(e: Event) => { e.stopPropagation(); this.callService("adjust_remaining_seconds", { seconds: 300 }, sensor.entity_id); }}>${localize('dialog.add_5_min')}</ha-button>
                    ${sensor.remaining_seconds > 0
                        ? html`<ha-button @click=${(e: Event) => { e.stopPropagation(); this.callService("adjust_remaining_seconds", { seconds: -300 }, sensor.entity_id); }}>${localize('dialog.sub_5_min')}</ha-button>`
                        : ""}
                    ${sensor.remaining_seconds > 0 || sensor.alert_triggered
                        ? html`<ha-button @click=${(e: Event) => { e.stopPropagation(); this.callService("dismiss_alert", {}, sensor.entity_id); }}><ha-icon icon="mdi:close"></ha-icon></ha-button>`
                        : ""}
                </div>
            </ha-card>
        `
    }

    private formatLastChanged(isoDate: string): string {
        const localize = getLocalizeFunction(this.hass);
        const diff = dayjs().diff(dayjs(isoDate));
        const dur = dayjs.duration(diff);
        const hours = Math.floor(dur.asHours());
        const minutes = dur.minutes();

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return localize('time.days_ago', { days: days.toString() });
        }
        if (hours > 0) {
            return localize('time.hours_minutes_ago', { hours: hours.toString(), minutes: minutes.toString() });
        }
        return localize('time.minutes_ago', { minutes: minutes.toString() });
    }

    private async callService(service: string, data: any, entity_id: string) {
        if (!this.hass) return;
        data = { ...data, ...{ entity_id: entity_id } };
        await this.hass.callService("door_window_watcher", service, data);
    }
}
