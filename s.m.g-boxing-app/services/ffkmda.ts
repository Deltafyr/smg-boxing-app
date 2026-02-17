import { Competition, Fight } from '../types';

// --- CONFIGURATION ---

// Proxies for POST (Login). 
const AUTH_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.codetabs.com/v1/proxy?quest=",
  "https://thingproxy.freeboard.io/fetch/", 
  "" // Direct access (fallback)
];

// Proxies for GET (Data). 
const DATA_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.codetabs.com/v1/proxy?quest=",
  "https://api.allorigins.win/raw?url=", 
  "https://thingproxy.freeboard.io/fetch/",
  ""
];

// Domains to scan for Authentication
const AUTH_DOMAINS = [
  "https://api.scoring.ffkmda.org", 
  "https://scoring.ffkmda.org",
  "https://admin.scoring.ffkmda.org",
  "https://sso.ffkmda.fr"
];

// Common authentication paths
const AUTH_PATHS = [
  "/api/login_check",     
  "/login_check",
  "/api/authentication_token",
  "/authentication_token", 
  "/api/login",
  "/login"
];

// The API where data (competitions/fights) actually lives.
const DATA_API_URL = "https://api.scoring.ffkmda.org";

// State
let activeProxy = "https://corsproxy.io/?"; 
let activeBaseUrl = DATA_API_URL; 

const getHeaders = (token: string) => ({
  "Accept": "application/ld+json, application/json",
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json"
});

// --- HELPER: URL BUILDER ---
const buildProxyUrl = (targetUrl: string, proxy: string): string => {
  if (!proxy) return targetUrl;
  if (proxy.includes("thingproxy")) return `${proxy}${targetUrl}`;
  return `${proxy}${encodeURIComponent(targetUrl)}`;
};

// --- AUTHENTIFICATION ---

export const loginFFKMDA = async (email: string, pass: string): Promise<string> => {
  console.log("Démarrage authentification FFKMDA...");
  
  const candidates: {url: string, domain: string, proxy: string}[] = [];
  
  for (const proxy of AUTH_PROXIES) {
    for (const domain of AUTH_DOMAINS) {
      for (const path of AUTH_PATHS) {
        const cleanDomain = domain.replace(/\/$/, "");
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        const targetUrl = `${cleanDomain}${cleanPath}`;
        
        const fullUrl = buildProxyUrl(targetUrl, proxy);
        candidates.push({ url: fullUrl, domain: cleanDomain, proxy: proxy });
      }
    }
  }

  const uniqueCandidates = candidates.filter((v,i,a)=>a.findIndex(t=>(t.url === v.url))===i);

  for (const candidate of uniqueCandidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); 

      const body = JSON.stringify({ username: email, email: email, password: pass });

      const response = await fetch(candidate.url, {
        method: 'POST',
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 401) throw new Error("BAD_CREDENTIALS");

      if (response.ok) {
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { continue; }

        const token = data.token || data.access_token || data.id_token;
        
        if (token) {
          console.log(`Authentification réussie via : ${candidate.url}`);
          if (candidate.domain.includes("scoring")) activeBaseUrl = candidate.domain;
          else activeBaseUrl = DATA_API_URL;
          
          activeProxy = candidate.proxy;
          return token;
        }
      }
    } catch (e: any) {
      if (e.message === "BAD_CREDENTIALS") throw e;
    }
  }
  throw new Error("ENDPOINT_NOT_FOUND");
};

// --- DATA FETCHING ---

async function fetchAllData(endpoint: string, token: string): Promise<any[]> {
  let results: any[] = [];
  let offset = 0;
  const limit = 50; 
  
  let baseUrl = activeBaseUrl;
  const isApiSubdomain = baseUrl.includes("api.");
  const hasApiSuffix = baseUrl.endsWith("/api");
  
  if (!hasApiSuffix && !isApiSubdomain) {
     baseUrl = baseUrl.replace(/\/$/, "") + "/api";
  }

  const doFetch = async (path: string) => {
    const targetUrl = `${baseUrl}${path}`;
    const proxiesToTry = [activeProxy, ...DATA_PROXIES.filter(p => p !== activeProxy)];
    const uniqueProxies = [...new Set(proxiesToTry)];

    for (const proxy of uniqueProxies) {
        try {
            const fetchUrl = buildProxyUrl(targetUrl, proxy);
            const res = await fetch(fetchUrl, { method: 'GET', headers: getHeaders(token) });
            if (res.ok) {
                if (proxy !== activeProxy) activeProxy = proxy;
                return res;
            }
        } catch (e) { /* continue */ }
    }
    throw new Error("FETCH_FAILED");
  };

  const separator = endpoint.includes('?') ? '&' : '?';
  let loopCount = 0;
  const MAX_LOOPS = 20; 

  while (loopCount < MAX_LOOPS) {
    try {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const queryParams = `${separator}offset=${offset}&limit=${limit}`; 
      
      const response = await doFetch(`${cleanEndpoint}${queryParams}`);
      const json = await response.json();
      
      const data = json['hydra:member'] || json.results || json.rows || json.data || [];

      if (!Array.isArray(data)) {
         if (Array.isArray(json)) return json;
         break; 
      }
      if (data.length === 0) break;

      results = [...results, ...data];
      offset += data.length;

      const total = json['hydra:totalItems'] || json.total || json.totalItems;
      if (total && results.length >= total) break;
      if (data.length < limit) break;

      loopCount++;
    } catch (e) {
      console.error("Fetch loop error:", e);
      break; 
    }
  }
  return results;
}

