from collections.abc import Callable
from datetime import timedelta

from homeassistant.core import HomeAssistant

from ..models import WatcherGroupFixed
from .watcher_group_processor_base import WatcherGroupProcessorBase


class WatcherGroupProcessorFixed(WatcherGroupProcessorBase):
    def __init__(
        self, hass: HomeAssistant, group: WatcherGroupFixed, state_changed: Callable
    ):
        super().__init__(hass, group, state_changed)
        self._group: WatcherGroupFixed = group

    def _get_max_open_time(self) -> timedelta:
        return timedelta(seconds=self._group["maxDurationSeconds"])
