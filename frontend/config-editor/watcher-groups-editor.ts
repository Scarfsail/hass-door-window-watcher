import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { HomeAssistant, WatcherGroup } from "./types";
import { getLocalizeFunction } from './localize';


@customElement("watcher-groups-editor")
export class WatcherGroupsEditor extends LitElement {
    @property({ attribute: false }) public groups?: WatcherGroup[];
    @property({ attribute: false }) public hass!: HomeAssistant;

    render() {
        const localize = getLocalizeFunction(this.hass);

        if (!this.groups)
            return html`<div>${localize('groups.no_groups')}</div>`

        return html`
              ${this.groups.map((group, idx) => html`
                <watcher-group-editor
                    .group=${group}
                    .hass=${this.hass}
                    @group-changed=${(e: CustomEvent) => this.groupChanged(idx, e.detail.group)}>
                </watcher-group-editor>`)}
              <ha-button @click=${() => this.addGroup()}>${localize('groups.add_group')}</ha-button>
        `
    }
    addGroup() {
        const localize = getLocalizeFunction(this.hass);
        const groups = [...this.groups!];
        groups.push({ type: "fixed", title: localize('groups.new_group'), entities: [], maxDurationSeconds: 60, sensor_open_state: "on" });
        this.fireGroupsChanged(groups)
    }

    private groupChanged(idx: number, group: WatcherGroup) {
        const groups = [...this.groups!];
        if (!group) {
            groups.splice(idx, 1);
        } else {
            groups[idx] = group;
        }
        this.fireGroupsChanged(groups);
    }

    private fireGroupsChanged(groups: WatcherGroup[]) {
        this.dispatchEvent(new CustomEvent('groups-changed', { detail: { groups: groups } }));
    }

}