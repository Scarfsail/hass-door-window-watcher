from datetime import datetime, timedelta
import logging

from homeassistant.core import HomeAssistant
from homeassistant.helpers.event import async_track_time_interval

from ..watchers_config_store import ConfigChangeObserver, WatchersConfigStore
from .watcher_group_processor_base import OpenSensorInfo, WatcherGroupProcessorBase
from .watcher_group_processor_fixed import WatcherGroupProcessorFixed
from .watcher_group_processor_temperature import WatcherGroupProcessorTemperature

_LOGGER = logging.getLogger(__name__)


class WatchersProcessor(ConfigChangeObserver):
    def __init__(self, hass: HomeAssistant, store: WatchersConfigStore):
        self._hass = hass
        self._processors: list[WatcherGroupProcessorBase] = []
        self._store = store

        self._unsubscribe_timer = async_track_time_interval(
            hass, self._handle_timer_tick, timedelta(seconds=1)
        )
        self._store.add_observer(self)

    def get_open_sensors(self, only_alarms: bool = False) -> list[OpenSensorInfo]:
        """Get all open sensors."""
        open_sensors = []
        for processor in self._processors:
            open_sensors.extend(processor.get_open_sensors(only_alarms))
        return open_sensors

    def adjust_remaining_seconds(
        self, group_id: int, entity_id: str, seconds: int
    ) -> None:
        """Adjust remaining time for an open sensor in a specific group."""
        if 0 <= group_id < len(self._processors):
            self._processors[group_id].adjust_remaining_seconds(entity_id, seconds)

    def dismiss_alarm(self, group_id: int, entity_id: str) -> None:
        """Dismiss alarm for an open sensor in a specific group."""
        if 0 <= group_id < len(self._processors):
            self._processors[group_id].dismiss_alarm(entity_id)

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
        for processor in self._processors:
            processor.update_open_sensors()
