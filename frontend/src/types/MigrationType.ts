export type MigrationTypeRoot = MigrationType[]

export interface MigrationType {
  tag_local_identifier: number
  individual_local_identifier: string
  centroid_lat: number
  centroid_lon: number
  arrival_time: string
  departure_time: string
  duration_hours: number
  fix_count: number
  mean_speed_ms: number
  max_displacement_m: number
  mean_height_m: number
}
