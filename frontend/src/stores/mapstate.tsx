import { create } from 'zustand'
import axios from 'axios'
import _ from "lodash";

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


type BirdStopoverData = {
    tag_local_identifier: number;
    individual_local_identifier: string;
    centroid_lat: number;
    centroid_lon: number;
    fix_count?: number;
};

type BirdLocationPoint = {
    name: string;
    code: string;
    address: string;
    entries: string;
    exits: string;
    coordinates: [longitude: number, latitude: number];
};


type MapState = {
    data: StopoverPoint[]          // stopover markers
    trajectories: TrajectoryData[] // migration paths
    loading: boolean
    setDate: ({ dateRange, filter, selectedIndividualIdentifiers }: { dateRange: any[], filter: any, selectedIndividualIdentifiers: any }) => Promise<void>
}

const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_SERVER,
    headers: { 'Content-Type': 'application/json' },
})

const useMapStateStore = create<MapState>((set) => ({
    data: [],
    trajectories: [],
    loading: false,
    switchfilter: [],

    setDate: async ({ dateRange, filter, selectedIndividualIdentifiers }: { dateRange: any[], filter: any, selectedIndividualIdentifiers: any }) => {
        set({ loading: true })

        try {

            let payload = {
                start: dateRange[0],
                end: dateRange[1],
                max_speed: null,
                min_duration: null,
                individual_local_identifiers: selectedIndividualIdentifiers,
                switchfilter: filter
            }

            console.log(selectedIndividualIdentifiers);



            const res = await instance.post('/map-filter', payload)

            const birdLocations: BirdLocationPoint[] = _.map(
                res.data.bird_migration_stopover as BirdStopoverData[],
                (item: BirdStopoverData) => ({
                    name: item.individual_local_identifier,
                    code: String(item.tag_local_identifier),
                    address: "",
                    entries: String(item.fix_count ?? 0),
                    exits: "0",
                    coordinates: [item.centroid_lon, item.centroid_lat] as [number, number],
                })
            );


            const trajectories: TrajectoryData[] = res.data.event ?? []

            set({ data: birdLocations, trajectories, loading: false })

        } catch (err) {
            console.error('mapstate fetch error:', err)
            set({ data: [], trajectories: [], loading: false })
        }
    }
}))

export { useMapStateStore }
