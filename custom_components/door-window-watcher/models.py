from typing import Literal, TypedDict


class WatcherGroupBase(TypedDict, total=False):
    type: str
    title: str
    entities: list[str]


class WatcherGroupFixed(WatcherGroupBase):
    type: Literal["fixed"]
    maxDurationSeconds: int


class WatcherGroupTemperature(WatcherGroupBase):
    type: Literal["temperature"]
    outdoorTemperatureEntity: str
    indoorTemperatureEntity: str
    temperatureDiff: float
    timeDiff: int
    maxTemperture: float


WatcherGroup = WatcherGroupFixed | WatcherGroupTemperature


class WatchersConfig(TypedDict):
    groups: list[WatcherGroup]
