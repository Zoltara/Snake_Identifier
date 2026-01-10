export interface LocalizedSnakeData {
  name: string;
  description: string;
  first_aid: string[];
  toxicity_details: string;
  fun_fact: string;
  habitat_text: string;
}

export interface LocationData {
  country: string;
  continent_code: string;
}

export interface DetailedInfo {
  scientific_name: string;
  family: string;
  thai_names: string[];
  other_names: string[];
  range: string;
  habitat: string;
  active_time: string;
  diet: string;
  venom_toxicity: string;
  danger_to_humans: string;
  prevention: string;
  behavior: string;
}

export interface SnakeAnalysisResult {
  found: boolean;
  scientific_name: string;
  confidence: number;
  is_venomous: boolean;
  danger_level: 'Safe' | 'Moderate' | 'High' | 'Critical';
  locations: LocationData[];
  search_term: string;
  data: {
    en: LocalizedSnakeData;
    th: LocalizedSnakeData;
  };
  details: {
    en: DetailedInfo;
    th: DetailedInfo;
  };
}

export type ViewState = 'home' | 'analyzing' | 'result';
export type LangCode = 'en' | 'th';
