import { LitElement, css, html, nothing } from "lit-element"
import { customElement, state } from "lit/decorators.js";
import type { HomeAssistant } from "../hass-frontend/src/types";
import { SensorInfo } from "./models";
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration'
import { getDurationMmSs } from "./time_utils";
import { classMap } from "lit/directives/class-map.js";
import { keyed } from 'lit/directives/keyed.js';

dayjs.extend(duration);

export interface DoorWindowWatcherDialogParams {
    hass: HomeAssistant;
}

@customElement("door-window-watcher-dialog")
export class DoorWindowWatcherDialog extends LitElement {

    @state() private _hass?: HomeAssistant;
    @state() private _params?: DoorWindowWatcherDialogParams;
    @state() private onlyOpen = true;
    @state() private allSensors: SensorInfo[] = [];

    public showDialog(params: DoorWindowWatcherDialogParams): void {
        this._params = params;
        this._hass = params.hass;
        this.fetchSensors();
    }

    public closeDialog(): void {
        this._params = undefined;
    }

    private async fetchSensors() {
        if (!this._hass) return;

        try {
            const response = await this._hass.callService(
                "door_window_watcher",
                "get_sensors",
                { only_open: this.onlyOpen },
                undefined,
                false,
                true,
            );
            this.allSensors = response?.response?.sensors ?? [];
        } catch (e) {
            console.error("Failed to fetch sensors", e);
        }
    }

    private async toggleOnlyOpen() {
        this.onlyOpen = !this.onlyOpen;
        await this.fetchSensors();
    }

    private openMoreInfo(entity_id: string) {
        const event = new CustomEvent('hass-more-info', {
            bubbles: true,
            composed: true,
            detail: { entityId: entity_id },
        });
        this.dispatchEvent(event);
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

    render() {
        if (!this._params) return nothing;

        const sortedSensors = this.sortAllSensors(this.allSensors);

        return html`
            <ha-dialog
                open
                @closed=${this.closeDialog}
                .heading=${"Door and Window Watcher"}
            >
                <div>
                    <div class="dialog-filter">
                        <label>Only open</label>
                        <ha-switch
                            .checked=${this.onlyOpen}
                            @change=${this.toggleOnlyOpen}
                        ></ha-switch>
                    </div>
                    ${sortedSensors.length === 0
                        ? html`<p style="opacity: 0.6; text-align: center; padding: 16px;">No sensors found</p>`
                        : sortedSensors.map(sensor => keyed(sensor.entity_id, this.renderDialogSensor(sensor)))
                    }
                </div>
            </ha-dialog>
        `;
    }

    private renderDialogSensor(sensor: SensorInfo) {
        const haState = this._hass?.states[sensor.entity_id];
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
                    <ha-button @click=${(e: Event) => { e.stopPropagation(); this.callService("adjust_remaining_seconds", { seconds: 300 }, sensor.entity_id); }}>+5 m</ha-button>
                    ${sensor.remaining_seconds > 0
                        ? html`<ha-button @click=${(e: Event) => { e.stopPropagation(); this.callService("adjust_remaining_seconds", { seconds: -300 }, sensor.entity_id); }}>-5 m</ha-button>`
                        : ""}
                    ${sensor.remaining_seconds > 0 || sensor.alert_triggered
                        ? html`<ha-button @click=${(e: Event) => { e.stopPropagation(); this.callService("dismiss_alert", {}, sensor.entity_id); }}><ha-icon icon="mdi:close"></ha-icon></ha-button>`
                        : ""}
                </div>
            </ha-card>
        `
    }

    private formatLastChanged(isoDate: string): string {
        const diff = dayjs().diff(dayjs(isoDate));
        const dur = dayjs.duration(diff);
        const hours = Math.floor(dur.asHours());
        const minutes = dur.minutes();

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ago`;
        }
        if (hours > 0) {
            return `${hours}h ${minutes}m ago`;
        }
        return `${minutes}m ago`;
    }

    private callService(service: string, data: any, entity_id: string) {
        if (!this._hass) return;
        data = { ...data, ...{ entity_id: entity_id } };
        this._hass.callService("door_window_watcher", service, data);
    }
}
