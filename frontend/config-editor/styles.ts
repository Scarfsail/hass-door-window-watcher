import { css } from 'lit';

export const panelStyle = css`
  :host {
    display: block;
    padding: 16px;
    background: var(--primary-background-color);
    min-height: 100%;
    box-sizing: border-box;
  }
  ha-card {
    max-width: 1000px;
    margin: 0 auto;
    overflow: hidden;
  }
  .header-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--divider-color);
  }
  .header-bar .title {
    flex: 1;
    min-width: 0;
    font-size: 20px;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .unsaved {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--warning-color);
    white-space: nowrap;
  }
  .unsaved::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--warning-color);
  }
  @media (max-width: 600px) {
    :host {
      padding: 8px;
    }
  }
`;

export const groupsStyle = css`
  ha-expansion-panel {
    display: block;
    border-bottom: 1px solid var(--divider-color);
    --expansion-panel-summary-padding: 4px 16px;
    --expansion-panel-content-padding: 0 16px 16px 56px;
  }
  ha-expansion-panel ha-svg-icon[slot="leading-icon"] {
    color: var(--state-icon-color, var(--primary-color));
    margin-inline-end: 16px;
  }
  .add-group {
    padding: 8px 12px;
  }
  @media (max-width: 600px) {
    ha-expansion-panel {
      --expansion-panel-content-padding: 0 16px 16px;
    }
  }
`;

export const groupEditorStyle = css`
  :host {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  ha-input,
  ha-entity-picker,
  ha-duration-input {
    display: block;
    width: 100%;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  @media (max-width: 600px) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .segmented {
    display: inline-flex;
    align-self: flex-start;
    border: 1px solid var(--divider-color);
    border-radius: 18px;
    overflow: hidden;
  }
  .segmented button {
    border: none;
    background: none;
    padding: 8px 16px;
    font: inherit;
    font-size: 14px;
    color: var(--primary-text-color);
    cursor: pointer;
  }
  .segmented button + button {
    border-inline-start: 1px solid var(--divider-color);
  }
  .segmented button.active {
    background: rgba(var(--rgb-primary-color), 0.15);
    color: var(--primary-color);
  }
  .section-title {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--secondary-text-color);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding-inline: 10px 4px;
    border: 1px solid var(--divider-color);
    border-radius: 16px;
    font-size: 14px;
    color: var(--primary-text-color);
    --mdc-icon-size: 18px;
  }
  .chip button {
    display: flex;
    border: none;
    background: none;
    padding: 4px;
    border-radius: 50%;
    color: var(--secondary-text-color);
    cursor: pointer;
    --mdc-icon-size: 16px;
  }
  .chip button:hover {
    background: rgba(var(--rgb-primary-text-color), 0.08);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
  }
`;
