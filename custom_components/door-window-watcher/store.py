from homeassistant.helpers import storage

DATA_STORE_KEY = "door_window_watcher_store"
STORAGE_VERSION = 1
STORAGE_KEY = "door_window_watcher"


class DoorWindowWatcherData:
    """Class to handle persistent storage of the integration's JSON config."""

    def __init__(self, hass):
        self.hass = hass
        self._store = storage.Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.data = None  # Will hold the loaded JSON dict

    async def async_load(self):
        """Load data from the store. If nothing stored, default to an empty dict."""
        stored = await self._store.async_load()
        if stored is None:
            stored = {}
        self.data = stored

    async def async_save(self):
        """Save current data to the store."""
        await self._store.async_save(self.data)
