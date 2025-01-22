from abc import ABC, abstractmethod
from datetime import datetime, timedelta
import logging

from homeassistant.core import HomeAssistant
from homeassistant.helpers.event import async_track_time_interval

from ..watchers_config_store import ConfigChangeObserver, WatchersConfigStore
from .watcher_group_processor_base import OpenSensorInfo, WatcherGroupProcessorBase
from .watcher_group_processor_fixed import WatcherGroupProcessorFixed
from .watcher_group_processor_temperature import WatcherGroupProcessorTemperature

_LOGGER = logging.getLogger(__name__)


class WatchersAlertSensorBase(ABC):
    @abstractmethod
    def update_state(self, open_sensors: list[OpenSensorInfo]): ...


class WatchersProcessor(ConfigChangeObserver):
    def __init__(self, hass: HomeAssistant, store: WatchersConfigStore):
        self._hass = hass
        self._processors: list[WatcherGroupProcessorBase] = []
        self._store = store

        self._unsubscribe_timer = async_track_time_interval(
            hass, self._handle_timer_tick, timedelta(seconds=1)
        )
        self._binary_alert_sensor = None
        self._store.add_observer(self)

    def get_open_sensors(self, only_alerts: bool = False) -> list[OpenSensorInfo]:
        """Get all open sensors."""
        open_sensors = []
        for processor in self._processors:
            open_sensors.extend(processor.get_open_sensors(only_alerts))
        return open_sensors

    def register_binary_alert_sensor(self, sensor: WatchersAlertSensorBase) -> None:
        self._binary_alert_sensor = sensor

    def adjust_remaining_seconds(
        self, group_id: int, entity_id: str, seconds: int
    ) -> None:
        """Adjust remaining time for an open sensor in a specific group."""
        if 0 <= group_id < len(self._processors):
            self._processors[group_id].adjust_remaining_seconds(entity_id, seconds)
            if self._binary_alert_sensor:
                self._binary_alert_sensor.update_state(self.get_open_sensors())

    def dismiss_alert(self, group_id: int, entity_id: str) -> None:
        """Dismiss alert for an open sensor in a specific group."""
        if 0 <= group_id < len(self._processors):
            self._processors[group_id].dismiss_alert(entity_id)
            if self._binary_alert_sensor:
                self._binary_alert_sensor.update_state(self.get_open_sensors())

    async def dispose(self) -> None:
        """Cleanup all processors."""
        self._unsubscribe_timer()
        self._store.remove_observer(self)
        self._dispose_processors()

    def on_config_changed(self) -> None:
        """Handle config change."""
        self._load_config()

    def _load_config(self) -> None:
        config = self._store.config
        self._dispose_processors()

        for group in config["groups"]:
            if group["type"] == "fixed":
                processor = WatcherGroupProcessorFixed(self._hass, group)
            elif group["type"] == "temperature":
                processor = WatcherGroupProcessorTemperature(self._hass, group)
            else:
                _LOGGER.error(
                    "Unknown group type '%s' for group '%s'",
                    group["type"],
                    group["title"],
                )
                continue

            self._processors.append(processor)

    def _dispose_processors(self) -> None:
        """Cleanup all processors."""
        for processor in self._processors:
            processor.dispose()
        self._processors.clear()

    async def _handle_timer_tick(self, _now: datetime) -> None:
        """Handle timer tick for all processors."""
        changed = False
        for processor in self._processors:
            changed |= processor.update_open_sensors()

        if changed and self._binary_alert_sensor:
            self._binary_alert_sensor.update_state(self.get_open_sensors())
