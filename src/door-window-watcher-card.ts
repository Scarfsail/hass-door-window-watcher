import { LitElement, css, html } from "lit-element"
import { customElement, state } from "lit/decorators.js";
import type { HomeAssistant } from "../hass-frontend/src/types";
import type { LovelaceCard } from "../hass-frontend/src/panels/lovelace/types";
import type { LovelaceCardConfig } from "../hass-frontend/src/data/lovelace/config/card";
import { OpenSensorInfo } from "./models";
import { classMap } from "lit/directives/class-map.js";
import { getLocalizeFunction } from "./localize";
import "./door-window-watcher-dialog";
import type { DoorWindowWatcherDialogParams } from "./door-window-watcher-dialog";

interface DoorWindowWatcherCardConfig extends LovelaceCardConfig {
    entity: string;
}

@customElement("door-window-watcher-card")
export class DoorWindowWatcherCard extends LitElement implements LovelaceCard {

    private config?: DoorWindowWatcherCardConfig;
    private dialogOpen = false;
    @state() private _hass?: HomeAssistant;

    public set hass(value: HomeAssistant) {
        const entity_old = this.config ? this._hass?.states[this.config.entity] : undefined;
        const entity_new = this.config ? value?.states[this.config.entity] : undefined;
        if (entity_new) {
            if (entity_old?.state != entity_new.state) {
                if (entity_new.state == "on" && !this.dialogOpen) {
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
        ha-card {
            background: transparent;
            box-shadow: none;
            border: none;
        }
        .icon-container {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            cursor: pointer;
            user-select: none;
            --dww-icon-color: var(--primary-text-color);
        }
        .icon-container.alert-active {
            --dww-icon-color: rgb(var(--rgb-error-color, 219, 68, 55));
        }
        .icon-container.countdown-active {
            --dww-icon-color: rgb(var(--rgb-warning-color, 255, 166, 0));
        }

        .tile-icon {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            overflow: hidden;
            transition:
                transform 180ms ease-in-out,
                box-shadow 180ms ease-in-out;
        }
        .icon-container:active .tile-icon {
            transform: scale(1.1);
        }

        .tile-icon-bg {
            position: absolute;
            inset: 0;
            background-color: transparent;
            transition: background-color 180ms ease-in-out;
        }

        .tile-icon ha-icon {
            position: relative;
            z-index: 1;
            color: var(--dww-icon-color);
            --mdc-icon-size: 24px;
            transition: color 180ms ease-in-out;
        }

        .alert-active .tile-icon {
            animation: pulse-glow 2s ease-in-out infinite;
        }
        .countdown-active .tile-icon {
            box-shadow: 0 0 12px 4px rgba(var(--rgb-warning-color, 255, 166, 0), 0.6);
        }

        @keyframes pulse-glow {
            0% { box-shadow: 0 0 0 0 rgba(var(--rgb-error-color, 219, 68, 55), 0); }
            50% { box-shadow: 0 0 12px 4px rgba(var(--rgb-error-color, 219, 68, 55), 0.8); }
            100% { box-shadow: 0 0 0 0 rgba(var(--rgb-error-color, 219, 68, 55), 0); }
        }

        .count-badge {
            position: absolute;
            top: 8px;
            right: calc(50% - 26px);
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgb(var(--rgb-primary-color, 0, 154, 199));
            color: var(--text-primary-color, white);
            border-radius: 10px;
            font-size: 12px;
            font-weight: 500;
            line-height: 1;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            z-index: 2;
            box-sizing: border-box;
        }
    `

    render() {
        const localize = getLocalizeFunction(this._hass!);

        if (!this.config) {
            return localize('card.no_config');
        }
        const entity = this._hass?.states[this.config.entity];
        if (!entity) {
            return localize('card.entity_not_found', { entity: this.config.entity });
        }

        const open_sensors = entity.attributes.open_sensors as OpenSensorInfo[];
        const openCount = open_sensors?.length || 0;
        const iconClass = {
            "alert-active": entity.state == "on",
            "countdown-active": entity.state != "on" && open_sensors.some(s => s.remaining_seconds > 0),
            "icon-container": true,
        };

        return html`
            <ha-card>
                <div class=${classMap(iconClass)} @click=${this.openDialog}>
                    <div class="tile-icon">
                        <div class="tile-icon-bg"></div>
                        <ha-icon icon="mdi:window-open-variant"></ha-icon>
                    </div>
                    ${openCount > 0 ? html`<div class="count-badge">${openCount}</div>` : ''}
                </div>
            </ha-card>
        `
    }

    private openDialog() {
        if (!this._hass || this.dialogOpen || !this.config) return;

        this.dialogOpen = true;

        this.dispatchEvent(new CustomEvent("show-dialog", {
            bubbles: true,
            composed: true,
            detail: {
                dialogTag: "door-window-watcher-dialog",
                dialogImport: () => Promise.resolve(),
                dialogParams: {
                    entityId: this.config.entity,
                } as DoorWindowWatcherDialogParams,
            },
        }));

        window.addEventListener("dialog-closed", (ev: Event) => {
            if ((ev as CustomEvent).detail?.dialog === "door-window-watcher-dialog") {
                this.dialogOpen = false;
            }
        }, { once: true });
    }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: 'door-window-watcher-card',
    name: 'Door Window Watcher Card', // This is shown in card picker UI
    description: 'Card for Door Window Watcher Integration', // This is shown in card picker UI
    preview: true,
});
