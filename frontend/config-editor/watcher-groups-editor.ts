import { html, LitElement } from "lit"
import { customElement, property } from "lit/decorators.js"
import { repeat } from "lit/directives/repeat.js";
import { mdiPlus, mdiThermometer, mdiTimerOutline } from "@mdi/js";
import { HomeAssistant, WatcherGroup } from "./types";
import { getLocalizeFunction, LocalizeFunction } from './localize';
import { groupsStyle } from "./styles";
import { GROUP_TYPE_DEFAULTS } from "./watcher-group-editor";


@customElement("watcher-groups-editor")
export class WatcherGroupsEditor extends LitElement {
    @property({ attribute: false }) public groups?: WatcherGroup[];
    @property({ attribute: false }) public hass!: HomeAssistant;

    /** Stable render keys, one per group, so a panel keeps its expanded state when another group is removed. */
    private keys: number[] = [];
    private nextKey = 0;
    /** Keys of groups added in this session; they start expanded. */
    private addedKeys = new Set<number>();

    static styles = groupsStyle;

    render() {
        const localize = getLocalizeFunction(this.hass);

        if (!this.groups)
            return html`<div>${localize('groups.no_groups')}</div>`

        if (this.keys.length !== this.groups.length)
            this.keys = this.groups.map(() => this.nextKey++);

        return html`
              ${repeat(this.groups, (_, idx) => this.keys[idx], (group, idx) => html`
                <ha-expansion-panel
                    .expanded=${this.addedKeys.has(this.keys[idx])}
                    .header=${group.title}
                    .secondary=${this.summary(group, localize)}>
                    <ha-svg-icon slot="leading-icon" .path=${group.type === "fixed" ? mdiTimerOutline : mdiThermometer}></ha-svg-icon>
                    <watcher-group-editor
                        .group=${group}
                        .hass=${this.hass}
                        @group-changed=${(e: CustomEvent) => this.groupChanged(idx, e.detail.group)}>
                    </watcher-group-editor>
                </ha-expansion-panel>`)}
              <div class="add-group">
                <ha-button appearance="plain" @click=${() => this.addGroup()}>
                    <ha-svg-icon slot="start" .path=${mdiPlus}></ha-svg-icon>
                    ${localize('groups.add_group')}
                </ha-button>
              </div>
        `
    }

    private summary(group: WatcherGroup, localize: LocalizeFunction): string {
        const parts = [localize(group.type === "fixed" ? 'editor.fixed_time' : 'editor.temperature_based')];
        if (group.type === "fixed")
            parts.push(formatDuration(Number(group.maxDurationSeconds), localize));
        parts.push(localize('groups.entity_count', { count: group.entities.length }));
        return parts.join(" · ");
    }

    addGroup() {
        const localize = getLocalizeFunction(this.hass);
        const groups = [...this.groups!];
        groups.push({ type: "fixed", title: localize('groups.new_group'), entities: [], ...GROUP_TYPE_DEFAULTS.fixed, sensor_open_state: "on" });
        const key = this.nextKey++;
        this.addedKeys.add(key);
        this.keys = [...this.keys, key];
        this.fireGroupsChanged(groups)
    }

    private groupChanged(idx: number, group: WatcherGroup) {
        const groups = [...this.groups!];
        if (!group) {
            groups.splice(idx, 1);
            this.keys = this.keys.filter((_, i) => i !== idx);
        } else {
            groups[idx] = group;
        }
        this.fireGroupsChanged(groups);
    }

    private fireGroupsChanged(groups: WatcherGroup[]) {
        this.dispatchEvent(new CustomEvent('groups-changed', { detail: { groups: groups } }));
    }

}

function formatDuration(seconds: number, localize: LocalizeFunction): string {
    seconds = Number(seconds) || 0;
    return seconds % 60
        ? localize('groups.seconds', { seconds })
        : localize('groups.minutes', { minutes: seconds / 60 });
}
