import { css, html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { HomeAssistant, WatcherGroup, WatcherGroupFixed, WatcherGroupTemperature } from "./types";
import { keyed } from 'lit/directives/keyed.js';
import { HassEntity } from "home-assistant-js-websocket";
import { mdiClose } from '@mdi/js';
import { commonStyle } from "./styles";

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
        if (!this.group)
            return html`<div>No group</div>`
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
                    <h3>Parameters:</h3>
                    <ha-combo-box 
                        .label=${"Watch time based on"} 
                        .value=${this.group.type} 
                        .items=${[{ value: "fixed", label: "Fixed time" }, { value: "temperature", label: "Inside and outside temperature" }]} }
                        .itemLabelPath=${"label"}
                        .itemValuePath=${"value"}
                        @value-changed=${(e: CustomEvent) => this.groupParamChanged("type", e.detail.value)}>
                    </ha-combo-box>
                    ${this.group.type == "fixed" ? this.renderParamsFixed(this.group) : this.renderParamsTemperature(this.group)}
                    <h3>Door / Windows:</h3>
                    ${this.group.entities.map((entity, idx) => html`
                        ${keyed(idx, html`${this.renderEntityPicker(entity, idx)}`)}
                    `)}
                        ${keyed(emptyPickerKey, this.renderEntityPicker())}
                </div>
            </ha-card>
        `
    }
    private renameTitle() {
        const newTitle = prompt("Enter new title", this.group?.title);
        if (newTitle != null) {
            this.fireGroupChanged({ ...this.group!, title: newTitle });
        }
    }
    private renderParamsFixed(group: WatcherGroupFixed) {
        return html`
            <ha-textfield .label=${"Max duration"} .value=${group.maxDurationSeconds} @change=${(e: any) => this.groupParamChanged("maxDurationSeconds", e.target.value)}></ha-textfield>
        `
    }
    private renderParamsTemperature(group: WatcherGroupTemperature) {
        return html`
            <ha-entity-picker .hass=${this.hass} required .value=${group.indoorTemperaureEntity} .includeDomains=${["sensor"]} label="Select indoor temperature sensor" @value-changed=${(e: CustomEvent) => this.groupParamChanged("indoorTemperaureEntity", e.detail.value)}></ha-entity-picker> 
            <ha-entity-picker .hass=${this.hass} required .value=${group.outdoorTemperaureEntity} .includeDomains=${["sensor"]} label="Select outdoor temperature sensor" @value-changed=${(e: CustomEvent) => this.groupParamChanged("outdoorTemperaureEntity", e.detail.value)}></ha-entity-picker> 

            <ha-textfield .label=${"Temperature difference"} .value=${group.temperatureDiff} @change=${(e: any) => this.groupParamChanged("temperatureDiff", e.target.value)}></ha-textfield>
            <ha-textfield .label=${"Time difference"} .value=${group.timeDiff} @change=${(e: any) => this.groupParamChanged("timeDiff", e.target.value)}></ha-textfield>
            <ha-textfield .label=${"Max temperature"} .value=${group.maxTemperture} @change=${(e: any) => this.groupParamChanged("maxTemperture", e.target.value)}></ha-textfield>
        `
    }
    private groupParamChanged(param: keyof WatcherGroupTemperature | keyof WatcherGroupFixed, value: any) {
        if (!this.group)
            return;
        console.log("group param changed", param, value);
        this.fireGroupChanged({ ...this.group, [param]: value });
    }

    private renderEntityPicker(entity?: string, index?: number) {
        return html`
        <div class="picker">
            <ha-entity-picker
            .hass=${this.hass}
            .value=${entity}
            .entityFilter=${(stateObj: HassEntity) => ["door", "garage_door"].includes(stateObj.attributes.device_class!)}
            includeDomains="binary_sensor"
            label="Select door or window"
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