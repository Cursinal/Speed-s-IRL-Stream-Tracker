import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Moon, Sun, Video, CheckCircle, X, Loader2, Plus, Minus, Calendar, Flag, Menu, ChevronDown, ChevronRight, ArrowDownUp, Coffee } from 'lucide-react';

// --- CONFIGURATION ---
const DATA_SOURCE_URL = "./map_config.json"; 

const FALLBACK_PINS = [
    {
      "id": "1768946582134",
      "title": "irl stream inside the Great Pyramids 🇪🇬🐪👑 (Egypt)",
      "videoLink": "https://www.youtube.com/watch?v=hRQq_MG7RIk",
      "date": "2026-01-15",
      "flagCode": "EG",
      "locationIds": ["EGY"]
    }
];

const THEME_CONFIG = {
  accent: {
    primary: "#ef4444",
    primaryHover: "#ff6b6b",
    visited: "#65e327",
  },
  dark: {
    bg: "#171717",
    panelBg: "#262626",
    textPrimary: "#f5f5f5",
    textSecondary: "#a3a3a3",
    border: "#404040",
    map: {
      bg: "#0a0a0a",
      country: "#262626",
      countryHover: "#404040",
      stroke: "#525252",
      glow: "rgba(0,0,0,0.5)" 
    }
  },
  light: {
    bg: "#ffffff",
    panelBg: "#ffffff",
    textPrimary: "#0f172a",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    map: {
      bg: "#f0f9ff",
      country: "#cbd5e1",
      countryHover: "#94a3b8",
      stroke: "#ffffff",
      glow: "rgba(0,0,0,0.1)" 
    }
  }
};

const WORLD_GEO_JSON_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
const US_STATES_GEO_JSON_URL = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";

const polygonFeature = (id, name, rings) => ({
  type: "Feature",
  id,
  properties: { name },
  geometry: { type: "Polygon", coordinates: rings }
});

const multiPolygonFeature = (id, name, polygons) => ({
  type: "Feature",
  id,
  properties: { name },
  geometry: { type: "MultiPolygon", coordinates: polygons }
});

