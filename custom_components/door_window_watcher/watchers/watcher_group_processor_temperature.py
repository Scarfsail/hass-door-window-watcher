from datetime import timedelta

from homeassistant.core import HomeAssistant

from ..models import WatcherGroupTemperature
from .watcher_group_processor_base import WatcherGroupProcessorBase


class WatcherGroupProcessorTemperature(WatcherGroupProcessorBase):
    def __init__(self, hass: HomeAssistant, group: WatcherGroupTemperature):
        super().__init__(hass, group)
        self._group = group

    def _get_outdoor_temperature(self) -> float | None:
        """Get the current outdoor temperature."""
        state = self.hass.states.get(self._group["outdoorTemperatureEntity"])
        return float(state.state) if state else None

    def _get_indoor_temperature(self) -> float | None:
        """Get the current indoor temperature."""
        state = self.hass.states.get(self._group["indoorTemperatureEntity"])
        return float(state.state) if state else None

    def _get_max_open_time(self) -> timedelta | None:
        outdoor_temp = self._get_outdoor_temperature()
        indoor_temp = self._get_indoor_temperature()

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
