import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Moon, Sun, Map as MapIcon, Video, CheckCircle, X, PlayCircle, Loader2, Plus, Minus, Move, MapPin, Calendar, Type, Flag, ExternalLink, Wand2, Terminal, Download, ArrowDownUp, ChevronDown, ChevronRight, Menu, Coffee } from 'lucide-react';

// --- CONFIGURATION ---
// ZMIANA: Teraz wskazujemy na plik JSON.
// Upewnij się, że plik map_config.json znajduje się w folderze "public" Twojego projektu.
const DATA_SOURCE_URL = "./map_config.json"; 

// --- KONFIGURACJA PRZYBLIŻANIA (ZOOM) ---
// Definiujemy to wyżej, aby użyć w ustawieniach szpilek
const ZOOM_SETTINGS = {
  mobile: {
    min: 1,   // Minimalne oddalenie na telefonie (cały świat)
    max: 20    // Maksymalne przybliżenie na telefonie
  },
  desktop: {
    min: 1,   // Minimalne oddalenie na komputerze
    max: 32   // Maksymalne przybliżenie na komputerze
  }
};

// --- KONFIGURACJA WIELKOŚCI SZPILEK ---
const PIN_SETTINGS = {
  mobile: {
    minZoomSize: 20, // Wielkość szpilki, gdy mapa jest maksymalnie ODDALONA (np. widok świata)
    maxZoomSize: 60, // Wielkość szpilki, gdy mapa jest maksymalnie PRZYBLIŻONA (np. widok miasta)
    flagScale: 0.6   // Proporcja flagi względem kropki
  },
  desktop: {
    minZoomSize: 20,  // Małe kropki przy oddaleniu na PC
    maxZoomSize: 40, // Duże kropki przy zbliżeniu na PC
    flagScale: 0.65
  }
};

// --- DANE ZAPASOWE (Używane tylko, gdy nie uda się pobrać pliku JSON) ---
const FALLBACK_PINS = [
    {
      "id": "1768946582134",
      "lat": 29.568850121079137,
      "lon": 30.599407244283867,
      "title": "irl stream inside the Great Pyramids 🇪🇬🐪👑 (Egypt)",
      "videoLink": "https://www.youtube.com/watch?v=hRQq_MG7RIk",
      "date": "2026-01-15",
      "emoji": "📍",
      "flagCode": "EG",
      "locationId": "EGY"
    },
    // ... reszta danych pozostaje jako fallback ...
];

// --- GRAPHIC CONFIGURATION ---
const THEME_CONFIG = {
  accent: {
    primary: "#ef4444",       // Red (Speed)
    primaryHover: "#9bff69",  // Your green
    visited: "#65e327",       // Your green
    pin: "#fbbf24",           // Yellow
  },
  dark: {
    bg: "#171717",            // neutral-900
    panelBg: "#262626",       // neutral-800
    textPrimary: "#f5f5f5",   // neutral-100
    textSecondary: "#a3a3a3", // neutral-400
    border: "#404040",        // neutral-700
    map: {
      bg: "#0a0a0a",          // neutral-950
      country: "#262626",     // neutral-800
      countryHover: "#404040",// neutral-700
      stroke: "#525252",      // neutral-600
      glow: "rgba(0,0,0,0.5)" 
    }
  },
  light: {
    bg: "#ffffff",            // Pure white
    panelBg: "#ffffff",       // Panel bg (white)
    textPrimary: "#0f172a",   // Primary text (slate-900)
    textSecondary: "#64748b", // Secondary text (slate-500)
    border: "#e2e8f0",        // Borders (slate-200)
    map: {
      bg: "#f0f9ff",          // Very light blue (sky-50) for water
      country: "#cbd5e1",     // Unvisited country (slate-300)
      countryHover: "#94a3b8",// Country on hover
      stroke: "#ffffff",      // Borders
      glow: "rgba(0,0,0,0.1)" 
    }
  }
};

const WORLD_GEO_JSON_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
const US_STATES_GEO_JSON_URL = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";

// --- HELPERS ---