const MANUAL_GEO_FEATURES = [
  polygonFeature("BRB", "Barbados", [[
    [-59.493311, 13.081982], [-59.521875, 13.062207], [-59.611328, 13.102100],
    [-59.642773, 13.150293], [-59.646680, 13.303125], [-59.591602, 13.317676],
    [-59.487891, 13.196826], [-59.427637, 13.152783], [-59.493311, 13.081982]
  ]]),

  multiPolygonFeature("ATG", "Antigua and Barbuda", [
    [[[-61.94, 17.03], [-61.88, 17.17], [-61.74, 17.18], [-61.69, 17.10], [-61.76, 17.02], [-61.87, 16.99], [-61.94, 17.03]]],
    [[[-61.88, 17.56], [-61.81, 17.66], [-61.70, 17.65], [-61.68, 17.55], [-61.76, 17.50], [-61.86, 17.50], [-61.88, 17.56]]]
  ]),
  polygonFeature("AIA", "Anguilla", [[[-63.17, 18.19], [-63.09, 18.25], [-62.96, 18.25], [-62.91, 18.21], [-63.00, 18.17], [-63.13, 18.16], [-63.17, 18.19]]]),
  polygonFeature("ABW", "Aruba", [[[-70.08, 12.49], [-70.02, 12.56], [-69.88, 12.57], [-69.78, 12.51], [-69.87, 12.45], [-70.02, 12.44], [-70.08, 12.49]]]),
  multiPolygonFeature("BHS", "Bahamas", [
    [[[-79.35, 26.42], [-78.90, 26.78], [-78.25, 26.78], [-77.75, 26.48], [-78.25, 26.22], [-79.00, 26.18], [-79.35, 26.42]]],
    [[[-78.62, 25.10], [-78.25, 25.33], [-77.84, 25.18], [-77.88, 24.82], [-78.30, 24.66], [-78.64, 24.82], [-78.62, 25.10]]],
    [[[-77.82, 24.95], [-77.42, 25.20], [-77.08, 25.04], [-77.20, 24.62], [-77.60, 24.50], [-77.92, 24.70], [-77.82, 24.95]]],
    [[[-76.56, 24.80], [-76.18, 24.92], [-75.86, 24.70], [-76.04, 24.40], [-76.46, 24.44], [-76.56, 24.80]]],
    [[[-75.55, 23.60], [-75.15, 23.82], [-74.78, 23.58], [-74.92, 23.22], [-75.34, 23.18], [-75.55, 23.60]]],
    [[[-74.55, 22.70], [-74.17, 22.86], [-73.92, 22.62], [-74.08, 22.36], [-74.42, 22.42], [-74.55, 22.70]]]
  ]),
  multiPolygonFeature("BES", "Bonaire, Sint Eustatius and Saba", [
    [[[-68.40, 12.13], [-68.31, 12.28], [-68.20, 12.25], [-68.20, 12.12], [-68.31, 12.06], [-68.40, 12.13]]],
    [[[-62.99, 17.45], [-62.94, 17.50], [-62.98, 17.54], [-63.03, 17.50], [-62.99, 17.45]]],
    [[[-63.27, 17.60], [-63.22, 17.66], [-63.17, 17.62], [-63.21, 17.57], [-63.27, 17.60]]]
  ]),
  multiPolygonFeature("VGB", "British Virgin Islands", [
    [[[-64.72, 18.39], [-64.62, 18.46], [-64.50, 18.44], [-64.52, 18.36], [-64.65, 18.34], [-64.72, 18.39]]],
    [[[-64.45, 18.44], [-64.34, 18.50], [-64.25, 18.46], [-64.30, 18.38], [-64.41, 18.38], [-64.45, 18.44]]]
  ]),
  multiPolygonFeature("CYM", "Cayman Islands", [
    [[[-81.45, 19.25], [-81.32, 19.37], [-81.18, 19.34], [-81.22, 19.23], [-81.38, 19.19], [-81.45, 19.25]]],
    [[[-79.90, 19.67], [-79.80, 19.76], [-79.72, 19.71], [-79.78, 19.62], [-79.90, 19.67]]],
    [[[-79.78, 19.62], [-79.69, 19.70], [-79.62, 19.65], [-79.70, 19.57], [-79.78, 19.62]]]
  ]),
  polygonFeature("CUB", "Cuba", [[[-84.95, 22.00], [-83.80, 22.65], [-82.35, 23.20], [-80.80, 23.15], [-79.05, 22.70], [-77.20, 21.95], [-75.25, 20.55], [-74.15, 20.05], [-74.55, 19.75], [-76.80, 20.18], [-78.85, 20.55], [-80.80, 21.10], [-82.60, 21.42], [-84.10, 21.38], [-84.95, 22.00]]]),
  polygonFeature("CUW", "Curaçao", [[[-69.16, 12.07], [-69.06, 12.22], [-68.84, 12.24], [-68.73, 12.13], [-68.86, 12.04], [-69.06, 12.02], [-69.16, 12.07]]]),
  polygonFeature("DMA", "Dominica", [[[-61.47, 15.22], [-61.42, 15.58], [-61.29, 15.66], [-61.22, 15.46], [-61.28, 15.20], [-61.39, 15.15], [-61.47, 15.22]]]),
  polygonFeature("DOM", "Dominican Republic", [[[-72.02, 19.78], [-71.55, 19.94], [-70.72, 19.74], [-69.92, 19.65], [-68.36, 18.95], [-68.30, 18.40], [-69.20, 18.18], [-70.18, 18.25], [-71.10, 18.02], [-71.76, 18.25], [-72.02, 19.78]]]),
  polygonFeature("GRD", "Grenada", [[[-61.83, 11.98], [-61.78, 12.22], [-61.63, 12.30], [-61.54, 12.15], [-61.58, 11.94], [-61.72, 11.89], [-61.83, 11.98]]]),
  multiPolygonFeature("GLP", "Guadeloupe", [
    [[[-61.82, 16.18], [-61.66, 16.40], [-61.45, 16.32], [-61.48, 16.08], [-61.68, 16.02], [-61.82, 16.18]]],
    [[[-61.47, 16.14], [-61.31, 16.34], [-61.15, 16.20], [-61.22, 15.98], [-61.39, 15.98], [-61.47, 16.14]]],
    [[[-61.36, 15.84], [-61.27, 15.92], [-61.17, 15.86], [-61.24, 15.78], [-61.36, 15.84]]]
  ]),
  polygonFeature("HTI", "Haiti", [[[-74.48, 19.72], [-73.70, 19.95], [-72.62, 19.82], [-71.76, 19.70], [-71.76, 18.25], [-72.55, 18.18], [-73.42, 18.30], [-74.12, 18.58], [-74.48, 19.72]]]),
  polygonFeature("JAM", "Jamaica", [[[-78.35, 18.18], [-77.75, 18.45], [-76.80, 18.42], [-76.15, 18.20], [-76.32, 17.90], [-77.15, 17.70], [-78.05, 17.84], [-78.35, 18.18]]]),
  polygonFeature("MTQ", "Martinique", [[[-61.20, 14.38], [-61.18, 14.72], [-61.04, 14.90], [-60.86, 14.80], [-60.85, 14.52], [-60.98, 14.34], [-61.20, 14.38]]]),
  polygonFeature("MSR", "Montserrat", [[[-62.25, 16.65], [-62.22, 16.84], [-62.12, 16.85], [-62.08, 16.72], [-62.15, 16.63], [-62.25, 16.65]]]),
  multiPolygonFeature("PRI", "Puerto Rico", [
    [[[-67.27, 18.18], [-66.80, 18.50], [-65.95, 18.52], [-65.28, 18.38], [-65.18, 18.02], [-65.78, 17.90], [-66.60, 17.95], [-67.20, 18.02], [-67.27, 18.18]]],
    [[[-65.50, 18.10], [-65.42, 18.17], [-65.34, 18.14], [-65.38, 18.06], [-65.50, 18.10]]]
  ]),
  polygonFeature("BLM", "Saint Barthélemy", [[[-62.92, 17.88], [-62.84, 17.94], [-62.76, 17.90], [-62.80, 17.84], [-62.89, 17.84], [-62.92, 17.88]]]),
  multiPolygonFeature("KNA", "Saint Kitts and Nevis", [
    [[[-62.84, 17.25], [-62.76, 17.40], [-62.64, 17.34], [-62.67, 17.20], [-62.78, 17.18], [-62.84, 17.25]]],
    [[[-62.66, 17.09], [-62.58, 17.20], [-62.48, 17.15], [-62.52, 17.03], [-62.62, 17.00], [-62.66, 17.09]]]
  ]),
  polygonFeature("LCA", "Saint Lucia", [[[-61.10, 13.72], [-61.07, 14.10], [-60.90, 14.16], [-60.84, 13.90], [-60.94, 13.68], [-61.10, 13.72]]]),
  polygonFeature("MAF", "Saint Martin", [[[-63.18, 18.08], [-63.08, 18.17], [-62.98, 18.16], [-62.96, 18.08], [-63.05, 18.04], [-63.16, 18.04], [-63.18, 18.08]]]),
  polygonFeature("SXM", "Sint Maarten", [[[-63.16, 18.04], [-63.05, 18.04], [-62.96, 18.08], [-62.98, 18.00], [-63.07, 17.96], [-63.17, 17.99], [-63.16, 18.04]]]),
  multiPolygonFeature("VCT", "Saint Vincent and the Grenadines", [
    [[[-61.30, 13.10], [-61.25, 13.36], [-61.10, 13.38], [-61.04, 13.18], [-61.15, 13.03], [-61.30, 13.10]]],
    [[[-61.30, 12.78], [-61.23, 12.86], [-61.16, 12.80], [-61.21, 12.72], [-61.30, 12.78]]],
    [[[-61.22, 12.55], [-61.16, 12.63], [-61.08, 12.58], [-61.13, 12.50], [-61.22, 12.55]]]
  ]),
  multiPolygonFeature("TTO", "Trinidad and Tobago", [
    [[[-61.92, 10.15], [-61.55, 10.82], [-60.85, 10.86], [-60.52, 10.34], [-60.86, 9.98], [-61.45, 9.94], [-61.92, 10.15]]],
    [[[-60.90, 11.17], [-60.72, 11.38], [-60.48, 11.32], [-60.52, 11.13], [-60.74, 11.05], [-60.90, 11.17]]]
  ]),
  multiPolygonFeature("TCA", "Turks and Caicos Islands", [
    [[[-72.40, 21.45], [-72.24, 21.58], [-72.02, 21.54], [-72.08, 21.38], [-72.30, 21.34], [-72.40, 21.45]]],
    [[[-71.92, 21.72], [-71.72, 21.86], [-71.50, 21.80], [-71.58, 21.64], [-71.82, 21.60], [-71.92, 21.72]]],
    [[[-71.30, 21.40], [-71.14, 21.52], [-70.94, 21.46], [-71.00, 21.30], [-71.22, 21.28], [-71.30, 21.40]]]
  ]),
  multiPolygonFeature("VIR", "U.S. Virgin Islands", [
    [[[-65.04, 18.30], [-64.94, 18.38], [-64.83, 18.35], [-64.86, 18.27], [-64.98, 18.24], [-65.04, 18.30]]],
    [[[-64.88, 17.70], [-64.75, 17.78], [-64.58, 17.76], [-64.55, 17.66], [-64.72, 17.61], [-64.88, 17.70]]],
    [[[-64.75, 18.31], [-64.63, 18.39], [-64.52, 18.35], [-64.58, 18.25], [-64.70, 18.24], [-64.75, 18.31]]]
  ])
];

