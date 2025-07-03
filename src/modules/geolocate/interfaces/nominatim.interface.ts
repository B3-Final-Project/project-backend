export interface NominatimReverseResponse {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface NominatimSearchResponse {
  display_name: string;
  lon: string;
  lat: string;
  [key: string]: any;
} 