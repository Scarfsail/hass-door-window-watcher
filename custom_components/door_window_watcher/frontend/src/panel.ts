import { LitElement, html, CSSResultGroup, css } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { HomeAssistant, WatcherGroup } from './types';
import { loadHaForm } from "./load-ha-elements";

import './watcher-group-editor';
import './watcher-groups-editor';
import { WatchersConfig } from './types/watchers-config';

@customElement('door-window-watcher-panel')
export class DoorWindowWatcherPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  /*
    @state() private groups: WatcherGroup[] = [
      { type: "fixed", title: "Okna doma", entities: ["binary_sensor.centraldvc_window_bathroom_contact", "binary_sensor.centraldvc_door_entrance_contact"], maxDurationSeconds: 60 },
      { type: "temperature", title: "Okna garáž", entities: ["binary_sensor.centraldvc_window_office_contact1", "binary_sensor.centraldvc_garage_door_contact"], temperatureDiff: 5, timeDiff: 10, maxTemperture: 16 },
    ];
    */
  @state() private config?: WatchersConfig;
  
  static styles: CSSResultGroup = css`
    .right {
      display: flex;
      justify-content: flex-end;
    }
  `
  render() {
    if (!this.config)
      return html`<div>No config</div>`

    return html`
      <ha-card header="Door Window Watcher Panel">
      <div class="card-content">        
        <div>Groups</div>
        <watcher-groups-editor .hass=${this.hass} .groups=${this.config.groups} @groups-changed=${(e: CustomEvent) => this.config = { ...this.config, groups: e.detail.groups }}></watcher-groups-editor>
        <div>
        <div class="right">
          <ha-button @click="${this.saveConfig}">Save</ha-button>
        </div>
      </div>        
      </div>
    </ha-card>
    `
  }



  connectedCallback(): void {
    super.connectedCallback();
    loadHaForm();

    this.hass.callWS({ type: "dww/get_config" })
      .then((response: any) => {
        console.log("Config loaded:", response);
        const cfg = response ?? { groups: [] };
        if (!cfg!.groups)
          cfg!.groups = [];
        this.config = cfg;
      })
      .catch((err) => {
        console.error("Error loading config:", err);
      });
  }

  private saveConfig() {
    console.log("Saving config:", this.config);
    this.hass.callWS({
        type: "dww/save_config",
        config: this.config,
      })
      .then((result) => {
        console.log("Save result:", result);
      })
      .catch((err) => {
        console.error("Error saving config:", err);
      });
  }


}