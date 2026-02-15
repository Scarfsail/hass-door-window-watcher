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
        .toggle-link {
            display: block;
            text-align: center;
            padding: 12px;
            color: var(--primary-color);
            font-size: 14px;
            cursor: pointer;
            user-select: none;
        }
        .toggle-link:hover {
            opacity: 0.8;
        }

        /* Sensor Row */
        .sensor-row {
            margin: 8px 0;
            padding: 0;
            --sensor-icon-color: var(--primary-text-color);
            transition: opacity 180ms ease-in-out;
        }
        .sensor-row.alert-active {
            --sensor-icon-color: rgb(var(--rgb-error-color, 219, 68, 55));
        }
        .sensor-row.countdown-active {
            --sensor-icon-color: rgb(var(--rgb-warning-color, 255, 166, 0));
        }
        .sensor-row.closed {
            --sensor-icon-color: var(--disabled-color, var(--secondary-text-color));
            opacity: 0.5;
        }

        .sensor-row-content {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            cursor: pointer;
            border-radius: var(--ha-card-border-radius, 12px);
            transition: background-color 180ms ease-in-out;
        }
        .sensor-row-content:hover {
            background-color: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.05);
        }

        /* Sensor Icon Pill */
        .sensor-icon-pill {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            flex-shrink: 0;
            overflow: hidden;
        }
        .sensor-icon-bg {
            position: absolute;
            inset: 0;
            background-color: var(--sensor-icon-color);
            opacity: 0.2;
            transition: opacity 180ms ease-in-out;
        }
        .sensor-icon-pill ha-icon {
            position: relative;
            z-index: 1;
            color: var(--sensor-icon-color);
            --mdc-icon-size: 24px;
            transition: color 180ms ease-in-out;
        }

        /* Sensor Info */
        .sensor-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
        }
        .sensor-name {
            font-size: 16px;
            font-weight: 500;
            line-height: 1.4;
            color: var(--primary-text-color);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .sensor-status {
            font-size: 14px;
            line-height: 1.4;
            color: var(--secondary-text-color);
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .sensor-status ha-icon {
            --mdc-icon-size: 16px;
        }

        /* Sensor Actions */
        .sensor-actions {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 12px 12px;
            flex-wrap: wrap;
        }
        .sensor-actions > .remaining-time {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            flex: 1;
            color: var(--sensor-icon-color);
        }
        .sensor-actions .remaining-time ha-icon {
            --mdc-icon-size: 18px;
        }
        .sensor-actions ha-button {
            --ha-button-height: 32px;
        }
        .sensor-actions ha-button ha-icon {
            --mdc-icon-size: 16px;
        }

        .animate-fading {
            animation: fading 2s infinite;
        }
        @keyframes fading {
            0% { opacity: 0.3 }
            50% { opacity: 1 }
            100% { opacity: 0.3 }
        }

        .empty-state {
            opacity: 0.6;
            text-align: center;
            padding: 24px 16px;
            color: var(--secondary-text-color);
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
                    ${sortedSensors.length === 0
                        ? html`<p class="empty-state">${localize('dialog.no_sensors')}</p>`
                        : sortedSensors.map(sensor => keyed(sensor.entity_id, this.renderDialogSensor(sensor)))
                    }
                    <div class="toggle-link" @click=${this.toggleOnlyOpen}>
                        ${this.onlyOpen ? localize('dialog.show_also_closed') : localize('dialog.show_only_open')}
                    </div>
                </div>
            </ha-dialog>
        `;
    }

    private renderDialogSensor(sensor: SensorInfo) {
        const localize = getLocalizeFunction(this.hass);
        const haState = this.hass?.states[sensor.entity_id];
        const isOpen = sensor.opened_at !== null;

        const rowClass = {
            "sensor-row": true,
            "alert-active": sensor.alert_triggered,
            "countdown-active": !sensor.alert_triggered && sensor.remaining_seconds > 0,
            "closed": !isOpen,
        };

        const iconName = isOpen ? "window-open-variant" : "window-closed-variant";

        const statusContent = isOpen
            ? html`
                <ha-icon icon="mdi:clock-outline"></ha-icon>
                <span>${getDurationMmSs(sensor.opened_at)}</span>`
            : this.formatLastChanged(sensor.last_changed);

        const showDismiss = sensor.remaining_seconds > 0 || sensor.alert_triggered;

        return html`
            <ha-card class=${classMap(rowClass)}>
                <div class="sensor-row-content" @click=${() => this.openMoreInfo(sensor.entity_id)}>
                    <div class="sensor-icon-pill">
                        <div class="sensor-icon-bg"></div>
                        <ha-icon icon="mdi:${iconName}"></ha-icon>
                    </div>
                    <div class="sensor-info">
                        <div class="sensor-name">${haState?.attributes.friendly_name ?? sensor.entity_id}</div>
                        <div class="sensor-status">${statusContent}</div>
                    </div>
                </div>
                ${isOpen ? html`
                    <div class="sensor-actions">
                        ${showDismiss ? html`
                            <span class="remaining-time ${classMap({ "animate-fading": sensor.alert_triggered })}">
                                <ha-icon icon="mdi:alert-circle"></ha-icon>
                                <span>${getDurationMmSs(dayjs().subtract(sensor.remaining_seconds, "second"))}</span>
                            </span>
                        ` : html`<span class="remaining-time"></span>`}
                        <ha-button
                            size="small"
                            appearance="outlined"
                            @click=${(e: Event) => { e.stopPropagation(); this.callService("adjust_remaining_seconds", { seconds: 300 }, sensor.entity_id); }}
                        >
                            <ha-icon slot="start" icon="mdi:plus"></ha-icon>
                            ${localize('dialog.add_5_min')}
                        </ha-button>
                        <ha-button
                            size="small"
                            appearance="outlined"
                            .disabled=${sensor.remaining_seconds <= 0}
                            @click=${(e: Event) => { e.stopPropagation(); this.callService("adjust_remaining_seconds", { seconds: -300 }, sensor.entity_id); }}
                        >
                            <ha-icon slot="start" icon="mdi:minus"></ha-icon>
                            ${localize('dialog.sub_5_min')}
                        </ha-button>
                        <ha-button
                            size="small"
                            appearance="outlined"
                            .disabled=${!showDismiss}
                            @click=${(e: Event) => { e.stopPropagation(); this.callService("dismiss_alert", {}, sensor.entity_id); }}
                        >
                            <ha-icon slot="start" icon="mdi:close"></ha-icon>
                            ${localize('dialog.dismiss')}
                        </ha-button>
                    </div>
                ` : ''}
            </ha-card>
        `;
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
