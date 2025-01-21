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

        if outdoor_temp >= self._group["maxTemperture"]:
            return 0

        temp_diff = indoor_temp - outdoor_temp
        if temp_diff <= 0:
            return 0

        ratio = self._group["temperatureDiff"] / temp_diff
        return timedelta(seconds=int(self._group["timeDiff"] * ratio))
