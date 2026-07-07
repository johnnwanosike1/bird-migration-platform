export type RootUploadData = UploadData[]

export interface UploadData {
  upload_id: number
  Filename: string
  Status: string
  created_at: string
  updated_at: string
}

interface FilterStore {
  species: string
  year: number
  setSpecies: (s: string) => void
  setYear: (y: number) => void
}

