import { create } from 'zustand'
import axios from 'axios'
import _ from "lodash";
import type { BirdLocationPoint, BirdStopoverData, StopoverPoint, TrajectoryData } from '../types/Filter';



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
            console.log(res.data.bird_migration_stopover);
            
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
