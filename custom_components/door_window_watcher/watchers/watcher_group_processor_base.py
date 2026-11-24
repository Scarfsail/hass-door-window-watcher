from abc import ABC, abstractmethod
from collections.abc import Callable
from datetime import UTC, datetime, timedelta

import attr

from homeassistant.core import Event, HomeAssistant, State
from homeassistant.helpers.event import async_track_state_change_event

from ..models import WatcherGroup


@attr.s(slots=True)  # removed frozen=True
class OpenSensorInfo:
    entity_id: str = attr.ib()
    opened_at: datetime = attr.ib()
    alert_at: datetime | None = attr.ib(default=None)
    adjusted_seconds: int = attr.ib(default=0)
    alert_triggered: bool = attr.ib(default=False)
    dismissed: bool = attr.ib(default=False)


@attr.s(slots=True)
class SensorInfo:
    """Sensor info for all configured sensors (open and closed)."""

    entity_id: str = attr.ib()
    state: str = attr.ib()
    last_changed: str = attr.ib()
    opened_at: str | None = attr.ib(default=None)
    alert_at: str | None = attr.ib(default=None)
    adjusted_seconds: int = attr.ib(default=0)
    alert_triggered: bool = attr.ib(default=False)
    dismissed: bool = attr.ib(default=False)


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
        # Entities whose limit had not yet expired at the last recalculation.
        self._counting_down: set[str] = set()

        self._unsubscribe_state = async_track_state_change_event(
            hass, group["entities"], self._handle_state_change
        )

    def dispose(self) -> None:
        """Cleanup resources."""
        self._unsubscribe_state()
        self.open_sensors.clear()
        self._counting_down.clear()

    def get_open_sensors(self, only_alerts: bool = False) -> list[OpenSensorInfo]:
        """Get all open sensors."""
        sensors = self.open_sensors.values()
        return filter(lambda x: x.alert_triggered, sensors) if only_alerts else sensors

    def get_all_sensors(self, only_open: bool = False) -> list[SensorInfo]:
        """Get all configured sensors with their current state."""
        sensors: list[SensorInfo] = []
        for entity_id in self.group["entities"]:
            state_obj = self.hass.states.get(entity_id)
            if not state_obj:
                continue

            is_open = entity_id in self.open_sensors

            if only_open and not is_open:
                continue

            if is_open:
                open_info = self.open_sensors[entity_id]
                sensor = SensorInfo(
                    entity_id=entity_id,
                    state=self.group["sensor_open_state"],
                    last_changed=state_obj.last_changed.isoformat(),
                    opened_at=open_info.opened_at.isoformat(),
                    alert_at=open_info.alert_at.isoformat()
                    if open_info.alert_at
                    else None,
                    adjusted_seconds=open_info.adjusted_seconds,
                    alert_triggered=open_info.alert_triggered,
                    dismissed=open_info.dismissed,
                )
            else:
                sensor = SensorInfo(
                    entity_id=entity_id,
                    state=state_obj.state,
                    last_changed=state_obj.last_changed.isoformat(),
                )

            sensors.append(sensor)

        return sensors

    def update_open_sensors(self) -> bool:
        """Recalculate open sensors; return True when any of them visibly changed."""
        changed = False
        for sensor in self.open_sensors.values():
            changed |= self._update_alert(sensor)

        return changed

    def adjust_remaining_seconds(self, entity_id: str, seconds: int) -> None:
        """Adjust remaining time for an open sensor."""
        if entity_id not in self.open_sensors:
            return

        sensor = self.open_sensors[entity_id]
        max_time_seconds = self._get_max_open_time_seconds()
        now = datetime.now(UTC)

        if entity_id not in self._counting_down:
            # When no time remains, calculate time since alert was triggered
            elapsed = now - sensor.opened_at
            time_since_alert = elapsed.total_seconds() - max_time_seconds
            sensor.adjusted_seconds = int(time_since_alert + seconds)
        else:
            # When there's remaining time, simply add to adjusted_seconds
            sensor.adjusted_seconds += seconds

        sensor.dismissed = False
        self._update_alert(sensor)

    def dismiss_alert(self, entity_id: str) -> None:
        """Dismiss alert for an open sensor."""
        if entity_id not in self.open_sensors:
            return

        sensor = self.open_sensors[entity_id]

        sensor.dismissed = True
        sensor.alert_at = None
        sensor.alert_triggered = False
        self._counting_down.discard(entity_id)

    def _update_alert(self, sensor: OpenSensorInfo) -> bool:
        """Recalculate alert_at and alert_triggered; return True when either changed."""
        previous = (sensor.alert_at, sensor.alert_triggered)
        was_counting_down = sensor.entity_id in self._counting_down

        max_time_seconds = self._get_max_open_time_seconds()

        if sensor.dismissed or (max_time_seconds == 0 and sensor.adjusted_seconds == 0):
            sensor.alert_at = None
            sensor.alert_triggered = False
            self._counting_down.discard(sensor.entity_id)
        else:
            sensor.alert_at = sensor.opened_at + timedelta(
                seconds=max_time_seconds + sensor.adjusted_seconds
            )
            remaining = (sensor.alert_at - datetime.now(UTC)).total_seconds()
            counting_down = int(remaining) > 0

            # Fire only when the limit expires while counting down; clear when
            # time is added back. An already-expired limit never fires.
            if counting_down and not was_counting_down:
                sensor.alert_triggered = False
            elif was_counting_down and not counting_down:
                sensor.alert_triggered = True

            if counting_down:
                self._counting_down.add(sensor.entity_id)
            else:
                self._counting_down.discard(sensor.entity_id)

        return previous != (sensor.alert_at, sensor.alert_triggered)

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

                self._update_alert(sensor)
                self.open_sensors[entity_id] = sensor
                self.state_changed()

        elif entity_id in self.open_sensors:
            del self.open_sensors[entity_id]
            self._counting_down.discard(entity_id)
            self.state_changed()

    @abstractmethod
    def _get_max_open_time_seconds(self) -> int:
        """Get the duration before an alert should be triggered."""
