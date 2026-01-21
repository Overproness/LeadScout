export interface Lead {
  id: string;
  name: string;
  description: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  sourceUrl?: string;
  sourceType: 'web' | 'maps';
}

export interface SearchState {
  isSearching: boolean;
  query: string;
  location: string;
  mode: 'web' | 'maps';
  results: Lead[];
  error?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}
