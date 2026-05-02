// Configuration constants
export const STORAGE_KEY = 'notebase_tabs';
export const MAX_TABS = 10;

// CORS proxy services (fallback order)
export const CORS_PROXIES = [
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url='
];

export function getRandomProxy() {
  return CORS_PROXIES[Math.floor(Math.random() * CORS_PROXIES.length)];
}