// --- HELPERS ---

const iso3to2 = (iso3) => {
    if (!iso3) return "";
    const code = iso3.toUpperCase();
    if (code.startsWith("US_")) return "US"; 
    const map = {
        POL: "PL", USA: "US", BRA: "BR", PRT: "PT", DEU: "DE", FRA: "FR", GBR: "GB", ITA: "IT",
        ESP: "ES", CAN: "CA", MEX: "MX", CHN: "CN", JPN: "JP", KOR: "KR", IND: "IN", AUS: "AU",
        RUS: "RU", UKR: "UA", TUR: "TR", SEN: "SN", SWE: "SE", NOR: "NO", FIN: "FI", DNK: "DK",
        EGY: "EG", NGA: "NG", KEN: "KE", NAM: "NA", GHA: "GH", CIV: "CI", LBR: "LR", BEN: "BJ",
        MAR: "MA", DZA: "DZ", ETH: "ET", RWA: "RW", ZMB: "ZM", ZWE: "ZW", BWA: "BW", SWZ: "SZ",
        MOZ: "MZ", AGO: "AO", SAU: "SA", ZAF: "ZA",
        SRB: "RS", HRV: "HR", SVN: "SI", BIH: "BA", MNE: "ME", ALB: "AL", MKD: "MK", KOS: "XK",
        LTU: "LT", LVA: "LV", EST: "EE",
        IRL: "IE", ISR: "IL", PSE: "PS", CYP: "CY", BRB: "BB", PRI: "PR", ATG: "AG", AIA: "AI", ABW: "AW", BHS: "BS", BES: "BQ", VGB: "VG", CYM: "KY", CUB: "CU", CUW: "CW", DMA: "DM", DOM: "DO", GRD: "GD", GLP: "GP", HTI: "HT", JAM: "JM", MTQ: "MQ", MSR: "MS", BLM: "BL", KNA: "KN", LCA: "LC", MAF: "MF", SXM: "SX", VCT: "VC", TTO: "TT", TCA: "TC", VIR: "VI" 
    };
    return map[code] || code.slice(0, 2); 
};

