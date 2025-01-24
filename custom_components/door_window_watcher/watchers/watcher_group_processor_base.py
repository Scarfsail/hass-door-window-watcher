from abc import ABC, abstractmethod
from collections.abc import Callable
from datetime import UTC, datetime, timedelta

import attr
from sqlalchemy import Boolean

from homeassistant.core import Event, HomeAssistant, State
from homeassistant.helpers.event import async_track_state_change_event

from ..models import WatcherGroup


@attr.s(slots=True)  # removed frozen=True
class OpenSensorInfo:
    entity_id: str = attr.ib()
    opened_at: datetime = attr.ib()
    remaining_seconds: int = attr.ib(default=0)
    adjusted_seconds: int = attr.ib(default=0)
    alert_triggered: bool = attr.ib(default=False)


class WatcherGroupProcessorBase(ABC):
    def __init__(
        self,
        hass: HomeAssistant,
        group: WatcherGroup,
        state_changed: Callable,
    ) -> None:
        self.hass = hass
        self.group = group
        self.open_sensors: dict[str, OpenSensorInfo] = {}
        self.state_changed = state_changed

        self._unsubscribe_state = async_track_state_change_event(
            hass, group["entities"], self._handle_state_change
        )

    def dispose(self) -> None:
        """Cleanup resources."""
        self._unsubscribe_state()
        self.open_sensors.clear()

    def get_open_sensors(self, only_alerts: bool = False) -> list[OpenSensorInfo]:
        """Get all open sensors."""
        sensors = self.open_sensors.values()
        return filter(lambda x: x.alert_triggered, sensors) if only_alerts else sensors

    def update_open_sensors(self) -> Boolean:
        """Update remaining time for open sensors."""
        changed = False
        for sensor in self.open_sensors.values():
            changed |= self._calculate_remaining_seconds(sensor)

        return changed

    def adjust_remaining_seconds(self, entity_id: str, seconds: int) -> None:
        """Adjust remaining time for an open sensor."""
        if entity_id not in self.open_sensors:
            return

        sensor = self.open_sensors[entity_id]
        max_time = self._get_max_open_time()

        if sensor.remaining_seconds == 0:
            # When remaining time is zero, calculate time since alert was triggered
            elapsed = datetime.now(UTC) - sensor.opened_at
            time_since_alert = elapsed.total_seconds() - max_time.total_seconds()
            sensor.adjusted_seconds = int(time_since_alert + seconds)
        else:
            # When there's remaining time, simply add to adjusted_seconds
            sensor.adjusted_seconds += seconds

        self._calculate_remaining_seconds(sensor)

    def dismiss_alert(self, entity_id: str) -> None:
        """Dismiss alert for an open sensor."""
        if entity_id not in self.open_sensors:
            return

        sensor = self.open_sensors[entity_id]

        sensor.adjusted_seconds = sensor.remaining_seconds * -1
        sensor.remaining_seconds = 0
        sensor.alert_triggered = False

    def _calculate_remaining_seconds(self, sensor: OpenSensorInfo) -> Boolean:
        prev_remaining_seconds = sensor.remaining_seconds

        max_time = self._get_max_open_time()

        if max_time == 0 and sensor.adjusted_seconds == 0:
            sensor.remaining_seconds = 0
            sensor.alert_triggered = False
        else:
            elapsed = datetime.now(UTC) - sensor.opened_at
            remaining = (
                max_time.total_seconds()
                - elapsed.total_seconds()
                + sensor.adjusted_seconds
            )
            sensor.remaining_seconds = max(0, int(remaining))

            if (
                prev_remaining_seconds == 0
                and sensor.remaining_seconds > 0
                and sensor.alert_triggered
            ):
                sensor.alert_triggered = False

            if (
                sensor.remaining_seconds == 0
                and prev_remaining_seconds > 0
                and not sensor.alert_triggered
            ):
                sensor.alert_triggered = True

        return prev_remaining_seconds != sensor.remaining_seconds

    async def _handle_state_change(self, event: Event) -> None:
        entity_id: str = event.data.get("entity_id")
        new_state: State | None = event.data.get("new_state")

        if new_state is None:
            return

        if new_state.state == self.group["sensor_open_state"]:
            if entity_id not in self.open_sensors:
                sensor = OpenSensorInfo(
                    entity_id=entity_id, opened_at=datetime.now(UTC)
                )

                self._calculate_remaining_seconds(sensor)
                self.open_sensors[entity_id] = sensor
                self.state_changed()

        elif entity_id in self.open_sensors:
            del self.open_sensors[entity_id]
            self.state_changed()

    @abstractmethod
    def _get_max_open_time(self) -> timedelta:
        """Get the duration before an alert should be triggered."""
