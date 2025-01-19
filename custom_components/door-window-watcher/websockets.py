import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.websocket_api import async_register_command, decorators
from homeassistant.core import HomeAssistant, callback


@callback
def websocket_get_hello_world(hass, connection, msg):
    response = {"message": "Hello from Door Window Watcher! :-)"}

    # Send the response back to the frontend
    connection.send_result(msg["id"], response)


async def async_register_websocket_commands(hass: HomeAssistant):
    """Register WebSocket commands for this integration."""

    async_register_command(
        hass,
        "dww/hello_world",
        websocket_get_hello_world,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend(
            {vol.Required("type"): "dww/hello_world"}
        ),
    )