const getContinent = (rawCode) => {
    if (!rawCode) return "Other";
    const code = rawCode.toUpperCase();
    if (code.startsWith("US_") || ["USA", "US", "CAN", "CA", "MEX", "MX", "BRB", "BB", "PRI", "PR", "ATG", "AG", "AIA", "AI", "ABW", "AW", "BHS", "BS", "BES", "BQ", "VGB", "VG", "CYM", "KY", "CUB", "CU", "CUW", "CW", "DMA", "DM", "DOM", "DO", "GRD", "GD", "GLP", "GP", "HTI", "HT", "JAM", "JM", "MTQ", "MQ", "MSR", "MS", "BLM", "BL", "KNA", "KN", "LCA", "LC", "MAF", "MF", "SXM", "SX", "VCT", "VC", "TTO", "TT", "TCA", "TC", "VIR", "VI"].includes(code)) return "North America";
    
    const africaCodes = ["EG", "EGY", "NG", "NGA", "SN", "SEN", "NA", "NAM", "GH", "GHA", "CI", "CIV", "LR", "LBR", "BJ", "BEN", "MA", "MAR", "DZ", "DZA", "ET", "ETH", "RW", "RWA", "ZM", "ZMB", "ZW", "ZWE", "BW", "BWA", "SZ", "SWZ", "MZ", "MOZ", "AO", "AGO", "KE", "KEN", "ZA", "ZAF"];
    const europeCodes = ["PL", "POL", "DE", "DEU", "FR", "FRA", "ES", "ESP", "GB", "GBR", "IT", "ITA", "PT", "PRT", "NL", "NLD", "BE", "BEL", "CH", "CHE", "AT", "AUT", "SE", "SWE", "NO", "NOR", "FI", "FIN", "DK", "DNK", "CZ", "CZE", "SK", "SVK", "HU", "HUN", "GR", "GRC", "RO", "ROU", "BG", "BGR", "RS", "SRB", "HR", "HRV", "SI", "SVN", "BA", "BIH", "ME", "MNE", "AL", "ALB", "MK", "MKD", "XK", "KOS", "LT", "LTU", "LV", "LVA", "EE", "EST", "IRL", "IE", "CYP", "CY"];
    const asiaCodes = ["CN", "CHN", "JP", "JPN", "KR", "KOR", "IN", "IND", "TH", "THA", "VN", "VNM", "ID", "IDN", "SA", "SAU", "AE", "ARE", "QA", "QAT", "TR", "TUR", "PH", "PHL", "MY", "MYS", "SG", "SGP", "ISR", "PSE"];
    const southAmericaCodes = ["BR", "BRA", "AR", "ARG", "CL", "CHL", "CO", "COL", "PE", "PER", "UY", "URY", "BO", "BOL", "PY", "PRY"];
    const oceaniaCodes = ["AU", "AUS", "NZ", "NZL", "FJ", "FJI"];

    if (africaCodes.includes(code)) return "Africa";
    if (europeCodes.includes(code)) return "Europe";
    if (asiaCodes.includes(code)) return "Asia";
    if (southAmericaCodes.includes(code)) return "South America";
    if (oceaniaCodes.includes(code)) return "Australia and Oceania";
    return "Other";
};

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

