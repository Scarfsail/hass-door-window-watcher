import attr
from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import run_callback_threadsafe

from .const import DOMAIN
from .watchers.watcher_group_processor_base import OpenSensorInfo
from .watchers.watchers_processor import WatchersAlertSensorBase, WatchersProcessor


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
):
    """Set up CentralDvc sensors from a config entry."""
    processor: WatchersProcessor = hass.data[DOMAIN]["watchers_processor"]
    alert_sensor = WatchersAlertSensor(hass)
    processor.register_binary_alert_sensor(alert_sensor)

    async_add_entities([alert_sensor])


class WatchersAlertSensor(BinarySensorEntity, WatchersAlertSensorBase):
    def __init__(self, hass: HomeAssistant):
        """Initialize the sensor."""
        self._hass = hass
        self._state = "off"
        self._open_sensors = []

    def update_state(self, open_sensors: list[OpenSensorInfo]):
        self._state = (
            "on" if any(sensor.alert_triggered for sensor in open_sensors) else "off"
        )
        self._open_sensors = [attr.asdict(sensor) for sensor in open_sensors]
        self.async_write_ha_state()

    @property
    def extra_state_attributes(self):
        """Return the state attributes."""

        return {
            "open_sensors": self._open_sensors,
        }

    @property
    def state(self):
        """Return the state of the sensor."""
        return self._state

    @property
    def name(self):
        """Return the name of the sensor."""
        return "Door Window Watcher Alert"

    @property
    def suggested_object_id(self):
        """Return the suggested object id."""
        return "door_window_watcher_alert"

    @property
    def unique_id(self):
        """Return a unique ID for the sensor."""
        return "door_window_watcher_alert"

    @property
    def available(self):
        """Return True if the sensor is available."""
        return True
