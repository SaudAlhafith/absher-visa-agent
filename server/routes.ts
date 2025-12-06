import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVisaRequestSchema, updateVisaRequestSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all countries
  app.get("/api/countries", async (req, res) => {
    try {
      const countries = await storage.getCountries();
      res.json(countries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch countries" });
    }
  });

  // Get single country
  app.get("/api/countries/:id", async (req, res) => {
    try {
      const country = await storage.getCountry(req.params.id);
      if (!country) {
        return res.status(404).json({ error: "Country not found" });
      }
      res.json(country);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch country" });
    }
  });

  // Get all visa types
  app.get("/api/visa-types", async (req, res) => {
    try {
      const visaTypes = await storage.getVisaTypes();
      res.json(visaTypes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch visa types" });
    }
  });

  // Get single visa type
  app.get("/api/visa-types/:id", async (req, res) => {
    try {
      const visaType = await storage.getVisaType(req.params.id);
      if (!visaType) {
        return res.status(404).json({ error: "Visa type not found" });
      }
      res.json(visaType);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch visa type" });
    }
  });

  // Get all travelers (family members)
  app.get("/api/travelers", async (req, res) => {
    try {
      const travelers = await storage.getTravelers();
      res.json(travelers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch travelers" });
    }
  });

  // Get visa requirements for country and visa type
  app.get("/api/requirements/:countryId/:visaTypeId", async (req, res) => {
    try {
      const requirements = await storage.getRequirements(
        req.params.countryId,
        req.params.visaTypeId
      );
      res.json(requirements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch requirements" });
    }
  });

  // Get traveler document status
  app.get("/api/traveler-docs/:travelerIds", async (req, res) => {
    try {
      const travelerIds = req.params.travelerIds.split(",");
      const docs = await storage.getTravelerDocStatus(travelerIds);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch traveler documents" });
    }
  });

  // Get embassy for country
  app.get("/api/embassies/:countryId", async (req, res) => {
    try {
      const embassy = await storage.getEmbassy(req.params.countryId);
      if (!embassy) {
        return res.status(404).json({ error: "Embassy not found" });
      }
      res.json(embassy);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch embassy" });
    }
  });

  // Get all visa requests
  app.get("/api/requests", async (req, res) => {
    try {
      const requests = await storage.getVisaRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  // Get single visa request
  app.get("/api/requests/:id", async (req, res) => {
    try {
      const request = await storage.getVisaRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch request" });
    }
  });

  // Create new visa request
  app.post("/api/requests", async (req, res) => {
    try {
      const parsed = insertVisaRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request data", details: parsed.error.errors });
      }

      const newRequest = await storage.createVisaRequest(parsed.data);
      res.status(201).json(newRequest);
    } catch (error) {
      res.status(500).json({ error: "Failed to create request" });
    }
  });

  // Update visa request
  app.patch("/api/requests/:id", async (req, res) => {
    try {
      const parsed = updateVisaRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid update data", details: parsed.error.errors });
      }

      const updatedRequest = await storage.updateVisaRequest(req.params.id, parsed.data);
      if (!updatedRequest) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ error: "Failed to update request" });
    }
  });

  return httpServer;
}
