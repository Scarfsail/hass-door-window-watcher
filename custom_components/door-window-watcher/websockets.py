import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.websocket_api import async_register_command, decorators
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN
from .store import DoorWindowWatcherData


@callback
def ws_get_config(hass, connection, msg):
    """Return the stored config as JSON."""
    store: DoorWindowWatcherData = hass.data[DOMAIN]["data_store"]
    connection.send_result(msg["id"], store.data)


@callback
def ws_save_config(hass, connection, msg):
    """Save new config to the store."""
    store: DoorWindowWatcherData = hass.data[DOMAIN]["data_store"]
    store.data = msg["config"]
    hass.async_create_task(store.async_save())

    connection.send_result(msg["id"], {"success": True})


async def async_register_websocket_commands(hass: HomeAssistant):
    """Register WebSocket commands for this integration."""
    async_register_command(
        hass,
        "dww/save_config",
        ws_save_config,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend(
            {
                vol.Required("type"): "dww/save_config",
                vol.Required("config"): dict,
            }
        ),
    )
    async_register_command(
        hass,
        "dww/get_config",
        ws_get_config,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend(
            {
                vol.Required("type"): "dww/get_config",
            }
        ),
    )
