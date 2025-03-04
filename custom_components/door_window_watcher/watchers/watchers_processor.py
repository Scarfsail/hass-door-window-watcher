from abc import ABC, abstractmethod
from datetime import datetime, timedelta
import logging

from homeassistant.core import HomeAssistant, callback
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

    def adjust_remaining_seconds(self, entity_id: str, seconds: int) -> None:
        """Adjust remaining time for an open sensor in a specific group."""

        self._get_processor_with_entity(entity_id).adjust_remaining_seconds(
            entity_id, seconds
        )
        self._state_changed()

    def dismiss_alert(self, entity_id: str) -> None:
        """Dismiss alert for an open sensor in a specific group."""
        self._get_processor_with_entity(entity_id).dismiss_alert(entity_id)
        self._state_changed()

    def _get_processor_with_entity(self, entity_id: str) -> WatcherGroupProcessorBase:
        """Find an entity by its entity_id."""
        for processor in self._processors:
            if entity_id in processor.group["entities"]:
                return processor

        raise ValueError(f"Entity '{entity_id}' not found in any watcher group")

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
        if not config or "groups" not in config:
            return

        for group in config["groups"]:
            if group["type"] == "fixed":
                processor = WatcherGroupProcessorFixed(
                    self._hass, group, self._state_changed
                )
            elif group["type"] == "temperature":
                processor = WatcherGroupProcessorTemperature(
                    self._hass, group, self._state_changed
                )
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

        if changed:
            self._state_changed()

    @callback
    def _state_changed(self) -> None:
        if self._binary_alert_sensor:
            self._binary_alert_sensor.update_state(self.get_open_sensors())
