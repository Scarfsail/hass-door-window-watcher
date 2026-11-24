import { LitElement, css, html, svg } from "lit-element"
import { customElement } from "lit/decorators.js";
import type { HassEntity } from "home-assistant-js-websocket";
import type { HomeAssistant } from "../hass-frontend/src/types";
import type { LovelaceCard } from "../hass-frontend/src/panels/lovelace/types";
import type { LovelaceCardConfig } from "../hass-frontend/src/data/lovelace/config/card";
import { OpenSensorInfo } from "./models";
import { classMap } from "lit/directives/class-map.js";
import { getLocalizeFunction } from "./localize";
import { formatMmSs, fractionElapsed, isCountingDown, secondsLeft } from "./time_utils";
import { subscribeTicker } from "./ticker";
import "./door-window-watcher-dialog";
import type { DoorWindowWatcherDialogParams } from "./door-window-watcher-dialog";

interface DoorWindowWatcherCardConfig extends LovelaceCardConfig {
    entity: string;
}

@customElement("door-window-watcher-card")
export class DoorWindowWatcherCard extends LitElement implements LovelaceCard {

    private config?: DoorWindowWatcherCardConfig;
    private dialogOpen = false;
    private _hass?: HomeAssistant;
    private _entity?: HassEntity;
    private _unsubscribeTicker?: () => void;
    private _tick = () => this.requestUpdate();

    public set hass(value: HomeAssistant) {
        const languageChanged = value?.language !== this._hass?.language;
        this._hass = value;
        const entity = this.config ? value?.states[this.config.entity] : undefined;
        if (entity === this._entity) {
            // Re-render so the text switches to the new profile language.
            if (languageChanged) this.requestUpdate();
            return;
        }

        if (entity && entity.state != this._entity?.state && entity.state == "on" && !this.dialogOpen) {
            this.openDialog();
        }
        this._entity = entity;
        this.requestUpdate();
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
        this._entity = this._hass?.states[config.entity];
        this.requestUpdate();
    }

    connectedCallback() {
        super.connectedCallback();
        // Resume the ticker (if counting down) after the dashboard re-attaches the card.
        this.requestUpdate();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.stopTicker();
    }

    private get openSensors(): OpenSensorInfo[] {
        return (this._entity?.attributes.open_sensors ?? []) as OpenSensorInfo[];
    }

    protected updated() {
        // An update queued before removal still runs; don't resubscribe a detached card.
        const counting = this.isConnected && this.openSensors.some(s => isCountingDown(s));
        if (counting) {
            this._unsubscribeTicker ??= subscribeTicker(this._tick);
        } else {
            this.stopTicker();
        }
    }

    private stopTicker() {
        this._unsubscribeTicker?.();
        this._unsubscribeTicker = undefined;
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
            --dww-color: var(--secondary-text-color);
            --dww-bg: var(--secondary-background-color, rgba(127, 127, 127, 0.15));
        }
        .icon-container.open {
            --dww-color: rgb(var(--rgb-info-color, 3, 155, 229));
            --dww-bg: rgba(var(--rgb-info-color, 3, 155, 229), 0.2);
        }
        .icon-container.countdown-active {
            --dww-color: rgb(var(--rgb-warning-color, 255, 166, 0));
            --dww-bg: rgba(var(--rgb-warning-color, 255, 166, 0), 0.2);
        }
        .icon-container.alert-active {
            --dww-color: rgb(var(--rgb-error-color, 219, 68, 55));
            --dww-bg: rgba(var(--rgb-error-color, 219, 68, 55), 0.2);
        }

        .tile-icon {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: var(--dww-bg);
            transition:
                transform 180ms ease-in-out,
                background-color 180ms ease-in-out,
                box-shadow 180ms ease-in-out;
        }
        .icon-container:active .tile-icon {
            transform: scale(1.1);
        }

        .tile-icon ha-icon {
            color: var(--dww-color);
            --mdc-icon-size: 24px;
            transition: color 180ms ease-in-out;
        }

