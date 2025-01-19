import { LitElement, html, CSSResultGroup, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { HomeAssistant } from './types';

@customElement('door-window-watcher-panel')
export class DoorWindowWatcherPanel extends LitElement {
  @property() public hass!: HomeAssistant;
  @property() public helloMessage: string = "";

  render() {
    return html`
      <div>
        <h1>Door Window Watcher Panel</h1>
        <p>Panel to monitor the status of doors and windows</p>
        <div>
        <button @click="${this._callHelloWorld}">Say Hello</button>
        <div class="hello">${this.helloMessage}</div>
      </div>        
      </div>
    `
  }

  private _callHelloWorld() {
    // Send a WebSocket request to your backend command
    this.hass.connection
      .sendMessagePromise({
        type: "dww/hello_world",
      })
      .then((response: any) => {
        this.helloMessage = response.message;
      })
      .catch((err: any) => {
        console.error("WebSocket command failed:", err);
        this.helloMessage = "Failed to get response.";
      });
  }  

}