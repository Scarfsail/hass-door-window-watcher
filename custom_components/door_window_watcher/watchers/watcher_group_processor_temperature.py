from collections.abc import Callable
from datetime import timedelta

from homeassistant.core import HomeAssistant

from ..models import WatcherGroupTemperature
from .watcher_group_processor_base import WatcherGroupProcessorBase


class WatcherGroupProcessorTemperature(WatcherGroupProcessorBase):
    def __init__(
        self,
        hass: HomeAssistant,
        group: WatcherGroupTemperature,
        state_changed: Callable,
    ):
        super().__init__(hass, group, state_changed)
        self._group = group

    def _get_entity_state(self, entity_id) -> float | None:
        """Get the current indoor temperature."""
        state = self.hass.states.get(self._group[entity_id])
        if not state:
            return None

        return float(state.state) if state.state != "unavailable" else None

    def _get_max_open_time(self) -> timedelta | None:
        outdoor_temp = self._get_entity_state("outdoorTemperatureEntity")
        indoor_temp = self._get_entity_state("indoorTemperatureEntity")

        if outdoor_temp is None or indoor_temp is None:
            return 0
        max_temperature = float(self._group["maxTemperture"])
        if outdoor_temp >= max_temperature:
            return 0

        temp_diff = indoor_temp - outdoor_temp
        if temp_diff <= 0:
            return 0

        set_temp_diff = float(self._group["temperatureDiff"])
        time_diff = float(self._group["timeDiff"])
        ratio = set_temp_diff / temp_diff
        return timedelta(seconds=int(time_diff * ratio))