// --- PUBLIC METHODS ---

export const getActiveCompetitions = async (token: string): Promise<Competition[]> => {
  try {
    // On essaie plusieurs endpoints pour être sûr de trouver la 900
    // /championships est souvent la liste complète, /registrable seulement les ouvertes
    let data: any[] = [];
    
    try {
       // Essai 1 : Liste globale (le plus probable pour trouver la 900 si elle est fermée/passée)
       data = await fetchAllData(`/championships?season=2024%2F2025`, token);
    } catch (e) {
       console.log("Fallback to registrable");
       // Essai 2 : Liste des inscriptions ouvertes
       data = await fetchAllData(`/championship/registrable?season=2024%2F2025`, token);
    }

    if (!data || data.length === 0) {
        // Fallback ultime : on essaie sans filtre de saison
        data = await fetchAllData(`/championships`, token);
    }
    
    return data.map((c: any) => ({
      id: c.id ? c.id.toString() : Math.random().toString(),
      name: c.label || c.name || "Compétition Inconnue",
      date: c.startDate || c.dateStart || new Date().toISOString(),
      location: c.city || c.place || "Lieu non défini",
      ffkmdaId: c.id ? c.id.toString() : undefined
    }));
  } catch (error) {
    console.error("Erreur récupération compétitions", error);
    return [];
  }
};

// Récupérer les compétiteurs inscrits à une compétition spécifique (ex: 900)
export const getCompetitionRegistrations = async (competId: string, token: string) => {
    try {
        // D'après votre capture, l'endpoint est probablement 'registered' ou 'registrations'
        // On essaie les variantes courantes API Platform
        const potentialEndpoints = [
            `/championship/${competId}/registered`, // Vu dans votre capture
            `/championship/${competId}/registrations`,
            `/competition/${competId}/competitors`,
            `/championship/${competId}/competitors`
        ];

        let rawCompetitors: any[] = [];

        for (const ep of potentialEndpoints) {
            try {
                const res = await fetchAllData(ep, token);
                if (res && res.length > 0) {
                    rawCompetitors = res;
                    break;
                }
            } catch(e) { /* continue */ }
        }

        // Mapping des résultats
        return rawCompetitors.map((item: any) => {
            // Structure peut varier : item peut être le combattant directement, ou un objet "Registration" contenant "competitor"
            const c = item.competitor || item.fighter || item;
            
            return {
                id: c.id ? c.id.toString() : Math.random().toString(),
                name: (c.firstname && c.lastname) ? `${c.firstname} ${c.lastname}` : (c.name || "Inconnu"),
                category: "Compétiteur",
                role: "Member",
                email: c.email || "",
                phone: c.phone || "",
                // On essaie de récupérer le club si dispo
                club: c.club ? (c.club.name || c.club) : "" 
            };
        });

    } catch (error) {
        console.error("Erreur récupération inscrits", error);
        return [];
    }
};

export const getCompetitionMatches = async (competId: string, token: string) => {
  try {
    let matches: any[] = [];
    
    const potentialEndpoints = [
      `/championship/${competId}/matches`,
      `/championship/${competId}/fights`,
      `/championship/${competId}/plannings`,
      `/competition/${competId}/matches`
    ];

    for (const ep of potentialEndpoints) {
       try {
         const res = await fetchAllData(ep, token);
         if (res && res.length > 0) {
           matches = res;
           break;
         }
       } catch(e) { /* continue */ }
    }
    
    return matches.map((m: any) => ({
      externalId: m.id,
      fighter1: m.competitor1 ? `${m.competitor1.firstname} ${m.competitor1.lastname}` : (m.fighter1_name || "Inconnu"),
      fighter2: m.competitor2 ? `${m.competitor2.firstname} ${m.competitor2.lastname}` : (m.fighter2_name || "Inconnu"),
      ring: m.ring || m.tatami || m.area || "NP",
      order: m.order || m.number || m.matchNumber || 0,
      status: m.status || 'Pending'
    }));
  } catch (error) {
    console.error("Erreur récupération matchs", error);
    return [];
  }
};