const projectPoint = (lon, lat) => {
  const x = (lon + 180) * (MAP_WIDTH / 360);
  const latRad = lat * Math.PI / 180;
  const mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
  const y = (MAP_HEIGHT / 2) - (MAP_WIDTH * mercN / (2 * Math.PI));
  return [x, y];
};

const generatePath = (geometry) => {
  if (!geometry) return "";
  const processRing = (ring) => {
    if (!ring || ring.length === 0) return "";
    return ring.map((point, i) => {
      const [x, y] = projectPoint(point[0], point[1]);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ") + " Z";
  };
  if (geometry.type === "Polygon") return geometry.coordinates.map(processRing).join(" ");
  if (geometry.type === "MultiPolygon") return geometry.coordinates.map(poly => poly.map(processRing).join(" ")).join(" ");
  return "";
};

const getYoutubeThumbnail = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
};

const getFlagUrl = (code) => code ? `https://flagcdn.com/w160/${code.toLowerCase()}.png` : null;

const App = () => {
  const [theme, setTheme] = useState('dark');
  const activeTheme = THEME_CONFIG[theme];
  const [pins, setPins] = useState([]);
  const [geographies, setGeographies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, countryName: "", flagCode: null, lastThumbnail: null });
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [sortDesc, setSortDesc] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
      "Europe": true, "North America": true, "South America": true, "Asia": true, "Africa": true, "Other": true
  });
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const svgRef = useRef(null);
  const isMobile = windowWidth < 768; 

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [worldRes, statesRes, configRes] = await Promise.all([
          fetch(WORLD_GEO_JSON_URL), fetch(US_STATES_GEO_JSON_URL),
          fetch(DATA_SOURCE_URL).catch(() => null)
        ]);
        const worldData = await worldRes.json();
        const statesData = await statesRes.json();
        let pinsData = FALLBACK_PINS;
        if (configRes && configRes.ok) {
            const json = await configRes.json();
            if (json.pins) pinsData = json.pins;
        }

        const worldFeaturesRaw = worldData.features.filter(f => f.id !== "ATA" && f.id !== "USA");
        const unifiedFeatures = {};

        // ZAAWANSOWANA LOGIKA ŁĄCZENIA TERYTORIÓW (Cypr, Palestyna)
        worldFeaturesRaw.forEach(f => {
            let id = f.id;
            let name = f.properties.name || f.properties.NAME;

            if (id === "CYN" || name === "Northern Cyprus") {
                id = "CYP";
                name = "Cyprus";
            }
            if (id === "PSE" || name === "West Bank" || name === "Gaza") {
                id = "PSE";
                name = "Palestine";
            }

            if (!unifiedFeatures[id]) {
                unifiedFeatures[id] = { ...f, id, properties: { ...f.properties, name } };
            } else {
                const existing = unifiedFeatures[id];
                const newGeom = f.geometry;
                if (existing.geometry.type === "Polygon") {
                    existing.geometry.type = "MultiPolygon";
                    existing.geometry.coordinates = [existing.geometry.coordinates];
                }
                if (newGeom.type === "Polygon") {
                    existing.geometry.coordinates.push(newGeom.coordinates);
                } else if (newGeom.type === "MultiPolygon") {
                    existing.geometry.coordinates.push(...newGeom.coordinates);
                }
            }
        });

        const worldFeatures = Object.values(unifiedFeatures);
        const usStatesFeatures = statesData.features
          .filter(f => f.properties.name !== "Puerto Rico")
          .map(f => ({
            ...f, id: `US_${f.properties.name.replace(/\s+/g, '')}`, properties: { ...f.properties, name: `${f.properties.name} (USA)` }
        }));
        const existingIds = new Set([...worldFeatures, ...usStatesFeatures].map(f => f.id));
        const missingManualFeatures = MANUAL_GEO_FEATURES.filter(f => !existingIds.has(f.id));
        setGeographies([...worldFeatures, ...usStatesFeatures, ...missingManualFeatures]);
        setPins(pinsData);
        setIsLoading(false);
      } catch (err) { setIsLoading(false); setPins(FALLBACK_PINS); }
    };
    fetchAllData();
  }, []);

  const getSvgPoint = (clientX, clientY) => {
    if (!svgRef.current) return null;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return null;
    const point = svgRef.current.createSVGPoint();
    point.x = clientX; point.y = clientY;
    return point.matrixTransform(ctm.inverse());
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 / 1.1 : 1.1;
    setTransform(prev => {
      let newK = Math.min(Math.max(prev.k * direction, 1), 40);
      const pt = getSvgPoint(e.clientX, e.clientY);
      if (!pt || newK === prev.k) return prev;
      return { k: newK, x: pt.x - ((pt.x - prev.x) / prev.k) * newK, y: pt.y - ((pt.y - prev.y) / prev.k) * newK };
    });
  };

  const getStreamsForLocation = (locationId) => {
      return pins.filter(p => 
          (p.locationIds && p.locationIds.includes(locationId)) || 
          p.locationId === locationId
      );
  };

  const groupedStreams = useMemo(() => {
      const groups = pins.reduce((acc, pin) => {
          const codeForContinent = pin.flagCode || (pin.locationIds && pin.locationIds[0]);
          const cat = getContinent(codeForContinent);
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(pin);
          return acc;
      }, {});
      Object.keys(groups).forEach(k => groups[k].sort((a,b) => sortDesc ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)));
      return groups;
  }, [pins, sortDesc]);

  const continentOrder = ["Europe", "North America", "South America", "Asia", "Africa", "Australia and Oceania", "Other"];

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col transition-colors duration-300" style={{ backgroundColor: activeTheme.bg, color: activeTheme.textPrimary }}>
      
      {/* Navbar */}
      <nav className="p-4 shadow-lg flex justify-between items-center z-30 transition-all" style={{ backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border }}>
        <div className="flex items-center gap-3">
          <img src="https://i.ibb.co/Zpq3ZkxZ/pfp.jpg" alt="Speed" className="w-9 h-9 rounded-full border-2 shadow-sm transition-transform hover:scale-105" style={{ borderColor: THEME_CONFIG.accent.primary }} />
          <h1 className="text-lg font-bold tracking-tight text-balance">Speed's IRL World Map</h1>
        </div>
        <div className="flex gap-2 shrink-0">
            <button onClick={() => setTheme(t => t==='dark'?'light':'dark')} className="p-2 rounded-full border hover:opacity-80 transition-opacity">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 rounded-full border hover:opacity-80 transition-opacity"><Menu className="w-5 h-5"/></button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative overflow-hidden bg-black/5 cursor-move touch-none"
             onMouseDown={(e) => { const pt = getSvgPoint(e.clientX, e.clientY); if(pt){ setIsDragging(true); setHasMoved(false); setDragStart({x: pt.x-transform.x, y: pt.y-transform.y}); } }}
             onMouseMove={(e) => { if(isDragging){ const pt = getSvgPoint(e.clientX, e.clientY); if(pt){ if(Math.abs(pt.x-dragStart.x-transform.x)>2) setHasMoved(true); setTransform({k: transform.k, x: pt.x-dragStart.x, y: pt.y-dragStart.y}); } } }} 
             onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}
             onWheel={handleWheel}>
           
           {isLoading ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-red-500"/></div> : (
             <svg ref={svgRef} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="w-full h-full select-none">
                <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                    {geographies.map((geo, i) => {
                        const streams = getStreamsForLocation(geo.id).sort((a,b) => new Date(b.date) - new Date(a.date));
                        const isVisited = streams.length > 0;
                        return (
                            <path key={geo.id || i} d={generatePath(geo.geometry)}
                                  style={{ fill: isVisited ? THEME_CONFIG.accent.visited : activeTheme.map.country, stroke: activeTheme.map.stroke, strokeWidth: 0.5/transform.k, cursor: 'pointer' }}
                                  onMouseEnter={(e) => {
                                      e.target.style.fill = isVisited ? THEME_CONFIG.accent.primaryHover : activeTheme.map.countryHover;
                                      setTooltip({ show: true, x: e.clientX, y: e.clientY, countryName: geo.properties.name, flagCode: iso3to2(geo.id), lastThumbnail: isVisited ? getYoutubeThumbnail(streams[0].videoLink) : null });
                                  }}
                                  onMouseLeave={(e) => { e.target.style.fill = isVisited ? THEME_CONFIG.accent.visited : activeTheme.map.country; setTooltip(t => ({...t, show: false})); }}
                                  onClick={() => { if(!hasMoved) { setSelectedRegion(geo); setIsModalOpen(true); } }} />
                        );
                    })}
                </g>
             </svg>
           )}

           {tooltip.show && (
               <div className="fixed pointer-events-none p-2.5 rounded-xl shadow-2xl flex flex-col gap-1.5 z-50 border backdrop-blur-md animate-in fade-in zoom-in-95"
                    style={{ left: tooltip.x + 15, top: tooltip.y - 15, backgroundColor: activeTheme.panelBg + 'cc', borderColor: activeTheme.border }}>
                   {tooltip.lastThumbnail && <img src={tooltip.lastThumbnail} className="w-32 rounded-lg shadow-sm" alt="" />}
                   <div className="flex items-center gap-1.5 font-bold text-[9px] uppercase tracking-widest">
                       {tooltip.flagCode && <img src={getFlagUrl(tooltip.flagCode)} className="w-3.5 h-2.5 shadow-sm" alt="" />}
                       {tooltip.countryName}
                   </div>
               </div>
           )}

           {/* Elementy Dolne */}
           <div className="absolute bottom-5 left-5 z-20 flex flex-col gap-2.5 pointer-events-none">
              <a href="https://ko-fi.com/cursinal" target="_blank" rel="noopener noreferrer" className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 rounded-full shadow-lg bg-[#29abe0] text-white hover:scale-105 active:scale-95 transition-all">
                  <Coffee className="w-4 h-4" />
                  <span className="text-[11px] font-black tracking-wide">Support on Ko-fi</span>
              </a>
              <div className="px-3 py-1.5 rounded-lg backdrop-blur-md border shadow-sm flex items-center gap-2" style={{ backgroundColor: activeTheme.panelBg + 'cc', borderColor: activeTheme.border, color: activeTheme.textSecondary }}>
                  <span className="text-[10px] font-medium">Made by <span className="font-black" style={{ color: activeTheme.textPrimary }}>Cursinal</span>.</span>
                  <span className="text-[10px] opacity-50 italic">Shout out to Gemini.</span>
              </div>
           </div>

           <div className="absolute bottom-5 right-5 flex flex-col gap-1.5">
                <button onClick={() => setTransform(p => ({...p, k: Math.min(p.k*1.2, 40)}))} className="p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all shadow-sm"><Plus className="w-4 h-4"/></button>
                <button onClick={() => setTransform(p => ({...p, k: Math.max(p.k/1.2, 1)}))} className="p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all shadow-sm"><Minus className="w-4 h-4"/></button>
           </div>
        </div>

        {/* Sidebar */}
        <aside className={`fixed lg:relative inset-y-0 right-0 w-[280px] lg:w-[320px] shadow-xl transition-transform z-40 lg:translate-x-0 border-l ${isSidebarOpen?'translate-x-0':'translate-x-full'}`} style={{ backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border }}>
           <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: activeTheme.border }}>
               <span className="text-lg font-black tracking-tighter leading-none">STREAM ARCHIVE ({pins.length})</span>
               <ArrowDownUp className="w-4 h-4 cursor-pointer opacity-50 hover:opacity-100 shrink-0" onClick={() => setSortDesc(!sortDesc)} />
           </div>
           <div className="overflow-y-auto h-full p-4 space-y-8 pb-32 custom-scrollbar">
               {continentOrder.map(continent => {
                   const items = groupedStreams[continent];
                   if (!items || items.length === 0) return null;
                   return (
                       <div key={continent}>
                           <div className="text-[9px] font-black opacity-30 uppercase mb-3 tracking-[0.2em] cursor-pointer flex items-center gap-1.5" onClick={() => setExpandedSections({...expandedSections, [continent]: !expandedSections[continent]})}>
                               {expandedSections[continent] ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
                               {continent} ({items.length})
                           </div>
                           {expandedSections[continent] && (
                               <div className="space-y-4 pl-2 border-l border-white/5">
                                   {items.map(item => (
                                       <div key={item.id} onClick={() => window.open(item.videoLink, '_blank')} 
                                            className="p-2 rounded-xl border flex gap-3.5 items-center group cursor-pointer hover:bg-white/5 transition-all shadow-sm" 
                                            style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.bg }}>
                                           {/* NAPRAWIONE: Miniatura zamiast flagi */}
                                           <img src={getYoutubeThumbnail(item.videoLink)} className="w-20 h-12 object-cover rounded-lg shadow-sm shrink-0" alt="" />
                                           <div className="min-w-0 flex-1">
                                               <div className="font-bold text-sm whitespace-normal group-hover:text-red-500 transition-colors leading-tight break-words">{item.title}</div>
                                               <div className="text-[10px] opacity-40 mt-1 font-medium">{item.date}</div>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                   );
               })}
           </div>
        </aside>
      </div>

      {/* Region Modal */}
      {isModalOpen && selectedRegion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-xl p-8 rounded-[2rem] border flex flex-col max-h-[80vh] shadow-2xl" style={{ backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border }}>
                  <div className="flex justify-between items-center mb-8 shrink-0">
                      <div className="flex items-center gap-4">
                          <img src={getFlagUrl(iso3to2(selectedRegion.id))} className="w-12 h-8 rounded-lg object-cover shadow-lg" alt="" />
                          <div>
                            <h2 className="text-2xl font-black tracking-tighter">{selectedRegion.properties.name}</h2>
                            <p className="text-xs opacity-30 font-bold uppercase tracking-widest">{getStreamsForLocation(selectedRegion.id).length} STREAMS RECORDED</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-white/5 transition-colors"><X className="w-8 h-8"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                      {getStreamsForLocation(selectedRegion.id).sort((a,b) => new Date(b.date) - new Date(a.date)).map(stream => (
                          <a key={stream.id} href={stream.videoLink} target="_blank" rel="noopener noreferrer" 
                             className="p-4 rounded-2xl border flex gap-6 items-center group transition-all hover:scale-[1.01] shadow-md" 
                             style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.bg }}>
                              <img src={getYoutubeThumbnail(stream.videoLink)} className="w-28 h-16 object-cover rounded-xl shadow-sm shrink-0" alt="" />
                              <div className="min-w-0 flex-1">
                                  <div className="font-black text-lg whitespace-normal mb-1.5 leading-tight break-words">{stream.title}</div>
                                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold opacity-40">
                                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> {stream.date}</span>
                                      <span className="text-red-500 uppercase tracking-widest font-black">WATCH NOW</span>
                                  </div>
                              </div>
                          </a>
                      ))}
                      {getStreamsForLocation(selectedRegion.id).length === 0 && (
                          <div className="h-64 flex flex-col items-center justify-center opacity-20 text-center gap-4"><Video className="w-16 h-16" /><p className="font-black text-xl tracking-widest">NO STREAMS FOUND</p></div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
