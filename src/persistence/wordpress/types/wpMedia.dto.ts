export type WpMediaDto = {
  id: number
  source_url: string
  alt_text: string
  media_details: {
    width: number
    height: number
    sizes?: {
      large?: { source_url: string; width: number; height: number }
      medium_large?: { source_url: string; width: number; height: number }
      full?: { source_url: string; width: number; height: number }
    }
  }
}
