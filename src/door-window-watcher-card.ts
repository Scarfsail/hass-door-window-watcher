import { LitElement, css, html } from "lit-element"
import { customElement, state } from "lit/decorators.js";
import type { HomeAssistant } from "../hass-frontend/src/types";
import type { LovelaceCard } from "../hass-frontend/src/panels/lovelace/types";
import type { LovelaceCardConfig } from "../hass-frontend/src/data/lovelace/config/card";
import { OpenSensorInfo } from "./models";
import { classMap } from "lit/directives/class-map.js";
import "./door-window-watcher-dialog";
import type { DoorWindowWatcherDialogParams } from "./door-window-watcher-dialog";

interface DoorWindowWatcherCardConfig extends LovelaceCardConfig {
    entity: string;
}

@customElement("door-window-watcher-card")
export class DoorWindowWatcherCard extends LitElement implements LovelaceCard {

    private config?: DoorWindowWatcherCardConfig;
    @state() private _hass?: HomeAssistant;

    public set hass(value: HomeAssistant) {
        const entity_old = this.config ? this._hass?.states[this.config.entity] : undefined;
        const entity_new = this.config ? value?.states[this.config.entity] : undefined;
        if (entity_new) {
            if (entity_old?.state != entity_new.state) {
                if (entity_new.state == "on") {
                    this.openDialog();
                }
            }
        }
        this._hass = value;
    }

    getCardSize() {
        return this.config?.card_size ?? 1;
    }

    public static async getStubConfig(_hass: HomeAssistant): Promise<Partial<DoorWindowWatcherCardConfig>> {
        return {
            type: `custom:door-window-watcher-card`,
            entity: "binary_sensor.door_window_watcher_alert",
        };
    }

    async setConfig(config: DoorWindowWatcherCardConfig) {
        this.config = config;
    }

    static styles = css`
        .alert-active { color: var(--error-color) }
        .countdown-active { color: var(--warning-color) }
        .inactive { color: var(--primary-text-color) }
        .header-icon {
            cursor: pointer;
            margin-top: 5px;
            margin-bottom: 5px;
            text-align: center;
        }
    `

    render() {
        if (!this.config) {
            return "Config is not defined";
        }
        const entity = this._hass?.states[this.config.entity];
        if (!entity) {
            return `Entity ${this.config.entity} not found`;
        }

        const open_sensors = entity.attributes.open_sensors as OpenSensorInfo[];
        const iconClass = {
            "alert-active": entity.state == "on",
            "countdown-active": entity.state != "on" && open_sensors.some(s => s.remaining_seconds > 0),
            "header-icon": true,
        };

        return html`
            <ha-card>
                <div class=${classMap(iconClass)} @click=${this.openDialog}>
                    <ha-icon icon="mdi:window-open-variant"></ha-icon>
                </div>
            </ha-card>
        `
    }

    private openDialog() {
        if (!this._hass) return;

        this.dispatchEvent(new CustomEvent("show-dialog", {
            bubbles: true,
            composed: true,
            detail: {
                dialogTag: "door-window-watcher-dialog",
                dialogImport: () => Promise.resolve(),
                dialogParams: {
                    hass: this._hass,
                } as DoorWindowWatcherDialogParams,
            },
        }));
    }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: 'door-window-watcher-card',
    name: 'Door Window Watcher Card',
    description: 'Card for Door Window Watcher Integration',
    preview: true,
});
