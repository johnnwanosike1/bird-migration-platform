export interface Switchfilter {
    tag: String,
    max_speed: Number,
    min_duration: Number,
    radius: Number
}

export type StopoverPoint = {
    name: string
    code: string
    address: string
    entries: string
    exits: string
    coordinates: [number, number]
}

export type TrajectoryData = {
    tag_local_identifier: number
    individual_local_identifier: string
    path: [number, number][]
    speeds: (number | null)[]
    timestamps: string[]
    total_points: number
}


export type BirdStopoverData = {
    tag_local_identifier: number;
    individual_local_identifier: string;
    centroid_lat: number;
    centroid_lon: number;
    fix_count?: number;
};

export type BirdLocationPoint = {
    name: string;
    code: string;
    address: string;
    entries: string;
    exits: string;
    coordinates: [longitude: number, latitude: number];
};
