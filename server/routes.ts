import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVisaRequestSchema, updateVisaRequestSchema, type VisaApiResponse, type Country, type VisaStatus } from "@shared/schema";
import { getCachedVisaInfo, setCachedVisaInfo, getCachedVisaMap, setCachedVisaMap, type VisaMapData } from "./visaCache";
import { getCountryFields } from "./data/country-fields";
import countries from "i18n-iso-countries";
import arLocale from "i18n-iso-countries/langs/ar.json" assert { type: "json" };

import dotenv from "dotenv";
dotenv.config();

// Register Arabic locale
countries.registerLocale(arLocale);

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const VISA_API_URL = "https://visa-requirement.p.rapidapi.com/v2/visa/check";
const VISA_MAP_URL = "https://visa-requirement.p.rapidapi.com/v2/visa/map";
const PASSPORT_COUNTRY = "SA";

// Color to visa status mapping
const COLOR_STATUS: Record<string, VisaStatus> = {
  green: "visa_free",
  blue: "e_visa",
  yellow: "e_visa",
  red: "visa_required",
};

// Build countries list from visa map API response
function buildCountries(visaMap: VisaMapData): Country[] {
  const result: Country[] = [];
  const { colors } = visaMap.data;
  const EXCLUDED = ["SA", "IL"]; // Saudi Arabia (self), Israel

  for (const [color, codes] of Object.entries(colors)) {
    if (!codes) continue;
    
    for (const code of codes.split(",")) {
      const upperCode = code.trim().toUpperCase();
      if (EXCLUDED.includes(upperCode)) continue;
      
      const name = countries.getName(upperCode, "en") || upperCode;
      const nameAr = countries.getName(upperCode, "ar") || name;
      
      result.push({
        id: upperCode.toLowerCase(),
        name,
        nameAr,
        flag: "",
        visaStatus: COLOR_STATUS[color] || "visa_required",
      });
    }
  }

  return result.sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"));
}

// Fetch visa map with caching
async function getVisaMap(): Promise<VisaMapData | null> {
  const cached = getCachedVisaMap();
  if (cached) return cached;

  if (!RAPIDAPI_KEY) {
    console.error("[VisaMap] No API key");
    return null;
  }

  try {
    console.log("[VisaMap] Fetching from API...");
    const res = await fetch(VISA_MAP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-rapidapi-host": "visa-requirement.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
      body: `passport=${PASSPORT_COUNTRY}`,
    });

    if (!res.ok) {
      console.error(`[VisaMap] Error ${res.status}`);
      return null;
    }

    const data: VisaMapData = await res.json();
    setCachedVisaMap(data);
    return data;
  } catch (err) {
    console.error("[VisaMap] Fetch error:", err);
    return null;
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  
  // Countries list (from visa map API)
  app.get("/api/countries", async (_req, res) => {
    try {
      const visaMap = await getVisaMap();
      if (visaMap?.data?.colors) {
        return res.json(buildCountries(visaMap));
      }
      // Fallback to mock
      res.json(await storage.getCountries());
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch countries" });
    }
  });

  // Visa map (raw colors data for world map)
  app.get("/api/visa-map", async (_req, res) => {
    try {
      const visaMap = await getVisaMap();
      if (visaMap) {
        return res.json(visaMap);
      }
      res.status(404).json({ error: "Visa map not available" });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch visa map" });
    }
  });

  // Single country
  app.get("/api/countries/:id", async (req, res) => {
    try {
      const id = req.params.id.toLowerCase();
      const visaMap = await getVisaMap();
      
      if (visaMap?.data?.colors) {
        const country = buildCountries(visaMap).find(c => c.id === id);
        if (country) return res.json(country);
      }
      
      const country = await storage.getCountry(id);
      if (!country) return res.status(404).json({ error: "Country not found" });
      res.json(country);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch country" });
    }
  });

  // Country-specific dynamic fields
  app.get("/api/countries/:id/fields", (req, res) => {
    try {
      const countryFields = getCountryFields(req.params.id);
      res.json(countryFields);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch country fields" });
    }
  });

  // Visa types
  app.get("/api/visa-types", async (_req, res) => {
    try {
      res.json(await storage.getVisaTypes());
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch visa types" });
    }
  });

  app.get("/api/visa-types/:id", async (req, res) => {
    try {
      const visaType = await storage.getVisaType(req.params.id);
      if (!visaType) return res.status(404).json({ error: "Visa type not found" });
      res.json(visaType);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch visa type" });
    }
  });

  // Travelers
  app.get("/api/travelers", async (_req, res) => {
    try {
      res.json(await storage.getTravelers());
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch travelers" });
    }
  });

  // Requirements
  app.get("/api/requirements/:countryId", async (req, res) => {
    try {
      res.json(await storage.getRequirements(req.params.countryId));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch requirements" });
    }
  });

  // Traveler docs
  app.get("/api/traveler-docs/:travelerIds", async (req, res) => {
    try {
      res.json(await storage.getTravelerDocStatus(req.params.travelerIds.split(",")));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch traveler documents" });
    }
  });

  // Embassy
  app.get("/api/embassies/:countryId", async (req, res) => {
    try {
      const embassy = await storage.getEmbassy(req.params.countryId);
      if (!embassy) return res.status(404).json({ error: "Embassy not found" });
      res.json(embassy);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch embassy" });
    }
  });

  // Visa requests
  app.get("/api/requests", async (_req, res) => {
    try {
      res.json(await storage.getVisaRequests());
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  app.get("/api/requests/:id", async (req, res) => {
    try {
      const request = await storage.getVisaRequest(req.params.id);
      if (!request) return res.status(404).json({ error: "Request not found" });
      res.json(request);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch request" });
    }
  });

  app.post("/api/requests", async (req, res) => {
    try {
      const parsed = insertVisaRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request data", details: parsed.error.errors });
      }
      res.status(201).json(await storage.createVisaRequest(parsed.data));
    } catch (err) {
      res.status(500).json({ error: "Failed to create request" });
    }
  });

  app.patch("/api/requests/:id", async (req, res) => {
    try {
      const parsed = updateVisaRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid update data", details: parsed.error.errors });
      }
      const updated = await storage.updateVisaRequest(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ error: "Request not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to update request" });
    }
  });

  // Visa info (detailed check for a destination)
  app.get("/api/visa-info/:destinationCode", async (req, res) => {
    try {
      const dest = req.params.destinationCode.toUpperCase();
      
      // Check cache
      const cached = getCachedVisaInfo(PASSPORT_COUNTRY, dest);
      if (cached) return res.json(cached);

      if (!RAPIDAPI_KEY) {
        return res.status(500).json({ error: "API key not configured" });
      }

      console.log(`[VisaInfo] Fetching ${PASSPORT_COUNTRY} -> ${dest}`);
      const response = await fetch(VISA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "visa-requirement.p.rapidapi.com",
          "x-rapidapi-key": RAPIDAPI_KEY,
        },
        body: JSON.stringify({ passport: PASSPORT_COUNTRY, destination: dest }),
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch visa info" });
      }

      const data: VisaApiResponse = await response.json();
      setCachedVisaInfo(PASSPORT_COUNTRY, dest, data);
      res.json(data);
    } catch (err) {
      console.error("[VisaInfo] Error:", err);
      res.status(500).json({ error: "Failed to fetch visa information" });
    }
  });

  return httpServer;
}
