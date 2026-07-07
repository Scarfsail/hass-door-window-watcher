import { css, html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { HomeAssistant, WatcherGroup, WatcherGroupFixed, WatcherGroupTemperature } from "./types";
import { keyed } from 'lit/directives/keyed.js';
import { HassEntity } from "home-assistant-js-websocket";
import { mdiClose } from '@mdi/js';
import { commonStyle } from "./styles";
import { getLocalizeFunction } from './localize';

@customElement("watcher-group-editor")
export class WatcherGroupEditor extends LitElement {
    @property({ attribute: false }) public group?: WatcherGroup;
    @property({ attribute: false }) public hass!: HomeAssistant;
    static styles = css`
        ${commonStyle}

        ha-textfield {
            display: block;
            width: 100%;
        }

    `;
    render() {
        const localize = getLocalizeFunction(this.hass);

        if (!this.group)
            return html`<div>${localize('groups.no_group')}</div>`
        //<ha-textfield .label=${"Title"} .value=${this.group.title}></ha-textfield>
        //
        // Use entities length as key to force re-render of empty picker
        const emptyPickerKey = `new-${this.group.entities.length}`;

        return html`
            <ha-card>
                <div class="card-header">
                    <div class="name"><a @click=${this.renameTitle}>${this.group.title}</a></div>
                    <ha-icon-button .path=${mdiClose} @click=${() => this.fireGroupChanged(undefined)}></ha-icon-button>
                </div>
                <div class="card-content">
                    <h3>${localize('editor.parameters')}</h3>
                    <ha-combo-box
                        .label=${localize('editor.watch_time_based_on')}
                        .value=${this.group.type}
                        .items=${[{ value: "fixed", label: localize('editor.fixed_time') }, { value: "temperature", label: localize('editor.temperature_based') }]} }
                        .itemLabelPath=${"label"}
                        .itemValuePath=${"value"}
                        @value-changed=${(e: CustomEvent) => this.groupParamChanged("type", e.detail.value)}>
                    </ha-combo-box>
                    <ha-textfield .label=${localize('editor.sensor_open_state')} .value=${this.group.sensor_open_state} @change=${(e: any) => this.groupParamChanged("sensor_open_state", e.target.value)}></ha-textfield>
                    ${this.group.type == "fixed" ? this.renderParamsFixed(this.group) : this.renderParamsTemperature(this.group)}
                    <h3>${localize('editor.door_windows')}</h3>
                    ${this.group.entities.map((entity, idx) => html`
                        ${keyed(idx, html`${this.renderEntityPicker(entity, idx)}`)}
                    `)}
                        ${keyed(emptyPickerKey, this.renderEntityPicker())}
                </div>
            </ha-card>
        `
    }
    private renameTitle() {
        const localize = getLocalizeFunction(this.hass);
        const newTitle = prompt(localize('editor.enter_new_title'), this.group?.title);
        if (newTitle != null) {
            this.fireGroupChanged({ ...this.group!, title: newTitle });
        }
    }
    private renderParamsFixed(group: WatcherGroupFixed) {
        const localize = getLocalizeFunction(this.hass);
        return html`
            <ha-textfield .label=${localize('editor.max_duration_sec')} .value=${group.maxDurationSeconds} @change=${(e: any) => this.groupParamChanged("maxDurationSeconds", e.target.value)}></ha-textfield>
        `
    }
    private renderParamsTemperature(group: WatcherGroupTemperature) {
        const localize = getLocalizeFunction(this.hass);
        return html`
            <ha-entity-picker .hass=${this.hass} required .value=${group.indoorTemperatureEntity} .includeDomains=${["sensor"]} label=${localize('editor.select_indoor_temp')} @value-changed=${(e: CustomEvent) => this.groupParamChanged("indoorTemperatureEntity", e.detail.value)}></ha-entity-picker>
            <ha-entity-picker .hass=${this.hass} required .value=${group.outdoorTemperatureEntity} .includeDomains=${["sensor"]} label=${localize('editor.select_outdoor_temp')} @value-changed=${(e: CustomEvent) => this.groupParamChanged("outdoorTemperatureEntity", e.detail.value)}></ha-entity-picker>
            <ha-textfield .label=${localize('editor.temperature_diff')} .value=${group.temperatureDiff} @change=${(e: any) => this.groupParamChanged("temperatureDiff", e.target.value)}></ha-textfield>
            <ha-textfield .label=${localize('editor.time_diff')} .value=${group.timeDiff} @change=${(e: any) => this.groupParamChanged("timeDiff", e.target.value)}></ha-textfield>
            <ha-textfield .label=${localize('editor.max_temperature')} .value=${group.maxTemperture} @change=${(e: any) => this.groupParamChanged("maxTemperture", e.target.value)}></ha-textfield>
        `
    }
    private groupParamChanged(param: keyof WatcherGroupTemperature | keyof WatcherGroupFixed, value: any) {
        if (!this.group)
            return;
        console.log("group param changed", param, value);
        this.fireGroupChanged({ ...this.group, [param]: value });
    }

    private renderEntityPicker(entity?: string, index?: number) {
        const localize = getLocalizeFunction(this.hass);
        return html`
        <div class="picker">
            <ha-entity-picker
            .hass=${this.hass}
            .value=${entity}
            .entityFilter=${(stateObj: HassEntity) => ["door", "garage_door"].includes(stateObj.attributes.device_class!)}
            includeDomains="binary_sensor"
            label=${localize('editor.select_door_window')}
            @value-changed=${(e: CustomEvent) => this.entityPicked(index, e.detail.value)}
            ></ha-entity-picker>
        </div>
        `
    }
    private fireGroupChanged(group?: WatcherGroup) {
        this.dispatchEvent(new CustomEvent('group-changed', { detail: { group: group } }));
    }

    private entityPicked(index?: number, newEntity?: string) {
        if (!this.group)
            return;
        const entities = [...this.group.entities]
        if (index == undefined && newEntity) {
            entities.push(newEntity);
        }

        if (index != undefined && newEntity) {
            entities[index] = newEntity;
        }

        if (index != undefined && !newEntity) {
            entities.splice(index, 1);
        }

        this.fireGroupChanged({ ...this.group, entities: entities });
    }

}