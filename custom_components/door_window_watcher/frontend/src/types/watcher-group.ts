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
    outdoorTemperatureEntity: string
    indoorTemperatureEntity: string    
    temperatureDiff: number
    timeDiff: number
    maxTemperture: number
}