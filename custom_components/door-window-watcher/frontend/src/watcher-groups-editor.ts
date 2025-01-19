import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { HomeAssistant, WatcherGroup } from "./types";


@customElement("watcher-groups-editor")
export class WatcherGroupsEditor extends LitElement {
    @property({ attribute: false }) public groups?: WatcherGroup[];
    @property({ attribute: false }) public hass!: HomeAssistant;

    render() {
        if (!this.groups)
            return html`<div>No groups</div>`

        return html`
              ${this.groups.map((group, idx) => html`
                <watcher-group-editor 
                    .group=${group} 
                    .hass=${this.hass} 
                    @group-changed=${(e: CustomEvent) => this.groupChanged(idx, e.detail.group)}>
                </watcher-group-editor>`)}
              <ha-button @click=${() => this.addGroup()}>Add group</ha-button>
        `
    }
    addGroup() {
        const groups = [...this.groups!];
        groups.push({ type: "fixed", title: "New group", entities: [], maxDurationSeconds: 60 });
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