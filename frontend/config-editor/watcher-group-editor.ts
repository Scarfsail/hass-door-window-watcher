import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { HomeAssistant, WatcherGroup, WatcherGroupFixed, WatcherGroupTemperature } from "./types";
import { HassEntity } from "home-assistant-js-websocket";
import { mdiClose } from '@mdi/js';
import { groupEditorStyle } from "./styles";
import { getLocalizeFunction } from './localize';

interface DurationData {
    hours?: number;
    minutes?: number;
    seconds?: number;
}

const toDuration = (seconds: number): DurationData => ({
    hours: Math.floor(seconds / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
});

const fromDuration = (data?: DurationData): number =>
    (data?.hours ?? 0) * 3600 + (data?.minutes ?? 0) * 60 + (data?.seconds ?? 0);

/** Values for a type's own fields, filled in when a group is added or switched to that type. */
export const GROUP_TYPE_DEFAULTS = {
    fixed: { maxDurationSeconds: 60 },
    temperature: { indoorTemperatureEntity: "", outdoorTemperatureEntity: "", temperatureDiff: 10, timeDiff: 600, maxTemperture: 18 },
};

@customElement("watcher-group-editor")
export class WatcherGroupEditor extends LitElement {
    @property({ attribute: false }) public group?: WatcherGroup;
    @property({ attribute: false }) public hass!: HomeAssistant;

    static styles = groupEditorStyle;

    render() {
        const localize = getLocalizeFunction(this.hass);

        if (!this.group)
            return html`<div>${localize('groups.no_group')}</div>`

        return html`
            <ha-input
                .label=${localize('editor.name')}
                .value=${this.group.title}
                @input=${(e: any) => this.groupParamChanged("title", e.target.value)}>
            </ha-input>
            <div class="segmented">
                ${(["fixed", "temperature"] as const).map(type => html`
                    <button
                        class=${this.group!.type === type ? "active" : ""}
                        @click=${() => this.typeChanged(type)}>
                        ${localize(type === "fixed" ? 'editor.fixed_time' : 'editor.temperature_based')}
                    </button>`)}
            </div>
            <div class="grid">
                ${this.group.type == "fixed" ? this.renderParamsFixed(this.group) : this.renderParamsTemperature(this.group)}
                <ha-input .label=${localize('editor.sensor_open_state')} .value=${this.group.sensor_open_state} @input=${(e: any) => this.groupParamChanged("sensor_open_state", e.target.value)}></ha-input>
            </div>
            <div class="section-title">${localize('editor.door_windows')}</div>
            <div class="chips">
                ${this.group.entities.map((entity, idx) => this.renderEntityChip(entity, idx))}
            </div>
            <ha-entity-picker
                .hass=${this.hass}
                .entityFilter=${(stateObj: HassEntity) => ["door", "garage_door"].includes(stateObj.attributes.device_class!)}
                .includeDomains=${["binary_sensor"]}
                .excludeEntities=${this.group.entities}
                add-button
                .addButtonLabel=${localize('editor.add')}
                @value-changed=${(e: CustomEvent) => this.entityAdded(e.detail.value)}>
            </ha-entity-picker>
            <div class="actions">
                <ha-button variant="danger" appearance="plain" @click=${() => this.fireGroupChanged(undefined)}>${localize('editor.delete_group')}</ha-button>
            </div>
        `
    }
    private renderParamsFixed(group: WatcherGroupFixed) {
        const localize = getLocalizeFunction(this.hass);
        return html`
            ${this.renderDuration(localize('editor.max_duration'), group.maxDurationSeconds, "maxDurationSeconds")}
        `
    }
    private renderParamsTemperature(group: WatcherGroupTemperature) {
        const localize = getLocalizeFunction(this.hass);
        return html`
            <ha-entity-picker .hass=${this.hass} required .value=${group.indoorTemperatureEntity} .includeDomains=${["sensor"]} .label=${localize('editor.indoor_temp')} @value-changed=${(e: CustomEvent) => this.groupParamChanged("indoorTemperatureEntity", e.detail.value)}></ha-entity-picker>
            <ha-entity-picker .hass=${this.hass} required .value=${group.outdoorTemperatureEntity} .includeDomains=${["sensor"]} .label=${localize('editor.outdoor_temp')} @value-changed=${(e: CustomEvent) => this.groupParamChanged("outdoorTemperatureEntity", e.detail.value)}></ha-entity-picker>
            ${this.renderNumber(localize('editor.temperature_diff'), group.temperatureDiff, "temperatureDiff")}
            ${this.renderDuration(localize('editor.time_diff'), group.timeDiff, "timeDiff")}
            ${this.renderNumber(localize('editor.max_temperature'), group.maxTemperture, "maxTemperture")}
        `
    }
    private renderNumber(label: string, value: number, param: "temperatureDiff" | "maxTemperture") {
        return html`
            <ha-input type="number" step="any" .label=${label} .value=${value ?? ""} @change=${(e: any) => e.target.value === "" ? e.target.value = value ?? "" : this.groupParamChanged(param, Number(e.target.value))}>
                <span slot="end">°C</span>
            </ha-input>
        `
    }
    private renderDuration(label: string, seconds: number, param: "maxDurationSeconds" | "timeDiff") {
        return html`
            <ha-duration-input required .label=${label} .data=${toDuration(Number(seconds ?? 0))} @value-changed=${(e: CustomEvent) => this.groupParamChanged(param, fromDuration(e.detail.value))}></ha-duration-input>
        `
    }
    private typeChanged(type: WatcherGroup["type"]) {
        if (!this.group || type === this.group.type)
            return;
        this.fireGroupChanged({ ...GROUP_TYPE_DEFAULTS[type], ...this.group, type } as WatcherGroup);
    }
    private groupParamChanged(param: keyof WatcherGroupTemperature | keyof WatcherGroupFixed, value: any) {
        if (!this.group)
            return;
        this.fireGroupChanged({ ...this.group, [param]: value });
    }

    private renderEntityChip(entity: string, index: number) {
        const localize = getLocalizeFunction(this.hass);
        const stateObj = this.hass.states[entity];
        return html`
            <span class="chip">
                <ha-state-icon .hass=${this.hass} .stateObj=${stateObj}></ha-state-icon>
                ${stateObj?.attributes.friendly_name ?? entity}
                <button .title=${localize('editor.remove')} @click=${() => this.entityRemoved(index)}>
                    <ha-svg-icon .path=${mdiClose}></ha-svg-icon>
                </button>
            </span>
        `
    }
    private fireGroupChanged(group?: WatcherGroup) {
        this.dispatchEvent(new CustomEvent('group-changed', { detail: { group: group } }));
    }

    private entityAdded(entity?: string) {
        if (!this.group || !entity)
            return;
        this.fireGroupChanged({ ...this.group, entities: [...this.group.entities, entity] });
    }

    private entityRemoved(index: number) {
        if (!this.group)
            return;
        this.fireGroupChanged({ ...this.group, entities: this.group.entities.filter((_, i) => i !== index) });
    }

}
