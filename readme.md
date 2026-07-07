# HASS Door Window Watcher

## Features

- Smart duration calculation based on temperature difference between indoor and outdoor
- Fixed duration option for simpler setups
- Ability to temporarily disable monitoring for specific doors/windows
- Ability to increase / decrease time for each open door / window
- Flexible time adjustment for open duration thresholds
- Works with any binary sensor representing a door or window

## Companion Card

A companion Lovelace card is bundled with this integration and provides a beautiful way to visualize the
state of your doors and windows. As of this release, the card is no longer a separate HACS repository — it
ships with, and is installed together with, this integration. Its Lovelace resource is registered
automatically; no manual resource setup is needed (UI/storage-mode dashboards only — see
[Migrating from the standalone card](#migrating-from-the-standalone-card) below).

## Installation

### HACS (Recommended)

1. Make sure [HACS](https://hacs.xyz/) is installed in your Home Assistant instance
2. Add this repository as a custom repository in HACS:
   - Go to HACS → Integrations → ⋮ (top right) → Custom repositories
   - Enter `https://github.com/Scarfsail/hass-door-window-watcher` as the repository URL
   - Select "Integration" as the category
   - Click "Add"
3. Click on "+ Explore & Add Repositories" and search for "Door Window Watcher"
4. Click "Install" on the Door Window Watcher integration
5. Restart Home Assistant
6. Add the integration via the config flow (Settings → Devices & Services → Add Integration). The card's
   Lovelace resource is registered automatically on setup.

### Manual Installation

1. Copy the `door_window_watcher` directory from this repository to your Home Assistant's `custom_components` directory
2. Restart Home Assistant

### Using the Card

Add the card to your Lovelace dashboard with your preferred settings:
```yaml
type: custom:door-window-watcher-card
title: Door & Window Status
entity: sensor.door_window_status
# ...other configuration options...
```

### Migrating from the standalone card

If you previously installed `hass-door-window-watcher-card` as a separate HACS Lovelace item:

1. Remove the old `hass-door-window-watcher-card` HACS repository/entry.
2. Remove any manually-added Lovelace resource pointing at
   `/hacsfiles/hass-door-window-watcher-card/...` or `/local/...` — otherwise you'll end up with a duplicate
   resource.
3. Install this integration as described above. The card element name
   (`custom:door-window-watcher-card`) is unchanged, so existing dashboard cards keep working with no edits.

Note: automatic Lovelace resource registration only works with UI (storage) mode dashboards. If your
dashboard is configured via YAML mode, add the resource manually instead.

## Configuration

This integration is configured entirely through a dedicated UI available in the Home Assistant sidebar. Configuration through configuration.yaml is not supported.

### Using the Dedicated UI

1. After installation, you'll find "Door Window Watcher" in your Home Assistant sidebar
2. Click on it to access the configuration interface
3. From there, you can:
   - Add and configure door/window sensors to monitor
   - Set up temperature sensors for smart duration calculation
   - Configure fixed durations if preferred
   - Enable/disable notifications
   - Adjust monitoring parameters


## Temperature-based Duration Calculation

The integration calculates how long a door/window can stay open based on:
- The difference between indoor and outdoor temperatures
- User-defined parameters for acceptable heat loss


This smart calculation helps save energy while allowing reasonable ventilation time.

## Entities

This integration creates binary sensor entities for each monitored door/window:

| Entity | Description |
|--------|-------------|
| `binary_sensor.door_window_watcher_alert` | Tracks the open door/windows, duration, and provides notification capabilities |

The binary sensor includes various attributes that show:
- List of monitored and currently open door / windows
- Duration in current state
- Calculated allowed open time
- Notification status

You can access all these details through the entity's attributes in automations, scripts, and the Lovelace UI.

## Troubleshooting

If you experience any issues:

1. Check that your binary sensors are working correctly
2. Verify that temperature sensors provide accurate readings
3. Check Home Assistant logs for any error messages
4. Open an issue on GitHub if problems persist

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.