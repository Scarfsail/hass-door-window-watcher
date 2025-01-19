import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .panel import async_register_panel, async_unregister_panel
from .websockets import async_register_websocket_commands

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry):
    """Set up integration from a config entry."""

    # hub_connection.on("iosChanged", lambda data: process_iosChanged(hass, data))

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {}

    # hass.data[DOMAIN][entry.entry_id]["client"] = client

    # Forward setup for the sensor platform
    # await hass.config_entries.async_forward_entry_setups(
    #    entry,
    #    ["sensor", "binary_sensor", "button", "switch", "light", "cover", "number"],
    # )

    # entry.async_on_unload(
    #    # only start after all platforms have had a chance to subscribe
    #    client.connect()
    # )

    await async_register_panel(hass)

    # Websocket support
    await async_register_websocket_commands(hass)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry):
    """Unload a config entry."""
    # client = hass.data[DOMAIN][entry.entry_id]["client"]
    # client.stop()
    async_unregister_panel(hass)
    return True
