// Configuration for API endpoints and environment variables
export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
    endpoints: {
      auctioneers: '/auctioneers',
      players: '/players',
      teams: '/teams', // This reads from franchises.json files
      franchises: '/teams', // Alias for teams since they're the same data
    }
  },
  
  // Server Configuration
  server: {
    port: import.meta.env.VITE_SERVER_PORT || 4000,
  },
  
  // Application Settings
  app: {
    name: 'Bidding App',
    version: '1.0.0'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string, sport?: string): string => {
  const baseUrl = config.api.baseUrl;
  const path = config.api.endpoints[endpoint as keyof typeof config.api.endpoints] || endpoint;
  
  if (sport) {
    return `${baseUrl}${path}/${sport}`;
  }
  return `${baseUrl}${path}`;
};

// Helper function to get API base URL
export const getApiBase = (): string => {
  return config.api.baseUrl;
};