const iso3to2 = (iso3) => {
    if (!iso3) return "";
    if (iso3.startsWith("US_")) return "US"; 
    
    const map = {
        POL: "PL", USA: "US", BRA: "BR", PRT: "PT", DEU: "DE", FRA: "FR", GBR: "GB", ITA: "IT",
        ESP: "ES", CAN: "CA", MEX: "MX", CHN: "CN", JPN: "JP", KOR: "KR", IND: "IN", AUS: "AU",
        RUS: "RU", UKR: "UA", TUR: "TR", SEN: "SN", SWE: "SE", NOR: "NO", FIN: "FI", DNK: "DK",
        NLD: "NL", BEL: "BE", CHE: "CH", AUT: "AT", CZE: "CZ", SVK: "SK", HUN: "HU", ROU: "RO",
        ARG: "AR", COL: "CO", PER: "PE", CHL: "CL", ZAF: "ZA", EGY: "EG", NGA: "NG", KEN: "KE",
        ETH: "ET", DZA: "DZ", RWA: "RW", AGO: "AO", ZWE: "ZW", ZMB: "ZM", BWA: "BW", SWZ: "SZ",
        MOZ: "MZ"
    };
    return map[iso3] || iso3.slice(0, 2); 
};

const getContinent = (rawCode) => {
    if (!rawCode) return "Other";
    const code = rawCode.toUpperCase();
    if (code.startsWith("US_") || code === "USA" || code === "US") return "North America";
    
    const mapping = {
        PL:"Europe", DE:"Europe", FR:"Europe", ES:"Europe", GB:"Europe", IT:"Europe", PT:"Europe",
        NL:"Europe", BE:"Europe", CH:"Europe", AT:"Europe", SE:"Europe", NO:"Europe", FI:"Europe",
        DK:"Europe", CZ:"Europe", SK:"Europe", HU:"Europe", GR:"Europe", RO:"Europe", BG:"Europe",
        HR:"Europe", RS:"Europe", BA:"Europe", AL:"Europe", MK:"Europe", ME:"Europe", SI:"Europe",
        UA:"Europe", BY:"Europe", RU:"Europe", EE:"Europe", LV:"Europe", LT:"Europe", IE:"Europe",
        IS:"Europe",
        CN:"Asia", JP:"Asia", KR:"Asia", IN:"Asia", TH:"Asia", VN:"Asia", ID:"Asia", MY:"Asia",
        SG:"Asia", PH:"Asia", PK:"Asia", BD:"Asia", TR:"Asia", SA:"Asia", AE:"Asia", QA:"Asia",
        IL:"Asia", IR:"Asia", IQ:"Asia", KZ:"Asia", UZ:"Asia",
        CA:"North America", MX:"North America",
        BR:"South America", AR:"South America", CO:"South America", PE:"South America",
        CL:"South America", VE:"South America", EC:"South America", UY:"South America",
        ZA:"Africa", EG:"Africa", NG:"Africa", KE:"Africa", ET:"Africa", GH:"Africa", MA:"Africa",
        DZ:"Africa", TN:"Africa", SZ:"Africa", SN:"Africa", AO:"Africa", ZW:"Africa", ZM:"Africa", 
        BW:"Africa", MZ:"Africa", RW:"Africa",
        AU:"Australia and Oceania", NZ:"Australia and Oceania", FJ:"Australia and Oceania"
    };
    return mapping[code] || "Other";
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
      if (isNaN(x) || isNaN(y)) return ""; 
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ") + " Z";
  };
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(processRing).join(" ");
  } else if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map(poly => poly.map(processRing).join(" ")).join(" ");
  }
  return "";
};

const getYoutubeThumbnail = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    if (!id) return null;
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
};

const getYoutubeThumbnailHighRes = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    if (!id) return null;
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
};