        .ring {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 46px;
            height: 46px;
            transform: translate(-50%, -50%) rotate(-90deg);
            pointer-events: none;
        }
        .ring circle {
            fill: none;
            stroke-width: 2.5;
        }
        .ring .track {
            stroke: var(--dww-bg);
        }
        .ring .progress {
            stroke: var(--dww-color);
            stroke-linecap: round;
            transition: stroke-dasharray 1s linear;
        }

        .alert-active .tile-icon {
            animation: pulse-glow 2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
            .alert-active .tile-icon {
                animation: none;
            }
            .ring .progress {
                transition: none;
            }
        }
        @keyframes pulse-glow {
            0% { box-shadow: 0 0 0 0 rgba(var(--rgb-error-color, 219, 68, 55), 0); }
            50% { box-shadow: 0 0 12px 4px rgba(var(--rgb-error-color, 219, 68, 55), 0.8); }
            100% { box-shadow: 0 0 0 0 rgba(var(--rgb-error-color, 219, 68, 55), 0); }
        }

        .caption {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            line-height: 14px;
            font-weight: 500;
            font-variant-numeric: tabular-nums;
            color: var(--dww-color);
        }

        .count-badge {
            position: absolute;
            top: 6px;
            right: calc(50% - 28px);
            min-width: 18px;
            height: 18px;
            padding: 0 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--dww-color);
            color: var(--text-primary-color, white);
            border-radius: 9px;
            font-size: 11px;
            font-weight: 500;
            line-height: 1;
            box-shadow: 0 0 0 2px var(--card-background-color, white);
            z-index: 2;
            box-sizing: border-box;
        }
    `

    render() {
        const localize = getLocalizeFunction(this._hass!);

        if (!this.config) {
            return localize('card.no_config');
        }
        const entity = this._entity;
        if (!entity) {
            return localize('card.entity_not_found', { entity: this.config.entity });
        }

        const now = Date.now();
        const openSensors = this.openSensors;
        const openCount = openSensors.length;
        const alertActive = entity.state == "on";
        const nearest = openSensors
            .filter(s => isCountingDown(s, now))
            .sort((a, b) => secondsLeft(a.alert_at!, now) - secondsLeft(b.alert_at!, now))[0];
        const countdownActive = !alertActive && nearest !== undefined;

        const iconClass = {
            "icon-container": true,
            "open": openCount > 0,
            "alert-active": alertActive,
            "countdown-active": countdownActive,
        };

        // Share of the ring still drawn: full when an alert fires, draining toward the nearest alert otherwise.
        const ringFraction = alertActive ? 1 : nearest ? 1 - fractionElapsed(nearest.opened_at, nearest.alert_at!, now) : 0;

        return html`
            <ha-card>
                <div class=${classMap(iconClass)} @click=${this.openDialog}>
                    <div class="tile-icon">
                        <ha-icon icon=${openCount > 0 ? "mdi:window-open-variant" : "mdi:window-closed-variant"}></ha-icon>
                    </div>
                    ${alertActive || countdownActive ? svg`
                        <svg class="ring" viewBox="0 0 46 46">
                            <circle class="track" cx="23" cy="23" r="21.5"></circle>
                            <circle class="progress" cx="23" cy="23" r="21.5" pathLength="1" stroke-dasharray="${ringFraction} 1"></circle>
                        </svg>` : ''}
                    ${countdownActive ? html`<div class="caption">${formatMmSs(secondsLeft(nearest.alert_at!, now))}</div>` : ''}
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

        // HA fires dialog-closed for every dialog (e.g. more-info opened from a row), so wait for ours.
        const onClosed = (ev: Event) => {
            if ((ev as CustomEvent).detail?.dialog === "door-window-watcher-dialog") {
                this.dialogOpen = false;
                window.removeEventListener("dialog-closed", onClosed);
            }
        };
        window.addEventListener("dialog-closed", onClosed);
    }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: 'door-window-watcher-card',
    name: 'Door Window Watcher Card', // This is shown in card picker UI
    description: 'Card for Door Window Watcher Integration', // This is shown in card picker UI
    preview: true,
});
