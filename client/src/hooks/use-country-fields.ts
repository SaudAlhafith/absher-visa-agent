import { useQuery } from "@tanstack/react-query";
import type { CountryFields } from "@shared/schema";

/**
 * Hook to fetch country-specific dynamic fields
 * Returns empty fields array if country has no custom fields
 */
export function useCountryFields(countryId: string | undefined) {
  return useQuery<CountryFields>({
    queryKey: ["/api/countries", countryId, "fields"],
    queryFn: async () => {
      if (!countryId) {
        return { countryId: "", fields: [] };
      }
      const res = await fetch(`/api/countries/${countryId}/fields`);
      if (!res.ok) {
        throw new Error("Failed to fetch country fields");
      }
      return res.json();
    },
    enabled: !!countryId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