const getFlagUrl = (code) => {
    if (!code) return null;
    return `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
};

// --- MAIN COMPONENT (PUBLIC VERSION) ---
const App = () => {
  const [theme, setTheme] = useState('dark');
  const activeTheme = THEME_CONFIG[theme];

  const [pins, setPins] = useState([]);
  const [geographies, setGeographies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedStream, setSelectedStream] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, videoTitle: "", countryName: "", date: "", image: null, flagCode: null });

  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Ref for pinch-to-zoom logic
  const touchRef = useRef({ dist: null });
  
  const [sortDesc, setSortDesc] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
      "Europa": true, "North America": true, "South America": true,
      "Asia": true, "Africa": true, "Australia and Oceania": true, "Antarctica": true, "Other": true
  });
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const svgRef = useRef(null);

  // --- RESPONSIVE CHECKS ---
  const isMobile = windowWidth < 768; 

  // --- HANDLERS ---
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleSection = (section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

  useEffect(() => {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- LOADING MAP AND CONFIGURATION ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [worldRes, statesRes] = await Promise.all([
          fetch(WORLD_GEO_JSON_URL),
          fetch(US_STATES_GEO_JSON_URL)
        ]);

        const worldData = await worldRes.json();
        const statesData = await statesRes.json();

        const worldFeatures = worldData.features
            .filter(f => f.id !== "ATA" && f.id !== "USA")
            .map(f => {
                if (f.properties.name === "Swaziland") f.properties.name = "Eswatini";
                return f;
            });
        const usStatesFeatures = statesData.features.map(f => {
            const stateName = f.properties.name;
            const uniqueId = `US_${stateName.replace(/\s+/g, '')}`;
            return { ...f, id: uniqueId, properties: { ...f.properties, name: `${stateName} (USA)` } };
        });

        setGeographies([...worldFeatures, ...usStatesFeatures]);

        // Try fetch JSON config
        if (DATA_SOURCE_URL) {
            try {
                console.log("Fetching config from:", DATA_SOURCE_URL);
                const configRes = await fetch(DATA_SOURCE_URL);
                if (configRes.ok) {
                    const configData = await configRes.json();
                    console.log("Config loaded:", configData);
                    setPins(configData.pins || []);
                } else {
                    console.warn("Config file not found or error, using fallback.");
                    setPins(FALLBACK_PINS); 
                }
            } catch (e) {
                console.error("Error fetching config:", e);
                setPins(FALLBACK_PINS); 
            }
        } else {
            setPins(FALLBACK_PINS);
        }

        setIsLoading(false);

      } catch (err) {
        console.error("Critical map initialization error:", err);
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // --- MAP LOGIC ---
  const getSvgPoint = (clientX, clientY) => {
    if (!svgRef.current) return null;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return null;
    const point = svgRef.current.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    try { return point.matrixTransform(ctm.inverse()); } catch (e) { return null; }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const scaleFactor = 1.1;
    const direction = e.deltaY > 0 ? 1 / scaleFactor : scaleFactor;
    
    // Get zoom limits based on device
    const zoomConfig = isMobile ? ZOOM_SETTINGS.mobile : ZOOM_SETTINGS.desktop;

    setTransform(prev => {
      let newK = prev.k * direction;
      newK = Math.min(Math.max(newK, zoomConfig.min), zoomConfig.max);
      
      if (newK === prev.k) return prev;
      const svgPoint = getSvgPoint(e.clientX, e.clientY);
      if (!svgPoint) return prev;
      const mouseX = svgPoint.x;
      const mouseY = svgPoint.y;
      const mapX = (mouseX - prev.x) / prev.k;
      const mapY = (mouseY - prev.y) / prev.k;
      const newX = mouseX - mapX * newK;
      const newY = mouseY - mapY * newK;
      return { k: newK, x: newX, y: newY };
    });
  };

  const handleStart = (clientX, clientY) => {
    const svgPoint = getSvgPoint(clientX, clientY);
    if (svgPoint) {
        setIsDragging(true);
        setDragStart({ x: svgPoint.x - transform.x, y: svgPoint.y - transform.y });
    }
  };

  const handleMove = (clientX, clientY) => {
    if (isDragging) {
      const svgPoint = getSvgPoint(clientX, clientY);
      if (svgPoint) {
          setTransform(prev => ({ ...prev, x: svgPoint.x - dragStart.x, y: svgPoint.y - dragStart.y }));
      }
    }
  };

  const handleEnd = () => setIsDragging(false);

  // --- TOUCH HANDLERS (UPDATED FOR PINCH ZOOM) ---
  
  // Calculate distance between two fingers
  const getTouchDistance = (touches) => {
    return Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
         handleStart(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2) {
         // Pinch start: capture initial distance
         const dist = getTouchDistance(e.touches);
         touchRef.current.dist = dist;
         // Stop standard dragging if we are pinching
         setIsDragging(false); 
      }
  };

  const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2) {
          e.preventDefault(); // Prevent native browser zoom
          
          const newDist = getTouchDistance(e.touches);
          const oldDist = touchRef.current.dist;

          if (oldDist) {
              const scaleFactor = newDist / oldDist;
              
              // Calculate center of the pinch to zoom towards it
              const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
              const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
              
              const svgPoint = getSvgPoint(cx, cy);
              
              // Get zoom limits based on device
              const zoomConfig = isMobile ? ZOOM_SETTINGS.mobile : ZOOM_SETTINGS.desktop;

              if (svgPoint) {
                  setTransform(prev => {
                      let newK = prev.k * scaleFactor;
                      newK = Math.min(Math.max(newK, zoomConfig.min), zoomConfig.max); // Bounds
                      
                      const mouseX = svgPoint.x;
                      const mouseY = svgPoint.y;
                      
                      // Calculate new position to keep the pinch center stable
                      const mapX = (mouseX - prev.x) / prev.k;
                      const mapY = (mouseY - prev.y) / prev.k;
                      const newX = mouseX - mapX * newK;
                      const newY = mouseY - mapY * newK;
                      
                      return { k: newK, x: newX, y: newY };
                  });
              }

              // Update distance for the next movement frame
              touchRef.current.dist = newDist;
          }
      }
  };

  const handleTouchEnd = () => {
      handleEnd();
      touchRef.current.dist = null;
  };

  const handleMouseDown = (e) => {
    if (e.target.tagName !== 'circle' && e.target.tagName !== 'image') {
        handleStart(e.clientX, e.clientY);
    }
  };
  const handleMouseMoveMap = (e) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
  };
  const handleMouseUp = () => handleEnd();
  

  const zoomToLocation = (lon, lat) => {
      const zoomConfig = isMobile ? ZOOM_SETTINGS.mobile : ZOOM_SETTINGS.desktop;
      // Ensure we don't zoom in more than the max allowed config
      const targetK = Math.min(Math.max(transform.k, 4), zoomConfig.max);
      
      const [pointX, pointY] = projectPoint(lon, lat);
      const newX = 400 - (pointX * targetK);
      const newY = 300 - (pointY * targetK);
      setTransform({ k: targetK, x: newX, y: newY });
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  // --- INTERACTION ---
  const openStreamModal = (streamData) => {
      setSelectedStream(streamData);
      setIsModalOpen(true);
  };

  const handlePinClick = (e, pin) => {
      e.stopPropagation();
      openStreamModal(pin);
  };

  const handleTooltip = (e, data) => {
    if (isDragging) return;
    setTooltip({
      show: true,
      x: e.clientX,
      y: e.clientY - 40,
      videoTitle: data.videoTitle,
      countryName: data.countryName,
      date: data.date,
      image: data.image,
      flagCode: data.flagCode
    });
  };

  const hideTooltip = () => setTooltip(prev => ({ ...prev, show: false }));

  // --- LIST ---
  const groupedStreams = useMemo(() => {
      const pinList = pins.map(pin => ({
          id: pin.id,
          title: pin.title,
          subtitle: pin.flagCode ? `Stream` : `Stream`,
          date: pin.date || "9999-12-31",
          link: pin.videoLink,
          lat: pin.lat,
          lon: pin.lon,
          category: getContinent(pin.flagCode),
          icon: pin.flagCode ? (
             <img src={getFlagUrl(pin.flagCode)} alt="flag" className="w-5 h-3 object-cover rounded-[1px] shadow-sm" />
          ) : (
             <span className="text-sm">{pin.emoji}</span>
          ),
          rawPin: pin 
      }));

      const groups = pinList.reduce((acc, stream) => {
          const cat = stream.category;
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(stream);
          return acc;
      }, {});

      Object.keys(groups).forEach(key => {
          groups[key].sort((a, b) => {
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              return sortDesc ? dateB - dateA : dateA - dateB;
          });
      });
      return groups;
  }, [pins, sortDesc]);

  const continentOrder = ["Europe", "North America", "South America", "Asia", "Africa", "Australia and Oceania", "Antarctica", "Other"];

  // Handle Zoom Buttons
  const handleZoomIn = () => {
    const zoomConfig = isMobile ? ZOOM_SETTINGS.mobile : ZOOM_SETTINGS.desktop;
    setTransform(p => ({...p, k: Math.min(p.k * 1.2, zoomConfig.max)}));
  };

  const handleZoomOut = () => {
    const zoomConfig = isMobile ? ZOOM_SETTINGS.mobile : ZOOM_SETTINGS.desktop;
    setTransform(p => ({...p, k: Math.max(p.k / 1.2, zoomConfig.min)}));
  };


  return (
    <div className="h-screen w-full overflow-hidden transition-colors duration-300 font-sans flex flex-col"
         style={{ backgroundColor: activeTheme.bg, color: activeTheme.textPrimary }}>
      
      {/* Navbar */}
      <nav className="p-4 shadow-lg flex justify-between items-center z-30 transition-colors duration-300"
           style={{ backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border }}>
        <div className="flex items-center gap-3">
          <div className="relative">
              <a
              href="https://www.youtube.com/@IShowSpeed"
              target="_blank"
              rel="noopener noreferrer"
              >
                  <img 
                    src="https://i.ibb.co/Zpq3ZkxZ/pfp.jpg" 
                    alt="IShowSpeed" 
                    className="w-10 h-10 rounded-full object-cover border-2 shadow-md hover:scale-105 transition-transform"
                    style={{ borderColor: THEME_CONFIG.accent.primary }}
                  />
              </a>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Speed's IRL Streams</h1>
        </div>
        <div className="flex gap-2 items-center">
            {/* MOBILE MENU TOGGLE */}
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-full transition-all hover:opacity-80"
                style={{ backgroundColor: theme === 'dark' ? '#404040' : '#e2e8f0' }}
            >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden lg:flex items-center gap-3 opacity-80 mr-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_CONFIG.accent.visited }}></span>
                    <span>Visited</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeTheme.map.country }}></span>
                    <span>Unvisited</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_CONFIG.accent.pin }}></span>
                    <span>Stream</span>
                </div>
            </div>

            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full transition-all hover:opacity-80"
              style={{ backgroundColor: theme === 'dark' ? '#404040' : '#e2e8f0' }}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
        
        {/* --- MAP --- */}
        <div 
            className={`flex-1 relative overflow-hidden flex items-center justify-center transition-colors duration-300 cursor-move touch-none`}
            style={{ backgroundColor: activeTheme.map.bg }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMoveMap}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
        >
           {/* TOOLTIP */}
           {tooltip.show && (
             <div 
                className={`fixed z-50 rounded-xl shadow-2xl backdrop-blur-md border pointer-events-none transform -translate-x-1/2 -translate-y-full mb-6 flex flex-col overflow-hidden transition-all duration-200 ${tooltip.videoTitle ? 'w-72 md:w-80 lg:w-72' : 'w-auto min-w-[100px]'}`}
                style={{ 
                    left: tooltip.x, 
                    top: tooltip.y,
                    backgroundColor: activeTheme.panelBg + 'fa', 
                    borderColor: activeTheme.border,
                    color: activeTheme.textPrimary
                }}
             >
               {tooltip.image && (
                   <div className="relative w-full h-48 bg-black">
                       <img src={tooltip.image} alt="Thumbnail" className="w-full h-full object-cover opacity-90" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                   </div>
               )}
               <div className="p-4 text-center flex flex-col gap-2">
                   {tooltip.videoTitle ? (
                       <div className="font-extrabold text-lg leading-snug text-balance shadow-black drop-shadow-sm">
                           {tooltip.videoTitle}
                       </div>
                   ) : null}
                   
                   {tooltip.date && (
                       <div className="text-xs font-semibold opacity-70 flex items-center justify-center gap-1.5 uppercase tracking-wide">
                           <Calendar className="w-3 h-3"/> {tooltip.date}
                       </div>
                   )}
                   
                   {tooltip.countryName && (
                       <div className={`font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${tooltip.videoTitle ? 'text-xs opacity-50 mt-2 pt-3 border-t border-white/10' : 'text-sm opacity-100 whitespace-nowrap'}`}>
                           {tooltip.countryName}
                           {tooltip.flagCode && (
                               <img 
                                   src={getFlagUrl(tooltip.flagCode)} 
                                   alt="flag" 
                                   className="h-3 w-auto rounded-[1px] shadow-sm"
                               />
                           )}
                       </div>
                   )}
               </div>
             </div>
           )}

{/* --- CREDITS & KO-FI (LEWY DOLNY RÓG) --- */}
           <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 items-start pointer-events-none">
              <div className="pointer-events-auto flex flex-col gap-2 items-start animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-backwards">
                  
                  {/* Przycisk Ko-fi */}
                  <a 
                    href="https://ko-fi.com/cursinal" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 hover:shadow-xl"
                    style={{ 
                        backgroundColor: '#29abe0', // Oficjalny kolor Ko-fi
                        color: '#ffffff' 
                    }}
                  >
                      <Coffee className="w-4 h-4 transition-transform group-hover:rotate-12 group-hover:-translate-y-0.5" strokeWidth={2.5} />
                      <span className="text-xs font-extrabold tracking-wide">Support on Ko-fi</span>
                  </a>

                  {/* Panel z napisami */}
                  <div 
                      className="px-3 py-1.5 rounded-lg backdrop-blur-md border shadow-sm flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5"
                      style={{ 
                          backgroundColor: activeTheme.panelBg + 'cc', 
                          borderColor: activeTheme.border,
                          color: activeTheme.textSecondary
                      }}
                  >
                      <span className="text-[10px] font-medium whitespace-nowrap">
                          Made by <span className="font-bold" style={{ color: activeTheme.textPrimary }}>Cursinal</span>.
                      </span>
                      <span className="hidden sm:inline opacity-30">|</span>
                      <span className="text-[10px] opacity-70 italic whitespace-nowrap">
                          Shout out to Gemini.
                      </span>
                  </div>
              </div>
           </div>
          
          <div className="absolute bottom-4 right-4 lg:top-4 lg:bottom-auto flex flex-col gap-2 z-10">
              <div className="h-2 lg:h-4"></div>
              <button onClick={handleZoomIn} className="p-3 lg:p-2 rounded-lg shadow-lg" style={{ backgroundColor: activeTheme.panelBg, color: activeTheme.textPrimary }}><Plus className="w-6 h-6 lg:w-5 lg:h-5" /></button>
              <button onClick={handleZoomOut} className="p-3 lg:p-2 rounded-lg shadow-lg" style={{ backgroundColor: activeTheme.panelBg, color: activeTheme.textPrimary }}><Minus className="w-6 h-6 lg:w-5 lg:h-5" /></button>
           </div>

           {isLoading ? (
             <div className="flex flex-col items-center gap-4 animate-pulse opacity-50">
               <Loader2 className="w-10 h-10 animate-spin" />
             </div>
           ) : (
             <div className="w-full h-full overflow-hidden flex items-center justify-center">
                <svg ref={svgRef} id="map-bg" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="w-full h-full select-none max-w-full max-h-full" style={{ filter: `drop-shadow(0px 0px 20px ${activeTheme.map.glow})` }}>
                  <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`} style={{ transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}>
                    
                    {geographies.map((geo, i) => {
                      const pathD = generatePath(geo.geometry);
                      const isVisited = pins.some(p => p.locationId === geo.id);
                      return (
                        <path
                          key={geo.id || i}
                          d={pathD}
                          className="transition-colors duration-200 ease-in-out outline-none"
                          style={{ 
                            fill: isVisited ? THEME_CONFIG.accent.visited : activeTheme.map.country,
                            stroke: activeTheme.map.stroke,
                            strokeWidth: 1.0 / transform.k,
                            // Cursor: only pointer in Pin Mode, otherwise default
                            cursor: 'default'
                          }}
                          onMouseEnter={(e) => {
                            if(isMobile) return; // FIX: No hover effects on mobile
                            
                            if(!isVisited) e.target.style.fill = activeTheme.map.countryHover;
                            if(isVisited) e.target.style.fill = THEME_CONFIG.accent.primaryHover;
                            const flagCode = iso3to2(geo.id);
                            handleTooltip(e, { 
                                countryName: `${geo.properties.name} ${isVisited ? '✅' : ''}`,
                                flagCode: isVisited ? flagCode : null
                            });
                          }}
                          onMouseMove={(e) => {
                             if(isMobile) return; 
                             setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY - 40 }));
                          }}
                          onMouseLeave={(e) => {
                            if(isMobile) return;
                            e.target.style.fill = isVisited ? THEME_CONFIG.accent.visited : activeTheme.map.country;
                            hideTooltip();
                          }}
                        />
                      );
                    })}

                    {pins.map((pin) => {
                        const [px, py] = projectPoint(pin.lon, pin.lat);
                        if (isNaN(px) || isNaN(py)) return null;
                        
                        // --- CALCULATE DYNAMIC SIZES ---
                        // Wybieramy konfigurację w zależności od urządzenia
                        const currentPinConfig = isMobile ? PIN_SETTINGS.mobile : PIN_SETTINGS.desktop;
                        const currentZoomConfig = isMobile ? ZOOM_SETTINGS.mobile : ZOOM_SETTINGS.desktop;

                        // Obliczamy postęp zoomu (0.0 - 1.0)
                        const zoomRange = currentZoomConfig.max - currentZoomConfig.min;
                        // Zabezpieczenie przed dzieleniem przez zero
                        const safeZoomRange = zoomRange === 0 ? 1 : zoomRange;
                        
                        let zoomProgress = (transform.k - currentZoomConfig.min) / safeZoomRange;
                        // Upewniamy się, że wartość jest między 0 a 1
                        zoomProgress = Math.max(0, Math.min(1, zoomProgress));

                        // Interpolujemy wielkość szpilki
                        const interpolatedSize = currentPinConfig.minZoomSize + (currentPinConfig.maxZoomSize - currentPinConfig.minZoomSize) * zoomProgress;

                        // Obliczamy finalne wymiary SVG (skalowane odwrotnie do zoomu)
                        const pinDiameter = interpolatedSize / transform.k;
                        const flagWidth = pinDiameter * currentPinConfig.flagScale;
                        const flagHeight = flagWidth * 0.75; // Zachowujemy proporcje flagi (4:3)

                        return (
                            <g 
                                key={pin.id} 
                                transform={`translate(${px}, ${py})`}
                                onClick={(e) => handlePinClick(e, pin)}
                                onMouseEnter={(e) => {
                                    if(isMobile) return; // FIX: Disable hover effect on mobile to prevent "double tap" issue
                                    
                                    handleTooltip(e, {
                                        videoTitle: pin.title,
                                        image: getYoutubeThumbnail(pin.videoLink),
                                        date: pin.date,
                                        countryName: "Stream",
                                        flagCode: pin.flagCode
                                    });
                                    e.currentTarget.style.transform = `translate(${px}px, ${py}px) scale(1.3)`;
                                }}
                                onMouseLeave={(e) => {
                                    if(isMobile) return;
                                    
                                    hideTooltip();
                                    e.currentTarget.style.transform = `translate(${px}px, ${py}px) scale(1)`;
                                }}
                                style={{ cursor: 'pointer', transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                            >
                                <circle r={pinDiameter/2} fill="black" opacity="0.3" transform={`translate(0, ${2/transform.k})`} />
                                {pin.flagCode ? (
                                    <>
                                        <circle r={pinDiameter/2} fill={THEME_CONFIG.accent.pin} stroke="#fff" strokeWidth={1/transform.k} />
                                        <image href={getFlagUrl(pin.flagCode)} x={-flagWidth/2} y={-flagHeight/2} height={flagHeight} width={flagWidth} style={{ pointerEvents: 'none' }} />
                                    </>
                                ) : (
                                    <>
                                        <circle r={pinDiameter/2} fill={THEME_CONFIG.accent.pin} stroke="#fff" strokeWidth={1/transform.k} />
                                        <text y={-pinDiameter/1.2} textAnchor="middle" fill={activeTheme.textPrimary} style={{ fontSize: (pinDiameter * 0.6), fontWeight: 'bold' }}>{pin.emoji}</text>
                                    </>
                                )}
                            </g>
                        )
                    })}
                  </g>
                </svg>
             </div>
           )}
        </div>

        {/* --- SIDEBAR (RESPONSIVE) --- */}
        <div className={`
             fixed inset-y-0 right-0 w-80 lg:w-96 shadow-2xl transform transition-transform duration-300 z-40 lg:relative lg:translate-x-0 border-l flex flex-col h-full
             ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
             `}
             style={{ backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border }}>
          
          <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: activeTheme.border }}>
             <h2 className="text-lg font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" style={{ color: THEME_CONFIG.accent.visited }} />
                Stream List ({pins.length})
             </h2>
             <div className="flex gap-2">
                 <button onClick={() => setSortDesc(!sortDesc)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title={sortDesc ? "Newest first" : "Oldest first"}>
                     <ArrowDownUp className={`w-4 h-4 ${sortDesc ? 'opacity-100' : 'opacity-50'}`} />
                 </button>
                 {/* Close button for mobile */}
                 <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors">
                     <X className="w-5 h-5" />
                 </button>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4"> 
            {continentOrder.map(continent => {
                const items = groupedStreams[continent];
                if (!items || items.length === 0) return null;
                const isExpanded = expandedSections[continent];

                return (
                    <div key={continent} className="space-y-2">
                        <div 
                            className="flex items-center gap-2 text-xs font-bold uppercase opacity-60 px-2 cursor-pointer hover:opacity-100 transition-opacity"
                            onClick={() => toggleSection(continent)}
                        >
                            {isExpanded ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
                            {continent} ({items.length})
                        </div>

                        {isExpanded && (
                            <div className="space-y-2 pl-2 border-l border-white/5 ml-1">
                                {items.map((item) => (
                                <div key={item.id} 
                                    onClick={() => {
                                        zoomToLocation(item.lon, item.lat);
                                        openStreamModal(item.rawPin);
                                    }}
                                    className="p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all hover:brightness-95 hover:translate-x-1"
                                    style={{ backgroundColor: activeTheme.bg, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 flex justify-center items-center shrink-0">{item.icon}</div>
                                        <div className="truncate">
                                            <div className="font-semibold text-sm truncate">{item.title}</div>
                                            <div className="text-xs opacity-60 flex items-center gap-2">
                                                <span>Stream</span>
                                                {item.date !== "9999-12-31" && <span className="flex items-center gap-1 opacity-70">• <Calendar className="w-3 h-3"/> {item.date}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
          </div>
        </div>
      </div>

      {/* --- PREVIEW MODAL (READ-ONLY) --- */}
      {isModalOpen && selectedStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-md p-0 rounded-2xl shadow-2xl overflow-hidden scale-100 transition-all border"
               style={{ backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border, color: activeTheme.textPrimary }}
               onClick={(e) => e.stopPropagation()} 
          >
            {/* Header with image */}
            <div className="relative h-48 bg-black">
                {getYoutubeThumbnail(selectedStream.videoLink) ? (
                    <img src={getYoutubeThumbnailHighRes(selectedStream.videoLink)} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500">No thumbnail</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl font-bold text-white leading-tight shadow-black drop-shadow-md">{selectedStream.title}</h2>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 text-sm opacity-80">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {selectedStream.date || "No date"}
                    </div>
                    {selectedStream.flagCode && (
                        <div className="flex items-center gap-2">
                            <Flag className="w-4 h-4" />
                            <img src={getFlagUrl(selectedStream.flagCode)} alt="Flag" className="w-5 h-auto rounded-sm" />
                        </div>
                    )}
                </div>

                {selectedStream.videoLink && (
                    <a 
                        href={selectedStream.videoLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        style={{ backgroundColor: THEME_CONFIG.accent.primary }}
                    >
                        <PlayCircle className="w-5 h-5" />
                        Watch on YouTube
                    </a>
                )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;

