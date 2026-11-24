import { LitElement, css, html, nothing } from "lit-element"
import type { PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant } from "../hass-frontend/src/types";
import { OpenSensorInfo, SensorInfo } from "./models";
import { formatMmSs, fractionElapsed, secondsLeft, secondsOver, secondsSince } from "./time_utils";
import { classMap } from "lit/directives/class-map.js";
import { keyed } from 'lit/directives/keyed.js';
import { getLocalizeFunction, LocalizeFunction } from "./localize";
import { subscribeTicker } from "./ticker";

/** Seconds the dialog waits after the alert clears before it closes itself. */
const AUTO_CLOSE_SECONDS = 10;

type RowGroup = "over_limit" | "counting_down" | "no_limit" | "closed";

export interface DoorWindowWatcherDialogParams {
    entityId: string;
}

@customElement("door-window-watcher-dialog")
export class DoorWindowWatcherDialog extends LitElement {

    @property({ attribute: false }) public hass!: HomeAssistant;
    @state() private _params?: DoorWindowWatcherDialogParams;
    @state() private onlyOpen = true;
    @state() private monitoredEntityIds: string[] = [];
    /** Set by the shared ticker so the clocks advance without state pushes. */
    @state() private tickAt = 0;
    /** When the auto-close countdown ends; undefined while no countdown runs. */
    @state() private closeAt?: number;
    private closeTimer?: number;
    /** Entities listed since the dialog opened, so a window closed meanwhile stays visible. */
    private shownIds = new Set<string>();
    private unsubscribeTicker?: () => void;

    public showDialog(params: DoorWindowWatcherDialogParams): void {
        this._params = params;
        this.shownIds = new Set();
        this.unsubscribeTicker ??= subscribeTicker(() => this.tickAt = Date.now());
    }

    public closeDialog(): void {
        this.stopCountdown();
        this.stopTicker();
        this._params = undefined;
        this.dispatchEvent(new CustomEvent("dialog-closed", {
            bubbles: true,
            composed: true,
            detail: { dialog: "door-window-watcher-dialog" },
        }));
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.stopCountdown();
        this.stopTicker();
    }

    private stopTicker() {
        this.unsubscribeTicker?.();
        this.unsubscribeTicker = undefined;
    }

    private startCountdown() {
        if (this.closeAt !== undefined) return;
        this.closeAt = Date.now() + AUTO_CLOSE_SECONDS * 1000;
        this.closeTimer = window.setTimeout(() => this.closeDialog(), AUTO_CLOSE_SECONDS * 1000);
    }

    private stopCountdown() {
        window.clearTimeout(this.closeTimer);
        this.closeTimer = undefined;
        this.closeAt = undefined;
    }

    /** A new hass object redraws only when the alert entity (or, with "Show closed", a monitored entity) changed. */
    protected shouldUpdate(changed: PropertyValues): boolean {
        if (!this._params) return changed.has("_params");
        if (!changed.has("hass") || changed.size > 1) return true;

        const oldHass = changed.get("hass") as HomeAssistant | undefined;
        if (!oldHass) return true;

        const ids = this.onlyOpen ? [this._params.entityId] : [this._params.entityId, ...this.monitoredEntityIds];
        return ids.some(id => oldHass.states[id] !== this.hass.states[id]);
    }

