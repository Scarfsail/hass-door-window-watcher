from datetime import timedelta
import attr
import voluptuous as vol

from homeassistant.core import HomeAssistant, SupportsResponse
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.event import run_callback_threadsafe

from .const import DOMAIN
from .watchers.watchers_processor import WatchersProcessor


def register_services(hass: HomeAssistant):
    """Register integration-level services."""

    def get_open_sensors(call):
        """Handle the service call."""
        only_alerts = call.data.get("only_alerts", False)
        processor: WatchersProcessor = hass.data[DOMAIN]["watchers_processor"]
        sensors = processor.get_open_sensors(only_alerts)
        serialized = {"open_sensors:": [attr.asdict(sensor) for sensor in sensors]}
        return serialized

    def adjust_remaining_seconds(call):
        """Handle the service call."""
        processor: WatchersProcessor = hass.data[DOMAIN]["watchers_processor"]

        def proceed():
            processor.adjust_remaining_seconds(
                call.data["entity_id"],
                int(call.data["seconds"]),
            )

        run_callback_threadsafe(hass.loop, proceed)

    def dismiss_alert(call):
        """Handle the service call."""
        processor: WatchersProcessor = hass.data[DOMAIN]["watchers_processor"]

        def proceed():
            processor.dismiss_alert(call.data["entity_id"])

        run_callback_threadsafe(hass.loop, proceed)

    hass.services.async_register(
        DOMAIN,
        "get_open_sensors",
        get_open_sensors,
        schema=vol.Schema({vol.Optional("only_alerts"): cv.boolean}),
        supports_response=SupportsResponse.ONLY,
    )

    hass.services.async_register(
        DOMAIN,
        "adjust_remaining_seconds",
        adjust_remaining_seconds,
        schema=vol.Schema(
            {
                vol.Required("entity_id"): cv.entity_id,
                vol.Required("seconds"): cv.Number,
            }
        ),
        supports_response=SupportsResponse.NONE,
    )

    hass.services.async_register(
        DOMAIN,
        "dismiss_alert",
        dismiss_alert,
        schema=vol.Schema(
            {
                vol.Required("entity_id"): cv.entity_id,
            }
        ),
        supports_response=SupportsResponse.NONE,
    )
