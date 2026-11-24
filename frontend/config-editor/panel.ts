import { LitElement, html } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { HomeAssistant, WatcherGroup } from './types';
import { loadHaForm } from "./load-ha-elements";
import { getLocalizeFunction } from './localize';
import { panelStyle } from './styles';

import './watcher-group-editor';
import './watcher-groups-editor';
import { WatchersConfig } from './types/watchers-config';

const NUMERIC_PARAMS = ["maxDurationSeconds", "temperatureDiff", "timeDiff", "maxTemperture"];

/** Older configs stored numeric fields as strings; turn them into numbers. */
function normalizeGroup(group: WatcherGroup): WatcherGroup {
  const normalized: Record<string, any> = { ...group };
  for (const param of NUMERIC_PARAMS) {
    if (typeof normalized[param] === "string" && normalized[param] !== "")
      normalized[param] = Number(normalized[param]);
  }
  return normalized as WatcherGroup;
}

@customElement('door-window-watcher-panel')
export class DoorWindowWatcherPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config?: WatchersConfig;

  /** JSON of the config as last loaded or saved, to tell whether there are unsaved edits. */
  @state() private savedConfig?: string;

  /** Whether the HA form elements the editor uses are loaded. */
  @state() private elementsReady = false;

  static styles = panelStyle;

  render() {
    const localize = getLocalizeFunction(this.hass);

    if (!this.config || !this.elementsReady)
      return html`<div>${localize('panel.no_config')}</div>`

    const dirty = JSON.stringify(this.config) !== this.savedConfig;

    return html`
      <ha-card>
        <div class="header-bar">
          <div class="title">${localize('panel.header')}</div>
          ${dirty ? html`<div class="unsaved">${localize('panel.unsaved_changes')}</div>` : ''}
          <ha-button .disabled=${!dirty} @click=${this.saveConfig}>${localize('panel.save')}</ha-button>
        </div>
        <watcher-groups-editor .hass=${this.hass} .groups=${this.config.groups} @groups-changed=${(e: CustomEvent) => this.config = { ...this.config, groups: e.detail.groups }}></watcher-groups-editor>
      </ha-card>
    `
  }

  connectedCallback(): void {
    super.connectedCallback();

    loadHaForm()
      .then(() => customElements.whenDefined('ha-duration-input'))
      .catch((err) => console.error("Error loading HA elements:", err))
      .finally(() => this.elementsReady = true);

    this.hass.callWS<WatchersConfig | null>({ type: "dww/get_config" })
      .then((response) => {
        const config = { ...response, groups: (response?.groups ?? []).map(normalizeGroup) };
        this.savedConfig = JSON.stringify(config);
        this.config = config;
      })
      .catch((err) => {
        console.error("Error loading config:", err);
      });
  }

  private saveConfig() {
    const localize = getLocalizeFunction(this.hass);
    const config = this.config;
    this.hass.callWS({
        type: "dww/save_config",
        config: config,
      })
      .then(() => {
        this.savedConfig = JSON.stringify(config);
        this.showToast(localize('panel.saved'));
      })
      .catch((err) => {
        this.showToast(localize('panel.save_failed', { error: err?.message ?? String(err) }));
      });
  }

  private showToast(message: string) {
    this.dispatchEvent(new CustomEvent('hass-notification', { detail: { message }, bubbles: true, composed: true }));
  }
}
