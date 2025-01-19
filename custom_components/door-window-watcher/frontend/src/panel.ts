import { LitElement, html, CSSResultGroup, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { HomeAssistant } from './types';

@customElement('door-window-watcher-panel')
export class DoorWindowWatcherPanel extends LitElement {
  @property() public hass!: HomeAssistant;
  render() {
    return html`
      <div> 
        <h1>Door Window Watcher Panel</h1>
        <p>Panel to monitor the status of doors and windows</p>
      </div>
    `
  }

}