export type WatcherGroup = WatcherGroupFixed | WatcherGroupTemperature;

export interface WatcherGroupBase {
    type: "fixed" | "temperature"
    title:string
    entities: string[]
}

export interface WatcherGroupFixed extends WatcherGroupBase {
    type: "fixed"
    maxDurationSeconds: number
}


export interface WatcherGroupTemperature extends WatcherGroupBase {
    type: "temperature"
    temperatureDiff: number
    timeDiff: number
    maxTemperture: number
}