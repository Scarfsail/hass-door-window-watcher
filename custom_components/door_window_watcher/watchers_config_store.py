from typing import Protocol

import homeassistant
from homeassistant.helpers import storage

from .models import WatcherGroupFixed, WatcherGroupTemperature, WatchersConfig

DATA_STORE_KEY = "door_window_watcher_store"
STORAGE_VERSION = 1
STORAGE_KEY = "door_window_watcher"


class ConfigChangeObserver(Protocol):
    """Observer interface for config changes."""

    def on_config_changed(self) -> None:
        """Handle config change event."""


class ConfigChangeObservable:
    def __init__(self):
        self._observers: set[ConfigChangeObserver] = set()

    def add_observer(self, observer: ConfigChangeObserver) -> None:
        """Add an observer."""
        self._observers.add(observer)

    def remove_observer(self, observer: ConfigChangeObserver) -> None:
        """Remove an observer."""
        self._observers.discard(observer)

    def _notify_observers(self) -> None:
        """Notify all observers of config change."""
        for observer in self._observers:
            observer.on_config_changed()


class WatchersConfigStore(ConfigChangeObservable):
    """Class to handle persistent storage of the integration's JSON config."""

    def __init__(self, hass: homeassistant):
        super().__init__()
        self.hass = hass
        self._store = storage.Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.config: WatchersConfig = None

    async def async_load(self):
        """Load data from the store. If nothing stored, default to an empty dict."""
        stored = await self._store.async_load()
        if stored is None:
            stored = {}
        self.config = stored
        self._notify_observers()

    async def async_save(self):
        """Save current data to the store."""
        await self._store.async_save(self.config)
        self._notify_observers()
