import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Moon, Sun, Map as MapIcon, Video, CheckCircle, X, PlayCircle, Loader2, Plus, Minus, Move, MapPin, Calendar, Type, Flag, ExternalLink, Wand2, Terminal, Download, ArrowDownUp, ChevronDown, ChevronRight, Menu } from 'lucide-react';

// --- INITIAL DATA ---
const INITIAL_PINS = [
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
    {
      "id": "1768953230094",
      "lat": 14.644906530693145,
      "lon": -16.86459308917111,
      "title": "irl stream in Senegal 🇸🇳",
      "videoLink": "https://www.youtube.com/watch?v=SNKIio-1uxE",
      "date": "2026-01-20",
      "emoji": "📍",
      "flagCode": "SN",
      "locationId": "SEN"
    }
];

// --- GRAPHIC CONFIGURATION ---
const THEME_CONFIG = {
  accent: {
    primary: "#ef4444",       // Red (Speed)
    primaryHover: "#9bff69",  
    visited: "#65e327",       // Green
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

const pointInPolygon = (point, vs) => {
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1];
        let xj = vs[j][0], yj = vs[j][1];
        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

const findFeatureForPoint = (lat, lon, features) => {
    const point = [lon, lat];
    for (const feature of features) {
        if (!feature.geometry) continue;
        const { type, coordinates } = feature.geometry;
        let isInside = false;

        if (type === 'Polygon') {
            if (pointInPolygon(point, coordinates[0])) isInside = true;
        } else if (type === 'MultiPolygon') {
            for (const polygon of coordinates) {
                if (pointInPolygon(point, polygon[0])) {
                    isInside = true;
                    break;
                }
            }
        }
        if (isInside) return feature;
    }
    return null;
};

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

const inverseProjectPoint = (x, y) => {
  const lon = (x / MAP_WIDTH) * 360 - 180;
  const mercN = ((MAP_HEIGHT / 2) - y) * (2 * Math.PI) / MAP_WIDTH;
  const latRad = 2 * (Math.atan(Math.exp(mercN)) - Math.PI / 4);
  const lat = latRad * 180 / Math.PI;
  return [lon, lat];
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

const getYoutubeId = (url) => {
    if(!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

const getFlagUrl = (code) => {
    if (!code) return null;
    return `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
};

// --- MAIN COMPONENT ---
const App = () => {
  const [theme, setTheme] = useState('dark');
  const activeTheme = THEME_CONFIG[theme];

  const [pins, setPins] = useState(() => {
    const saved = localStorage.getItem('speedMapPins');
    return saved ? JSON.parse(saved) : INITIAL_PINS;
  });

  const [geographies, setGeographies] = useState([]);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  
  const [selectedItem, setSelectedItem] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPinMode, setIsPinMode] = useState(false);
  
  const [formData, setFormData] = useState({ link: "", title: "", date: "", emoji: "📍", flagCode: "", locationId: "" });
  
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [debugLog, setDebugLog] = useState([]);

  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, videoTitle: "", countryName: "", date: "", image: null, flagCode: null });

  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  
  const [sortDesc, setSortDesc] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState({
      "Europa": true, "North America": true, "South America": true,
      "Asia": true, "Africa": true, "Australia and Oceania": true, "Antarctica": true, "Other": true
  });

  // Dodatkowy stan do responsywności
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const toggleSection = (section) => {
      setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const svgRef = useRef(null);

  // --- RESPONSIVE HANDLER ---
  useEffect(() => {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- LOADING MAP ---
  useEffect(() => {
    const fetchData = async () => {
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
                if (f.properties.name === "Swaziland") {
                    f.properties.name = "Eswatini";
                }
                return f;
            });

        const usStatesFeatures = statesData.features.map(f => {
            const stateName = f.properties.name;
            const uniqueId = `US_${stateName.replace(/\s+/g, '')}`;
            return { ...f, id: uniqueId, properties: { ...f.properties, name: `${stateName} (USA)` } };
        });

        setGeographies([...worldFeatures, ...usStatesFeatures]);
        setIsLoadingMap(false);

      } catch (err) {
        console.error("Map initialization error:", err);
        setIsLoadingMap(false);
      }
    };

    fetchData();
  }, []);

  // --- AUTO FIX locationId ---
  useEffect(() => {
      if (geographies.length === 0 || pins.length === 0) return;
      let updated = false;
      const newPins = pins.map(pin => {
          if (!pin.locationId) {
              const feature = findFeatureForPoint(pin.lat, pin.lon, geographies);
              if (feature) {
                  updated = true;
                  return { ...pin, locationId: feature.id, flagCode: pin.flagCode || iso3to2(feature.id) };
              }
          }
          return pin;
      });
      if (updated) setPins(newPins);
  }, [geographies, pins.length]); 

  // --- SAVE TO LOCALSTORAGE ---
  useEffect(() => {
    localStorage.setItem('speedMapPins', JSON.stringify(pins));
  }, [pins]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleExport = () => {
    const dataToExport = {
      pins,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "map_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLinkBlur = () => {
    if (formData.link) fetchVideoDetails(formData.link);
  };

  const fetchVideoDetails = async (url) => {
    const id = getYoutubeId(url);
    if (!id) return;

    setIsFetchingInfo(true);
    setDebugLog([]);
    const addLog = (msg) => setDebugLog(prev => [...prev, msg]);

    try {
        addLog("🚀 Starting fetch (Proxy Scraping)...");
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`;
        
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`Proxy HTTP error: ${res.status}`);
        
        const data = await res.json();
        const html = data.contents;

        if (!html) throw new Error("Pusty HTML");

        addLog("✅ HTML fetched.");

        let foundTitle = "";
        const titleMatch = html.match(/<meta name="title" content="(.*?)">/);
        if (titleMatch && titleMatch[1]) foundTitle = titleMatch[1];
        else {
            const titleTag = html.match(/<title>(.*?) - YouTube<\/title>/);
            if (titleTag && titleTag[1]) foundTitle = titleTag[1];
        }

        let foundDate = "";
        const dateMatch = html.match(/<meta itemprop="datePublished" content="(.*?)">/);
        if (dateMatch && dateMatch[1]) foundDate = dateMatch[1];
        else {
            const jsonDate = html.match(/"uploadDate":"(.*?)"/);
            if (jsonDate && jsonDate[1]) foundDate = jsonDate[1].split('T')[0];
            else {
                 const publishDate = html.match(/"publishDate":"(.*?)"/);
                 if (publishDate && publishDate[1]) foundDate = publishDate[1].split('T')[0];
            }
        }

        addLog(`📝 Title: ${foundTitle || "Not found"}`);
        addLog(`📅 Date: ${foundDate || "Not found"}`);

        if (foundTitle || foundDate) {
            setFormData(prev => ({
                ...prev,
                title: foundTitle || prev.title,
                date: foundDate || prev.date
            }));
        } else {
            addLog("⚠️ Scraping failed, trying NoEmbed...");
            const noembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
            const json = await noembedRes.json();
            if (json.title) {
                setFormData(prev => ({ ...prev, title: json.title }));
                addLog("✅ Title from NoEmbed");
            }
        }
    } catch (error) {
        addLog(`🔥 Error: ${error.message}`);
        try {
            const noembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
            const json = await noembedRes.json();
            if (json.title) {
                setFormData(prev => ({ ...prev, title: json.title }));
                addLog("✅ Title from NoEmbed (fallback)");
            }
        } catch (e) {
            addLog("❌ Failed completely.");
        }
    } finally {
        setIsFetchingInfo(false);
    }
  };

  const getSvgPoint = (clientX, clientY) => {
    if (!svgRef.current) return null; 
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return null; 

    const point = svgRef.current.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    try {
        return point.matrixTransform(ctm.inverse());
    } catch (e) {
        return null;
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const scaleFactor = 1.1;
    const direction = e.deltaY > 0 ? 1 / scaleFactor : scaleFactor;
    setTransform(prev => {
      let newK = prev.k * direction;
      newK = Math.min(Math.max(newK, 1), 32);
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
        setHasMoved(false);
        setDragStart({ x: svgPoint.x - transform.x, y: svgPoint.y - transform.y });
    }
  };

  const handleMove = (clientX, clientY) => {
    if (isDragging) {
      const svgPoint = getSvgPoint(clientX, clientY);
      if (svgPoint) {
          if (!hasMoved && (Math.abs(svgPoint.x - dragStart.x - transform.x) > 2 || Math.abs(svgPoint.y - dragStart.y - transform.y) > 2)) {
             setHasMoved(true);
          }
          setTransform(prev => ({ ...prev, x: svgPoint.x - dragStart.x, y: svgPoint.y - dragStart.y }));
      }
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
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

  const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
         handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
  };
  const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
  };
  const handleTouchEnd = () => handleEnd();

  const zoomToLocation = (lon, lat) => {
      const targetK = Math.max(transform.k, 4); 
      const [pointX, pointY] = projectPoint(lon, lat);
      const newX = 400 - (pointX * targetK);
      const newY = 300 - (pointY * targetK);
      setTransform({ k: targetK, x: newX, y: newY });
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleMapClick = (e, geo = null) => {
    if (hasMoved) return; 

    if (isPinMode) {
        const clientX = e.clientX || (e.changedTouches ? e.changedTouches[0].clientX : 0);
        const clientY = e.clientY || (e.changedTouches ? e.changedTouches[0].clientY : 0);

        const svgPoint = getSvgPoint(clientX, clientY);
        if (!svgPoint) return; 

        const mapX = (svgPoint.x - transform.x) / transform.k;
        const mapY = (svgPoint.y - transform.y) / transform.k;
        const [lon, lat] = inverseProjectPoint(mapX, mapY);
        const newPinId = Date.now().toString();
        
        let locationId = "";
        let flagCode = "";
        if (geo) {
            locationId = geo.id;
            flagCode = iso3to2(geo.id);
        }

        setSelectedItem({ 
            type: 'pin', 
            id: newPinId, 
            isNew: true,
            data: { lat, lon, id: newPinId } 
        });
        setFormData({ 
            link: "", 
            title: "New Stream", 
            date: "", 
            emoji: "📍", 
            flagCode: flagCode,
            locationId: locationId
        });
        setDebugLog([]); 
        setIsModalOpen(true);
        setIsPinMode(false);
        return;
    }
  };

  const handlePinClick = (e, pin) => {
    e.stopPropagation();
    setSelectedItem({ type: 'pin', id: pin.id, data: pin, isNew: false });
    setFormData({ 
        link: pin.videoLink, 
        title: pin.title, 
        date: pin.date, 
        emoji: pin.emoji, 
        flagCode: pin.flagCode || "",
        locationId: pin.locationId || ""
    });
    setDebugLog([]);
    setIsModalOpen(true);
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

  const handleSave = () => {
    if (!selectedItem) return;

    if (selectedItem.type === 'pin') {
        const newPin = {
            id: selectedItem.id,
            lat: selectedItem.data.lat,
            lon: selectedItem.data.lon,
            title: formData.title || "No Title",
            videoLink: formData.link,
            date: formData.date,
            emoji: formData.emoji || "📍",
            flagCode: formData.flagCode,
            locationId: formData.locationId
        };

        if (selectedItem.isNew) {
            setPins(prev => [...prev, newPin]);
        } else {
            setPins(prev => prev.map(p => p.id === selectedItem.id ? newPin : p));
        }
    }
    setIsModalOpen(false);
  };

  const handleRemove = () => {
      if (selectedItem.type === 'pin') {
          setPins(prev => prev.filter(p => p.id !== selectedItem.id));
      }
      setIsModalOpen(false);
  };

  const groupedStreams = useMemo(() => {
      const pinList = pins.map(pin => ({
          id: pin.id,
          type: 'pin',
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

  // --- RESPONSIVE PIN SIZE ---
  const isMobile = windowWidth < 768; 
  // Zmiana: Znacznie powiększamy pinezki dla urządzeń mobilnych (z 30 na 50)
  // PC pozostaje bez zmian (16)
  const BASE_PIN_SIZE = isMobile ? 50 : 16; 
  const BASE_FLAG_SIZE = isMobile ? 30 : 10; 

  return (
    <div className="h-screen w-full overflow-hidden transition-colors duration-300 font-sans flex flex-col"
         style={{ backgroundColor: activeTheme.bg, color: activeTheme.textPrimary }}>
      
      {/* Navbar */}
      <nav className="p-4 shadow-lg flex justify-between items-center z-30 transition-colors duration-300"
           style={{ backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border }}>
        <div className="flex items-center gap-3">
          <div className="relative">
              <img 
                src="IShowSpeed.webp" 
                alt="IShowSpeed" 
                className="w-10 h-10 rounded-full object-cover border-2 shadow-md hover:scale-105 transition-transform"
                style={{ borderColor: THEME_CONFIG.accent.primary }}
              />
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
                onClick={handleExport}
                className="hidden lg:block p-2 rounded-full transition-all hover:opacity-80"
                style={{ backgroundColor: theme === 'dark' ? '#404040' : '#e2e8f0' }}
                title="Export config"
            >
                <Download className="w-5 h-5" style={{ color: activeTheme.textPrimary }} />
            </button>

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
            onClick={(e) => {
                 if(e.target.tagName === 'svg' || e.target.id === 'map-bg' || e.target.tagName === 'g') handleMapClick(e);
            }}
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

           <div className="absolute bottom-4 right-4 lg:top-4 lg:bottom-auto flex flex-col gap-2 z-10">
              <button onClick={() => setIsPinMode(!isPinMode)} title="Add Stream" className={`p-3 rounded-xl shadow-lg transition-all border-2 ${isPinMode ? 'animate-pulse' : ''}`} style={{ backgroundColor: isPinMode ? THEME_CONFIG.accent.pin : activeTheme.panelBg, color: isPinMode ? '#000' : activeTheme.textPrimary, borderColor: isPinMode ? '#fff' : 'transparent' }}><MapPin className="w-6 h-6 lg:w-5 lg:h-5" /></button>
              <div className="h-2 lg:h-4"></div>
              <button onClick={() => setTransform(p => ({...p, k: Math.min(p.k * 1.2, 32)}))} className="p-3 lg:p-2 rounded-lg shadow-lg" style={{ backgroundColor: activeTheme.panelBg, color: activeTheme.textPrimary }}><Plus className="w-6 h-6 lg:w-5 lg:h-5" /></button>
              <button onClick={() => setTransform(p => ({...p, k: Math.max(p.k / 1.2, 1)}))} className="p-3 lg:p-2 rounded-lg shadow-lg" style={{ backgroundColor: activeTheme.panelBg, color: activeTheme.textPrimary }}><Minus className="w-6 h-6 lg:w-5 lg:h-5" /></button>
           </div>

           {isLoadingMap ? (
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
                            cursor: isPinMode ? 'crosshair' : 'default'
                          }}
                          onMouseEnter={(e) => {
                            if(!isVisited) e.target.style.fill = activeTheme.map.countryHover;
                            if(isVisited) e.target.style.fill = THEME_CONFIG.accent.primaryHover;
                            const flagCode = iso3to2(geo.id);
                            handleTooltip(e, { 
                                countryName: `${geo.properties.name} ${isVisited ? '✅' : ''}`,
                                flagCode: isVisited ? flagCode : null
                            });
                          }}
                          onMouseMove={(e) => setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY - 40 }))}
                          onMouseLeave={(e) => {
                            e.target.style.fill = isVisited ? THEME_CONFIG.accent.visited : activeTheme.map.country;
                            hideTooltip();
                          }}
                          onClick={(e) => {
                              e.stopPropagation();
                              if(isPinMode) handleMapClick(e, geo);
                          }}
                        />
                      );
                    })}

                    {pins.map((pin) => {
                        const [px, py] = projectPoint(pin.lon, pin.lat);
                        if (isNaN(px) || isNaN(py)) return null;
                        
                        // RESPONSIVE PIN SIZE LOGIC
                        const pinSize = BASE_PIN_SIZE / transform.k; 
                        const flagWidth = BASE_FLAG_SIZE / transform.k;
                        const flagHeight = (BASE_FLAG_SIZE * 0.75) / transform.k;

                        return (
                            <g 
                                key={pin.id} 
                                transform={`translate(${px}, ${py})`}
                                onClick={(e) => handlePinClick(e, pin)}
                                onMouseEnter={(e) => {
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
                                    hideTooltip();
                                    e.currentTarget.style.transform = `translate(${px}px, ${py}px) scale(1)`;
                                }}
                                style={{ cursor: 'pointer', transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                            >
                                <circle r={pinSize/2} fill="black" opacity="0.3" transform={`translate(0, ${2/transform.k})`} />
                                {pin.flagCode ? (
                                    <>
                                        <circle r={pinSize/2} fill={THEME_CONFIG.accent.pin} stroke="#fff" strokeWidth={1/transform.k} />
                                        <image href={getFlagUrl(pin.flagCode)} x={-flagWidth/2} y={-flagHeight/2} height={flagHeight} width={flagWidth} style={{ pointerEvents: 'none' }} />
                                    </>
                                ) : (
                                    <>
                                        <circle r={pinSize/2} fill={THEME_CONFIG.accent.pin} stroke="#fff" strokeWidth={1/transform.k} />
                                        <text y={-pinSize/1.2} textAnchor="middle" fill={activeTheme.textPrimary} style={{ fontSize: 10/transform.k, fontWeight: 'bold' }}>{pin.emoji}</text>
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
                                        // Open modal like map pin
                                        setSelectedItem({ type: 'pin', id: item.id, data: item.rawPin, isNew: false });
                                        setFormData({ 
                                            link: item.link, 
                                            title: item.title, 
                                            date: item.date, 
                                            emoji: item.icon.props.children || "📍", 
                                            flagCode: item.rawPin.flagCode || "",
                                            locationId: item.rawPin.locationId || ""
                                        });
                                        setIsModalOpen(true);
                                    }}
                                    className="p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all hover:brightness-95 hover:translate-x-1"
                                    style={{ backgroundColor: activeTheme.bg, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 flex justify-center items-center shrink-0">
                                            {item.icon}
                                        </div>
                                        
                                        <div className="truncate">
                                            <div className="font-semibold text-sm truncate">{item.title}</div>
                                            <div className="text-xs opacity-60 flex items-center gap-2">
                                                <span>{item.subtitle}</span>
                                                {item.date !== "9999-12-31" && (
                                                    <span className="flex items-center gap-1 opacity-70">
                                                        • <Calendar className="w-3 h-3"/> {item.date}
                                                    </span>
                                                )}
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

      {/* --- EDIT MODAL --- */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-md p-6 rounded-2xl shadow-2xl scale-100 transition-all border flex flex-col max-h-[90vh] overflow-y-auto"
               style={{ backgroundColor: activeTheme.panelBg, borderColor: activeTheme.border, color: activeTheme.textPrimary }}
               onClick={(e) => e.stopPropagation()} 
          >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        {selectedItem.type === 'pin' && (
                             formData.flagCode ? (
                                <img src={getFlagUrl(formData.flagCode)} alt="flag" className="w-8 h-6 object-cover rounded shadow" />
                             ) : (
                                <span className="text-2xl">{formData.emoji}</span>
                             )
                        )}
                        <h2 className="text-2xl font-bold">{(formData.title || "New Stream")}</h2>
                    </div>
                    <p className="opacity-60 text-sm font-mono mt-1">
                        {selectedItem.type === 'pin' ? `${selectedItem.data.lat.toFixed(2)}, ${selectedItem.data.lon.toFixed(2)}` : ''}
                    </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-black/10 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-4">
                {getYoutubeId(formData.link) ? (
                    <div className="rounded-xl overflow-hidden shadow-lg border relative group" style={{ borderColor: activeTheme.border }}>
                        <img src={getYoutubeThumbnailHighRes(formData.link)} alt="Video Thumbnail" className="w-full h-48 object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    </div>
                ) : (
                   <div className="h-48 rounded-xl border flex items-center justify-center bg-opacity-50" style={{ backgroundColor: activeTheme.bg, borderColor: activeTheme.border }}>
                       <p className="opacity-50 text-sm">Paste YouTube link to see preview</p>
                   </div>
                )}

                <div className="flex gap-2">
                     <div className="w-1/3 space-y-1">
                        <label className="text-xs font-bold opacity-70 flex items-center gap-1"><Flag className="w-3 h-3"/> Flag Code</label>
                        <input type="text" value={formData.flagCode} onChange={(e) => setFormData({...formData, flagCode: e.target.value.toUpperCase(), emoji: ""})} placeholder="e.g. PL" maxLength={2} className="w-full p-2 rounded-lg outline-none border bg-transparent text-center uppercase" style={{ borderColor: activeTheme.border }} />
                     </div>
                     <div className="w-full space-y-1">
                        <label className="text-xs font-bold opacity-70 flex items-center gap-1"><Type className="w-3 h-3"/> Title</label>
                        <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Stream Title" className="w-full p-2 rounded-lg outline-none border bg-transparent" style={{ borderColor: activeTheme.border }} />
                     </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold opacity-70 flex items-center gap-1"><Calendar className="w-3 h-3"/> Date</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-2 rounded-lg outline-none border bg-transparent" style={{ borderColor: activeTheme.border }} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium opacity-80 flex items-center gap-2"><Video className="w-4 h-4" /> Link to YouTube</label>
                    <div className="flex gap-2">
                        <div className="relative w-full">
                            <input type="text" value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} onBlur={handleLinkBlur} placeholder="https://youtube.com/..." className="w-full p-3 rounded-lg outline-none focus:ring-2 transition-all border bg-transparent pr-10" style={{ borderColor: activeTheme.border, focusRing: THEME_CONFIG.accent.primary }} />
                            {isFetchingInfo && (<div className="absolute right-3 top-1/2 transform -translate-y-1/2"><Loader2 className="w-5 h-5 animate-spin text-red-500" /></div>)}
                        </div>
                        <button onClick={() => fetchVideoDetails(formData.link)} className="p-3 rounded-lg border hover:bg-white/10 transition-colors bg-white/5" style={{ borderColor: activeTheme.border }}><Wand2 className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* LOGI DEBUGOWANIA */}
                {debugLog.length > 0 && (
                    <div className="mt-2 p-2 rounded text-[10px] font-mono border bg-black/20 overflow-x-auto whitespace-pre-wrap max-h-24 overflow-y-auto" style={{ borderColor: activeTheme.border }}>
                        <div className="font-bold opacity-70 mb-1 flex items-center gap-1"><Terminal className="w-3 h-3"/> API Logs:</div>
                        {debugLog.map((log, i) => (
                            <div key={i} className="border-b border-white/5 last:border-0 py-0.5">{log}</div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t" style={{ borderColor: activeTheme.border }}>
                {selectedItem.type === 'pin' && !selectedItem.isNew && (
                     <button onClick={handleRemove} className="flex-1 py-3 px-4 rounded-xl font-semibold transition-colors bg-opacity-10 hover:bg-opacity-20" style={{ backgroundColor: activeTheme.textSecondary, color: activeTheme.textPrimary }}>Delete</button>
                )}
                <button onClick={handleSave} className="flex-1 py-3 px-4 rounded-xl text-white font-semibold transition-colors shadow-lg hover:brightness-110" style={{ backgroundColor: selectedItem.type === 'pin' ? THEME_CONFIG.accent.pin : THEME_CONFIG.accent.primary, color: selectedItem.type === 'pin' ? '#000' : '#fff' }}>{selectedItem.isNew ? 'Add Stream' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
