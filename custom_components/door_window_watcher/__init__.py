import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .panel import async_register_panel, async_unregister_panel
from .services import register_services
from .watchers.watchers_processor import WatchersProcessor
from .watchers_config_store import WatchersConfigStore
from .websockets import async_register_websocket_commands

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry):
    """Set up integration from a config entry."""

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {}

    # Create and load the data store
    data_store = WatchersConfigStore(hass)

    hass.data[DOMAIN]["data_store"] = data_store
    hass.data[DOMAIN]["watchers_processor"] = WatchersProcessor(hass, data_store)
    await data_store.async_load()

    # Register the UI panel
    await async_register_panel(hass)

    # Websocket support
    await async_register_websocket_commands(hass)
    register_services(hass)

    # Forward setup for the sensor platform
    await hass.config_entries.async_forward_entry_setups(
        entry,
        ["binary_sensor"],
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry):
    """Unload a config entry."""
    # client = hass.data[DOMAIN][entry.entry_id]["client"]
    # client.stop()
    async_unregister_panel(hass)
    return True
