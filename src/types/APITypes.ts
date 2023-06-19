//
// API responses
//

export type APIResponse = BlocksAPIResponse | TrainsAPIResponse | SignalsAPIResponse | NetworkAPIResponse;

export interface NetworkAPIResponse {
  tracks: TrackSegment[];
  portals: TrackPortal[];
  stations: TrainStation[];
}

export interface BlocksAPIResponse {
  blocks: TrackBlock[];
}

export interface TrainsAPIResponse {
  trains: Train[];
}

export interface SignalsAPIResponse {
  signals: TrainSignalRecord[];
}

//
// Sepcific objects
//

// Portals
export interface TrackPortal {
  from: TrainLocation;
  to: TrainLocation;
}

// Stations
export interface TrainStation extends TrainObject, TrainLocation {
  name: string;
  angle: number;
  assembling: boolean;
}

// Signals
export interface TrainSignalRecord extends TrainObject, TrainLocation {
  forward: TrainSignal;
  reverse: TrainSignal;
}

export interface TrainSignal {
  type: "ENTRY_SIGNAL";
  state: "GREEN" | "YELLOW" | "RED";
  angle: number;
  block: string;
}

// Blocks
export interface TrackBlock extends TrainObject {
  occupied: boolean;
  reserved: boolean;
  segments: TrackSegment[];
}

export interface TrackSegment {
  dimension: string;
  path: TrainPoint[];
}

// Trains
export interface Train extends TrainObject {
  name: string;
  owner: null;
  cars: TrainCar[];
  backwards: boolean;
  stopped: boolean;
}

export interface TrainCar {
  id: number;
  leading: TrainLocation;
  trailing: TrainLocation;
}

//
// Common interfaces
//

export interface TrainObject {
  id: string;
}

export interface TrainLocation {
  dimension: string;
  location: TrainPoint;
}

export interface TrainPoint {
  x: number;
  y: number;
  z: number;
}
