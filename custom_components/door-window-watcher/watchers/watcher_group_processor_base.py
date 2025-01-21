from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from signal import alarm

import attr
from sqlalchemy import Boolean

from homeassistant.core import Event, HomeAssistant, State
from homeassistant.helpers.event import (
    async_track_state_change_event,
    async_track_time_interval,
)

from ..models import WatcherGroup


@attr.s(slots=True)  # removed frozen=True
class OpenSensorInfo:
    entity_id: str = attr.ib()
    opened_at: datetime = attr.ib()
    remaining_seconds: int = attr.ib(default=0)
    adjusted_seconds: int = attr.ib(default=0)
    alarm_triggered: bool = attr.ib(default=False)


class WatcherGroupProcessorBase(ABC):
    def __init__(self, hass: HomeAssistant, group: WatcherGroup):
        self.hass = hass
        self.group = group
        self.open_sensors: dict[str, OpenSensorInfo] = {}

        self._unsubscribe_state = async_track_state_change_event(
            hass, group["entities"], self._handle_state_change
        )

    def dispose(self) -> None:
        """Cleanup resources."""
        self._unsubscribe_state()
        self.open_sensors.clear()

    def update_open_sensors(self) -> Boolean:
        """Update remaining time for open sensors."""
        changed = False
        for sensor in self.open_sensors.values():
            changed = self._calculate_remaining_seconds(sensor)

        return changed

    def adjust_remaining_seconds(self, entity_id: str, seconds: int) -> None:
        """Adjust remaining time for an open sensor."""
        if entity_id not in self.open_sensors:
            return

        sensor = self.open_sensors[entity_id]
        sensor.adjusted_seconds += seconds
        self._calculate_remaining_seconds(sensor)

    def dismiss_alarm(self, entity_id: str) -> None:
        """Dismiss alarm for an open sensor."""
        if entity_id not in self.open_sensors:
            return

        sensor = self.open_sensors[entity_id]
        sensor.alarm_triggered = False

    def _calculate_remaining_seconds(self, sensor: OpenSensorInfo) -> Boolean:
        prev_remaining_seconds = sensor.remaining_seconds

        max_time = self._get_max_open_time()

        if max_time == 0 and sensor.adjusted_seconds == 0:
            sensor.remaining_seconds = 0
            sensor.alarm_triggered = False
        else:
            elapsed = datetime.now() - sensor.opened_at
            remaining = (
                max_time.total_seconds()
                - elapsed.total_seconds()
                + sensor.adjusted_seconds
            )
            sensor.remaining_seconds = max(0, int(remaining))

            if (
                sensor.remaining_seconds == 0
                and prev_remaining_seconds > 0
                and not sensor.alarm_triggered
            ):
                sensor.alarm_triggered = True

        return prev_remaining_seconds != sensor.remaining_seconds

    async def _handle_state_change(self, event: Event) -> None:
        entity_id: str = event.data.get("entity_id")
        new_state: State | None = event.data.get("new_state")

        if new_state is None:
            return

        if new_state.state == "on":
            if entity_id not in self.open_sensors:
                sensor = OpenSensorInfo(entity_id=entity_id, opened_at=datetime.now())
                self._calculate_remaining_seconds(sensor)
                self.open_sensors[entity_id] = sensor

        elif entity_id in self.open_sensors:
            del self.open_sensors[entity_id]

    @abstractmethod
    def _get_max_open_time(self) -> timedelta:
        """Get the duration before an alert should be triggered."""