    protected willUpdate(changed: PropertyValues) {
        if (!this._params || !changed.has("hass")) return;

        const entityId = this._params.entityId;
        const before = (changed.get("hass") as HomeAssistant | undefined)?.states[entityId]?.state;
        const after = this.hass.states[entityId]?.state;
        if (before === "on" && after === "off") {
            this.startCountdown();
        } else if (after === "on") {
            this.stopCountdown();
        }
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

    /** Splits sensors into the dialog's groups, each sorted by urgency. */
    private groupSensors(sensors: SensorInfo[]): Record<RowGroup, SensorInfo[]> {
        const byAlertAt = (a: SensorInfo, b: SensorInfo) =>
            new Date(a.alert_at!).getTime() - new Date(b.alert_at!).getTime();
        const open = sensors.filter(s => s.opened_at !== null);

        return {
            over_limit: open.filter(s => s.alert_triggered).sort(byAlertAt),
            counting_down: open.filter(s => !s.alert_triggered && s.alert_at !== null).sort(byAlertAt),
            no_limit: open.filter(s => !s.alert_triggered && s.alert_at === null)
                .sort((a, b) => new Date(a.opened_at!).getTime() - new Date(b.opened_at!).getTime()),
            closed: sensors.filter(s => s.opened_at === null)
                .sort((a, b) => new Date(b.last_changed).getTime() - new Date(a.last_changed).getTime()),
        };
    }

    static styles = css`
        ha-dialog {
            --dialog-content-padding: 0 16px 8px;
        }

        /* Auto-close banner */
        .banner {
            position: relative;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
            padding: 10px 12px 12px;
            border-radius: var(--ha-card-border-radius, 12px);
            background-color: rgba(var(--rgb-success-color, 67, 160, 71), 0.15);
            overflow: hidden;
        }
        .banner > ha-icon {
            color: rgb(var(--rgb-success-color, 67, 160, 71));
            flex-shrink: 0;
        }
        .banner-text {
            flex: 1;
            min-width: 0;
        }
        .banner-title {
            font-size: 14px;
            font-weight: 500;
            color: var(--primary-text-color);
        }
        .banner-sub {
            font-size: 12px;
            color: var(--secondary-text-color);
            font-variant-numeric: tabular-nums;
        }
        .banner-bar {
            position: absolute;
            left: 0;
            bottom: 0;
            height: 3px;
            width: 100%;
            background-color: rgb(var(--rgb-success-color, 67, 160, 71));
            animation: drain linear forwards;
        }
        @keyframes drain {
            from { width: 100%; }
            to { width: 0%; }
        }

        .group-header {
            margin: 12px 4px 6px;
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--secondary-text-color);
        }

        /* Sensor Row */
        .row {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 6px;
            padding: 10px 12px;
            border-radius: var(--ha-card-border-radius, 12px);
            cursor: pointer;
            --row-color: var(--secondary-text-color);
            --row-bg: transparent;
            background-color: var(--row-bg);
            transition: opacity 180ms ease-in-out;
        }
        .row.over_limit {
            --row-color: rgb(var(--rgb-error-color, 219, 68, 55));
            --row-bg: rgba(var(--rgb-error-color, 219, 68, 55), 0.1);
        }
        .row.counting_down {
            --row-color: rgb(var(--rgb-warning-color, 255, 166, 0));
            --row-bg: rgba(var(--rgb-warning-color, 255, 166, 0), 0.1);
        }
        .row.no_limit {
            --row-color: rgb(var(--rgb-info-color, 3, 155, 229));
            --row-bg: rgba(var(--rgb-info-color, 3, 155, 229), 0.1);
        }
        .row.closed {
            opacity: 0.6;
        }
        .row:hover {
            filter: brightness(0.97);
        }

        .row-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            flex-shrink: 0;
            background-color: color-mix(in srgb, var(--row-color) 20%, transparent);
        }
        .row-icon ha-icon {
            color: var(--row-color);
            --mdc-icon-size: 22px;
        }

        .row-main {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .row-head {
            display: flex;
            align-items: baseline;
            gap: 8px;
        }
        .name {
            flex: 1;
            min-width: 0;
            font-size: 15px;
            font-weight: 500;
            line-height: 1.4;
            color: var(--primary-text-color);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .value {
            font-size: 13px;
            font-weight: 500;
            font-variant-numeric: tabular-nums;
            color: var(--row-color);
            white-space: nowrap;
        }
        .detail {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: var(--secondary-text-color);
        }
        .detail ha-icon {
            --mdc-icon-size: 14px;
        }

        .bar {
            height: 4px;
            border-radius: 2px;
            background-color: color-mix(in srgb, var(--row-color) 20%, transparent);
            overflow: hidden;
        }
        .bar > div {
            height: 100%;
            border-radius: 2px;
            background-color: var(--row-color);
            transition: width 1s linear;
        }

        .chips {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: 2px;
        }
        .chip {
            font: inherit;
            font-size: 12px;
            font-weight: 500;
            line-height: 1;
            padding: 6px 10px;
            border-radius: 8px;
            border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
            background-color: var(--card-background-color, white);
            color: var(--primary-text-color);
            cursor: pointer;
        }
        .chip:hover {
            border-color: var(--row-color);
        }

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

        .empty-state {
            opacity: 0.6;
            text-align: center;
            padding: 24px 16px;
            color: var(--secondary-text-color);
        }

        @media (prefers-reduced-motion: reduce) {
            .bar > div {
                transition: none;
            }
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

        const openSensors = (entity.attributes.open_sensors ?? []) as OpenSensorInfo[];
        const openIds = new Set(openSensors.map(s => s.entity_id));
        openIds.forEach(id => this.shownIds.add(id));

        const open: SensorInfo[] = openSensors.map(s => ({
            ...s,
            state: this.hass.states[s.entity_id]?.state || "on",
            last_changed: this.hass.states[s.entity_id]?.last_changed || "",
        }));

        // Closed rows: windows that closed while the dialog is open, plus every monitored one with "Show closed".
        const closedIds = new Set([...this.shownIds, ...(this.onlyOpen ? [] : this.monitoredEntityIds)]);
        const closed: SensorInfo[] = [...closedIds]
            .filter(id => !openIds.has(id) && this.hass.states[id])
            .map(id => ({
                entity_id: id,
                state: this.hass.states[id].state,
                last_changed: this.hass.states[id].last_changed,
                opened_at: null,
                alert_at: null,
                adjusted_seconds: 0,
                alert_triggered: false,
                dismissed: false,
            }));

        return [...open, ...closed];
    }

    render() {
        if (!this._params) return nothing;

        const localize = getLocalizeFunction(this.hass);
        const now = Date.now();
        const sensors = this.getSensorsToDisplay();
        const groups = this.groupSensors(sensors);
        const groupOrder: RowGroup[] = ["over_limit", "counting_down", "no_limit", "closed"];

        return html`
            <ha-dialog
                open
                @closed=${this.closeDialog}
                @pointerdown=${this.stopCountdown}
                .headerTitle=${localize('dialog.title')}
            >
                <div>
                    ${this.closeAt !== undefined ? this.renderBanner(now, localize) : nothing}
                    ${sensors.length === 0
                        ? html`<p class="empty-state">${localize('dialog.no_sensors')}</p>`
                        : groupOrder.map(group => groups[group].length === 0 ? nothing : html`
                            ${group !== "closed" || !this.onlyOpen
                                ? html`<div class="group-header">${localize(`dialog.group_${group}`)}</div>`
                                : nothing}
                            ${groups[group].map(sensor => keyed(sensor.entity_id, this.renderRow(sensor, group, now, localize)))}
                        `)
                    }
                    <div class="toggle-link" @click=${this.toggleOnlyOpen}>
                        ${this.onlyOpen ? localize('dialog.show_also_closed') : localize('dialog.show_only_open')}
                    </div>
                </div>
            </ha-dialog>
        `;
    }

    private renderBanner(now: number, localize: LocalizeFunction) {
        const seconds = Math.max(0, Math.ceil((this.closeAt! - now) / 1000));
        return html`
            <div class="banner">
                <ha-icon icon="mdi:check-circle"></ha-icon>
                <div class="banner-text">
                    <div class="banner-title">${localize('dialog.all_clear')}</div>
                    <div class="banner-sub">${localize('dialog.closing_in', { seconds })}</div>
                </div>
                <ha-button size="s" variant="success" appearance="accent" @click=${this.stopCountdown}>
                    ${localize('dialog.keep_open')}
                </ha-button>
                <div class="banner-bar" style="animation-duration: ${AUTO_CLOSE_SECONDS}s"></div>
            </div>
        `;
    }

    private renderRow(sensor: SensorInfo, group: RowGroup, now: number, localize: LocalizeFunction) {
        const name = this.hass.states[sensor.entity_id]?.attributes.friendly_name ?? sensor.entity_id;
        const { opened_at, alert_at } = sensor;

        let value: string;
        let detail: unknown = nothing;
        let remainingShare: number | undefined;

        switch (group) {
            case "over_limit":
                value = "+" + formatMmSs(secondsOver(alert_at!, now));
                detail = html`<ha-icon icon="mdi:clock-outline"></ha-icon>${localize('dialog.open_limit', {
                    open: formatMmSs(secondsSince(opened_at!, now)),
                    limit: formatMmSs(secondsSince(opened_at!, new Date(alert_at!).getTime())),
                })}`;
                break;
            case "counting_down":
                value = formatMmSs(secondsLeft(alert_at!, now));
                remainingShare = 1 - fractionElapsed(opened_at!, alert_at!, now);
                break;
            case "no_limit":
                value = formatMmSs(secondsSince(opened_at!, now));
                if (sensor.dismissed) detail = localize('dialog.dismissed');
                break;
            case "closed":
                value = this.shownIds.has(sensor.entity_id)
                    ? localize('dialog.just_now')
                    : this.formatLastChanged(sensor.last_changed, now, localize);
                detail = localize('dialog.closed');
                break;
        }

        return html`
            <div class=${classMap({ row: true, [group]: true })} @click=${() => this.openMoreInfo(sensor.entity_id)}>
                <div class="row-icon">
                    <ha-icon icon=${group === "closed" ? "mdi:window-closed-variant" : "mdi:window-open-variant"}></ha-icon>
                </div>
                <div class="row-main">
                    <div class="row-head">
                        <span class="name">${name}</span>
                        <span class="value">${value}</span>
                    </div>
                    ${detail !== nothing ? html`<div class="detail">${detail}</div>` : nothing}
                    ${remainingShare !== undefined
                        ? html`<div class="bar"><div style="width: ${remainingShare * 100}%"></div></div>`
                        : nothing}
                    ${group !== "closed" ? html`
                        <div class="chips">
                            ${this.renderChip(localize('dialog.add_5_min'), () => this.callService("adjust_remaining_seconds", { seconds: 300 }, sensor.entity_id))}
                            ${group === "counting_down"
                                ? this.renderChip(localize('dialog.sub_5_min'), () => this.callService("adjust_remaining_seconds", { seconds: -300 }, sensor.entity_id))
                                : nothing}
                            ${group !== "no_limit"
                                ? this.renderChip(localize('dialog.dismiss'), () => this.callService("dismiss_alert", {}, sensor.entity_id))
                                : nothing}
                        </div>
                    ` : nothing}
                </div>
            </div>
        `;
    }

    private renderChip(label: string, action: () => void) {
        return html`<button class="chip" @click=${(e: Event) => { e.stopPropagation(); action(); }}>${label}</button>`;
    }

    private formatLastChanged(isoDate: string, now: number, localize: LocalizeFunction): string {
        const totalMinutes = Math.floor(Math.max(0, secondsSince(isoDate, now)) / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours >= 24) {
            return localize('time.days_ago', { days: Math.floor(hours / 24) });
        }
        if (hours > 0) {
            return localize('time.hours_minutes_ago', { hours, minutes });
        }
        return localize('time.minutes_ago', { minutes });
    }

    private async callService(service: string, data: any, entity_id: string) {
        if (!this.hass) return;
        data = { ...data, ...{ entity_id: entity_id } };
        await this.hass.callService("door_window_watcher", service, data);
    }
}
