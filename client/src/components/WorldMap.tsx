import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { Filter, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const ISO2_TO_ISO3: Record<string, string> = {
    AF: "AFG", AL: "ALB", DZ: "DZA", AD: "AND", AO: "AGO", AG: "ATG", AR: "ARG",
    AM: "ARM", AU: "AUS", AT: "AUT", AZ: "AZE", BS: "BHS", BH: "BHR", BD: "BGD",
    BB: "BRB", BY: "BLR", BE: "BEL", BZ: "BLZ", BJ: "BEN", BT: "BTN", BO: "BOL",
    BA: "BIH", BW: "BWA", BR: "BRA", BN: "BRN", BG: "BGR", BF: "BFA", BI: "BDI",
    KH: "KHM", CM: "CMR", CA: "CAN", CV: "CPV", CF: "CAF", TD: "TCD", CL: "CHL",
    CN: "CHN", CO: "COL", KM: "COM", CG: "COG", CD: "COD", CR: "CRI", CI: "CIV",
    HR: "HRV", CU: "CUB", CY: "CYP", CZ: "CZE", DK: "DNK", DJ: "DJI", DM: "DMA",
    DO: "DOM", EC: "ECU", EG: "EGY", SV: "SLV", GQ: "GNQ", ER: "ERI", EE: "EST",
    ET: "ETH", FJ: "FJI", FI: "FIN", FR: "FRA", GA: "GAB", GM: "GMB", GE: "GEO",
    DE: "DEU", GH: "GHA", GR: "GRC", GD: "GRD", GT: "GTM", GN: "GIN", GW: "GNB",
    GY: "GUY", HT: "HTI", HN: "HND", HU: "HUN", IS: "ISL", IN: "IND", ID: "IDN",
    IR: "IRN", IQ: "IRQ", IE: "IRL", IL: "ISR", IT: "ITA", JM: "JAM", JP: "JPN",
    JO: "JOR", KZ: "KAZ", KE: "KEN", KI: "KIR", KP: "PRK", KR: "KOR", KW: "KWT",
    KG: "KGZ", LA: "LAO", LV: "LVA", LB: "LBN", LS: "LSO", LR: "LBR", LY: "LBY",
    LI: "LIE", LT: "LTU", LU: "LUX", MK: "MKD", MG: "MDG", MW: "MWI", MY: "MYS",
    MV: "MDV", ML: "MLI", MT: "MLT", MH: "MHL", MR: "MRT", MU: "MUS", MX: "MEX",
    FM: "FSM", MD: "MDA", MC: "MCO", MN: "MNG", ME: "MNE", MA: "MAR", MZ: "MOZ",
    MM: "MMR", NA: "NAM", NR: "NRU", NP: "NPL", NL: "NLD", NZ: "NZL", NI: "NIC",
    NE: "NER", NG: "NGA", NO: "NOR", OM: "OMN", PK: "PAK", PW: "PLW", PA: "PAN",
    PG: "PNG", PY: "PRY", PE: "PER", PH: "PHL", PL: "POL", PT: "PRT", QA: "QAT",
    RO: "ROU", RU: "RUS", RW: "RWA", KN: "KNA", LC: "LCA", VC: "VCT", WS: "WSM",
    SM: "SMR", ST: "STP", SA: "SAU", SN: "SEN", RS: "SRB", SC: "SYC", SL: "SLE",
    SG: "SGP", SK: "SVK", SI: "SVN", SB: "SLB", SO: "SOM", ZA: "ZAF", SS: "SSD",
    ES: "ESP", LK: "LKA", SD: "SDN", SR: "SUR", SZ: "SWZ", SE: "SWE", CH: "CHE",
    SY: "SYR", TW: "TWN", TJ: "TJK", TZ: "TZA", TH: "THA", TL: "TLS", TG: "TGO",
    TO: "TON", TT: "TTO", TN: "TUN", TR: "TUR", TM: "TKM", TV: "TUV", UG: "UGA",
    UA: "UKR", AE: "ARE", GB: "GBR", US: "USA", UY: "URY", UZ: "UZB", VU: "VUT",
    VA: "VAT", VE: "VEN", VN: "VNM", YE: "YEM", ZM: "ZMB", ZW: "ZWE",
    // Non-ISO but commonly used:
    XK: "XKX",
    PS: "PSE",
    HK: "HKG",
    MO: "MAC",
  };
  
  const ISO3_TO_ISO2: Record<string, string> = Object.fromEntries(
    Object.entries(ISO2_TO_ISO3).map(([iso2, iso3]) => [iso3, iso2])
  );
  
  // 2) Numeric-3 (ISO) → ISO alpha-3
  // Start from your existing numeric map (minus '-99') and pad keys to 3 digits.
  const RAW_NUMERIC_TO_ISO3: Record<string, string> = {
    "4": "AFG", "8": "ALB", "12": "DZA", "20": "AND", "24": "AGO", "28": "ATG",
    "32": "ARG", "51": "ARM", "36": "AUS", "40": "AUT", "31": "AZE", "44": "BHS",
    "48": "BHR", "50": "BGD", "52": "BRB", "112": "BLR", "56": "BEL", "84": "BLZ",
    "204": "BEN", "64": "BTN", "68": "BOL", "70": "BIH", "72": "BWA", "76": "BRA",
    "96": "BRN", "100": "BGR", "854": "BFA", "108": "BDI", "116": "KHM", "120": "CMR",
    "124": "CAN", "132": "CPV", "140": "CAF", "148": "TCD", "152": "CHL", "156": "CHN",
    "170": "COL", "174": "COM", "178": "COG", "180": "COD", "188": "CRI", "384": "CIV",
    "191": "HRV", "192": "CUB", "196": "CYP", "203": "CZE", "208": "DNK", "262": "DJI",
    "212": "DMA", "214": "DOM", "218": "ECU", "818": "EGY", "222": "SLV", "226": "GNQ",
    "232": "ERI", "233": "EST", "231": "ETH", "242": "FJI", "246": "FIN", "250": "FRA",
    "266": "GAB", "270": "GMB", "268": "GEO", "276": "DEU", "288": "GHA", "300": "GRC",
    "308": "GRD", "320": "GTM", "324": "GIN", "624": "GNB", "328": "GUY", "332": "HTI",
    "340": "HND", "348": "HUN", "352": "ISL", "356": "IND", "360": "IDN", "364": "IRN",
    "368": "IRQ", "372": "IRL", "376": "ISR", "380": "ITA", "388": "JAM", "392": "JPN",
    "400": "JOR", "398": "KAZ", "404": "KEN", "296": "KIR", "408": "PRK", "410": "KOR",
    "414": "KWT", "417": "KGZ", "418": "LAO", "428": "LVA", "422": "LBN", "426": "LSO",
    "430": "LBR", "434": "LBY", "438": "LIE", "440": "LTU", "442": "LUX", "807": "MKD",
    "450": "MDG", "454": "MWI", "458": "MYS", "462": "MDV", "466": "MLI", "470": "MLT",
    "584": "MHL", "478": "MRT", "480": "MUS", "484": "MEX", "583": "FSM", "498": "MDA",
    "492": "MCO", "496": "MNG", "499": "MNE", "504": "MAR", "508": "MOZ", "104": "MMR",
    "516": "NAM", "520": "NRU", "524": "NPL", "528": "NLD", "554": "NZL", "558": "NIC",
    "562": "NER", "566": "NGA", "578": "NOR", "512": "OMN", "586": "PAK", "585": "PLW",
    "591": "PAN", "598": "PNG", "600": "PRY", "604": "PER", "608": "PHL", "616": "POL",
    "620": "PRT", "634": "QAT", "642": "ROU", "643": "RUS", "646": "RWA", "659": "KNA",
    "662": "LCA", "670": "VCT", "882": "WSM", "674": "SMR", "678": "STP", "682": "SAU",
    "686": "SEN", "688": "SRB", "690": "SYC", "694": "SLE", "702": "SGP", "703": "SVK",
    "705": "SVN", "90": "SLB", "706": "SOM", "710": "ZAF", "728": "SSD", "724": "ESP",
    "144": "LKA", "736": "SDN", "740": "SUR", "748": "SWZ", "752": "SWE", "756": "CHE",
    "760": "SYR", "158": "TWN", "762": "TJK", "834": "TZA", "764": "THA", "626": "TLS",
    "768": "TGO", "776": "TON", "780": "TTO", "788": "TUN", "792": "TUR", "795": "TKM",
    "798": "TUV", "800": "UGA", "804": "UKR", "784": "ARE", "826": "GBR", "840": "USA",
    "858": "URY", "860": "UZB", "548": "VUT", "336": "VAT", "862": "VEN", "704": "VNM",
    "887": "YEM", "894": "ZMB", "716": "ZWE", "275": "PSE", "344": "HKG", "446": "MAC",
    // NOTE: removed "-99": "XKX" to stay strictly ISO.
  };
  
  const NUMERIC_TO_ISO3: Record<string, string> = Object.fromEntries(
    Object.entries(RAW_NUMERIC_TO_ISO3).map(([num, iso3]) => [
      num.padStart(3, "0"), // "4" → "004"
      iso3,
    ])
  );

interface VisaMapColors {
  red?: string;
  green?: string;
  blue?: string;
  yellow?: string;
}

interface WorldMapProps {
  visaColors: VisaMapColors;
  onCountryClick: (countryCode: string) => void;
  selectedCountry?: string;
}

type FilterType = "all" | "green" | "blue" | "yellow" | "red";

const FILTER_OPTIONS: { value: FilterType; label: string; color: string; bgColor: string }[] = [
  { value: "all", label: "الكل", color: "#333", bgColor: "#f5f5f5" },
  { value: "green", label: "بدون تأشيرة", color: "#2e7d32", bgColor: "#e8f5e9" },
  { value: "blue", label: "تأشيرة إلكترونية", color: "#1565c0", bgColor: "#e3f2fd" },
  { value: "yellow", label: "تصريح سفر", color: "#f57f17", bgColor: "#fff8e1" },
  { value: "red", label: "تأشيرة مطلوبة", color: "#c62828", bgColor: "#ffebee" },
];

const STATUS_COLORS: Record<string, string> = {
  green: "#4caf50",
  blue: "#2196f3",
  yellow: "#ffc107",
  red: "#f44336",
  default: "#e0e0e0",
  saudi: "#00ab67",
};

// Lighter/brighter hover colors for each status
const HOVER_COLORS: Record<string, string> = {
  green: "#66bb6a",
  blue: "#42a5f5",
  yellow: "#ffca28",
  red: "#ef5350",
  default: "#bdbdbd",
  saudi: "#00ab67",
};

export function WorldMap({ visaColors, onCountryClick, selectedCountry }: WorldMapProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([20, 25]);


  // Build color lookup from ISO2 codes
  const countryColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    
    if (!visaColors || typeof visaColors !== 'object') {
      return map;
    }
    
    for (const [color, codes] of Object.entries(visaColors)) {
      if (!codes || typeof codes !== 'string') continue;
      for (const code of codes.split(",")) {
        const trimmedCode = code.trim().toUpperCase();
        const iso3 = ISO2_TO_ISO3[trimmedCode];
        if (iso3) {
          map[iso3] = color;
        }
      }
    }
    map["SAU"] = "saudi";
    return map;
  }, [visaColors]);

  const getCountryColor = (iso3: string) => {
    const colorKey = countryColorMap[iso3];
    if (!colorKey) return STATUS_COLORS.default;
    if (colorKey === "saudi") return STATUS_COLORS.saudi;
    if (filter !== "all" && colorKey !== filter) return "#f0f0f0";
    return STATUS_COLORS[colorKey] || STATUS_COLORS.default;
  };

  const handleZoomIn = () => setZoom(Math.min(zoom * 1.5, 8));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.5, 1));
  const handleReset = () => { setZoom(1); setCenter([20, 25]); };

  const stats = useMemo(() => {
    const counts = { green: 0, blue: 0, yellow: 0, red: 0 };
    for (const color of Object.values(countryColorMap)) {
      if (color in counts) counts[color as keyof typeof counts]++;
    }
    return counts;
  }, [countryColorMap]);

  return (
    <div>
      {/* Stats Row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTER_OPTIONS.slice(1).map((opt) => (
          <div
            key={opt.value}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px]"
            style={{ backgroundColor: opt.bgColor, color: opt.color }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[opt.value] }} />
            <span className="font-medium">{opt.label}</span>
            <span className="font-bold">({stats[opt.value as keyof typeof stats]})</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-[#707070]" />
        <span className="text-[12px] text-[#707070]">تصفية:</span>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border ${
                filter === opt.value
                  ? "border-[#00ab67] bg-[#00ab67] text-white"
                  : "border-[#e0e0e0] hover:border-[#00ab67]"
              }`}
              style={filter !== opt.value ? { color: opt.color } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-[#f8fafc] rounded-xl border-2 border-[#e0e0e0] overflow-hidden">
        {/* Zoom Controls */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
              <button onClick={handleZoomIn} className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-[#f5f5f5] transition-colors">
                <ZoomIn className="w-4 h-4 text-[#333]" />
              </button>
              <button onClick={handleZoomOut} className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-[#f5f5f5] transition-colors">
                <ZoomOut className="w-4 h-4 text-[#333]" />
              </button>
              <button onClick={handleReset} className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-[#f5f5f5] transition-colors">
                <RotateCcw className="w-4 h-4 text-[#333]" />
              </button>
            </div>

            {/* Saudi Arabia Label */}
            <div className="absolute top-3 right-3 z-10 bg-[#00ab67] text-white px-3 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              المملكة العربية السعودية
            </div>

            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 140, center: [0, 30] }}
              style={{ width: "100%", height: "380px" }}
            >
              <ZoomableGroup
                zoom={zoom}
                center={center}
                onMoveEnd={({ coordinates, zoom: newZoom }) => {
                  setCenter(coordinates as [number, number]);
                  setZoom(newZoom);
                }}
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      // world-atlas uses numeric IDs, convert to ISO3
                      const numericId = String(geo.id);
                      const iso3 = NUMERIC_TO_ISO3[numericId] || geo.properties?.ISO_A3 || numericId;
                      const iso2 = ISO3_TO_ISO2[iso3];
                      const colorKey = countryColorMap[iso3] || "default";
                      const color = getCountryColor(iso3);
                      const hoverColor = HOVER_COLORS[colorKey] || HOVER_COLORS.default;
                      const isSelected = selectedCountry?.toUpperCase() === iso2;
                      const isSaudi = iso3 === "SAU";
                      const isExcluded = iso2 === "IL";

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => {
                            if (iso2 && !isSaudi && !isExcluded) {
                              onCountryClick(iso2.toLowerCase());
                            }
                          }}
                          style={{
                            default: {
                              fill: color,
                              stroke: isSelected ? "#00ab67" : "#fff",
                              strokeWidth: isSelected ? 1 : 0.5,
                              outline: "none",
                              cursor: isSaudi || isExcluded ? "default" : "pointer",
                              zIndex: isSelected ? 1000 : 1,
                            },
                            hover: {
                              fill: isSaudi ? STATUS_COLORS.saudi : isExcluded ? color : hoverColor,
                              stroke: isSelected ? "#00ab67" : "#333",
                              strokeWidth: 1.5,
                              outline: "none",
                            },
                            pressed: { fill: color, outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-[#707070]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS.green }} />
          بدون تأشيرة
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS.blue }} />
          تأشيرة عند الوصول
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS.yellow }} />
          تصريح سفر
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS.red }} />
          تأشيرة مطلوبة
        </div>
      </div>

      <p className="text-center text-[11px] text-[#999] mt-2">
        اضغط على أي دولة لعرض تفاصيل التأشيرة
      </p>
    </div>
  );
}
