
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import DPSSchoolsEnhanced from './DPSSchoolsEnhanced';

const COMap = () => {
  const [geoData, setGeoData] = useState(null);
  const [districtData, setDistrictData] = useState({});
  const [nameMapping, setNameMapping] = useState({});
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [districtNames, setDistrictNames] = useState([]);
  const [mapRef, setMapRef] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState("enrollment");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [viewMode, setViewMode] = useState("districts"); // "districts" or "dps"
  const [dpsSchoolData, setDpsSchoolData] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [dpsMapRef, setDpsMapRef] = useState(null);
  const denverCounty1 = "Denver County 1";


  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}School_Districts.geojson`)
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
        // Extract district names from GeoJSON
        if (data && data.features) {
          const names = data.features
            .map(feature => feature.properties.lgname)
            .filter(name => name)
            .sort((a, b) => a.localeCompare(b));
          setDistrictNames(names);
        }
      });

    fetch(`${import.meta.env.BASE_URL}district_data_complete.json?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('Loaded district data:', Object.keys(data).length, 'districts');
        // Check sample district
        if (data['Academy 20']) {
          console.log('Academy 20 enrollment years:', data['Academy 20'].enrollment_trends.map(e => e.year));
        }
        setDistrictData(data);
      });
      
    fetch(`${import.meta.env.BASE_URL}district_name_mapping.json`)
      .then((res) => res.json())
      .then((data) => setNameMapping(data))
      .catch(() => console.log("No name mapping file found"));
      
    // Load DPS school data
    fetch(`${import.meta.env.BASE_URL}dps_schools_data_multi_year.json`)
      .then((res) => res.json())
      .then((data) => {
        console.log('Loaded DPS school data:', data.schoolCount, 'schools');
        setDpsSchoolData(data);
      })
      .catch((err) => console.log("Error loading DPS school data:", err));
  }, []);

  const getDistrictData = (name) => {
    // Check manual mapping first
    if (nameMapping[name]) {
      const mappedName = nameMapping[name];
      if (mappedName && districtData[mappedName]) return districtData[mappedName];
    }
    
    // Direct match
    if (districtData[name]) return districtData[name];
    
    // Remove " School District" suffix if present
    const cleanName = name.replace(/ School District$/i, '').trim();
    if (districtData[cleanName]) return districtData[cleanName];
    
    // Try case-insensitive match
    const lowerName = cleanName.toLowerCase();
    const caseMatch = Object.keys(districtData).find(d => d.toLowerCase() === lowerName);
    if (caseMatch) return districtData[caseMatch];
    
    // Fuzzy match
    const fuzzyMatch = Object.keys(districtData).find((d) => {
      const dLower = d.toLowerCase();
      return lowerName.includes(dLower) || dLower.includes(lowerName);
    });
    return fuzzyMatch ? districtData[fuzzyMatch] : null;
  };

  // Function to normalize data to include all years from 2014-2024
  const normalizeYearData = (data, dataKey) => {
    // Different year ranges for different data types
    const allYears = dataKey === 'cmas' 
      ? ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024']  // CMAS only from 2016
      : ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];  // Enrollment from 2014
    const dataMap = new Map();
    
    // Create map of existing data
    if (data && Array.isArray(data)) {
      data.forEach(item => {
        dataMap.set(item.year, item);
      });
    }
    
    // Fill in all years
    return allYears.map(year => {
      const existing = dataMap.get(year);
      if (existing) {
        return existing;
      } else {
        // Return null data for missing years
        if (dataKey === 'enrollment') {
          return { year, enrollment: null, frl: null };
        } else if (dataKey === 'cmas') {
          return { year, met_or_exceeded_pct: null };
        }
      }
    });
  };

  const district = selectedDistrict ? getDistrictData(selectedDistrict) : null;
  const enrollment = normalizeYearData(district?.enrollment_trends, 'enrollment');
  const cmas = normalizeYearData(district?.cmas_scores, 'cmas');
  
  
  // Get Denver County 1 data for comparison
  const denverData = getDistrictData(denverCounty1);
  const denverEnrollment = normalizeYearData(denverData?.enrollment_trends, 'enrollment');
  const denverCmas = normalizeYearData(denverData?.cmas_scores, 'cmas');

  // Calculate shared Y-axis domains for fair visual comparison
  const getSharedDomain = (data1, data2, key) => {
    const values1 = data1 ? data1.map(d => d[key]).filter(v => v !== null) : [];
    const values2 = data2 ? data2.map(d => d[key]).filter(v => v !== null) : [];
    const allValues = [...values1, ...values2];
    
    if (allValues.length === 0) return [0, 100];
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    
    // For percentages, always use 0-100
    if (key === 'frl' || key === 'met_or_exceeded_pct') {
      return [0, Math.max(100, Math.ceil(max / 10) * 10)];
    }
    
    // For enrollment, add some padding
    const padding = (max - min) * 0.1;
    return [Math.max(0, Math.floor((min - padding) / 1000) * 1000), Math.ceil((max + padding) / 1000) * 1000];
  };

  const enrollmentDomain = getSharedDomain(enrollment, denverEnrollment, 'enrollment');
  const frlDomain = getSharedDomain(enrollment, denverEnrollment, 'frl');
  const cmasDomain = getSharedDomain(cmas, denverCmas, 'met_or_exceeded_pct');

  // Filter districts based on search term
  const filteredDistricts = districtNames.filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle district selection from search
  const handleDistrictSelect = (districtName) => {
    setSelectedDistrict(districtName);
    setSearchTerm("");
    
    // Find the district feature and zoom to it
    if (geoData && mapRef) {
      const feature = geoData.features.find(f => f.properties.lgname === districtName);
      if (feature && feature.geometry) {
        const bounds = L.geoJSON(feature).getBounds();
        mapRef.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };


  // Get performance metrics for all districts for the selected year
  const getPerformanceMetrics = () => {
    const metrics = { enrollment: [], frl: [], cmas: [] };
    
    Object.entries(districtData).forEach(([districtName, data]) => {
      // Enrollment for selected year
      const enrollmentData = data.enrollment_trends?.find(t => t.year === selectedYear);
      if (enrollmentData && enrollmentData.enrollment) {
        metrics.enrollment.push(enrollmentData.enrollment);
      }
      
      // FRL for selected year
      const frlData = data.enrollment_trends?.find(t => t.year === selectedYear);
      if (frlData && frlData.frl !== null && frlData.frl !== undefined) {
        metrics.frl.push(frlData.frl);
      }
      
      // CMAS for selected year
      const cmasData = data.cmas_scores?.find(s => s.year === selectedYear);
      if (cmasData && cmasData.met_or_exceeded_pct !== null) {
        metrics.cmas.push(cmasData.met_or_exceeded_pct);
      }
    });
    
    // Calculate min/max for each metric
    return {
      enrollment: {
        min: Math.min(...metrics.enrollment),
        max: Math.max(...metrics.enrollment)
      },
      frl: {
        min: Math.min(...metrics.frl),
        max: Math.max(...metrics.frl)
      },
      cmas: {
        min: Math.min(...metrics.cmas),
        max: Math.max(...metrics.cmas)
      }
    };
  };
  
  // Get color for district based on performance
  const getDistrictColor = (name) => {
    const data = getDistrictData(name);
    if (!data) return '#e0e0e0'; // Gray for no data
    
    const metrics = getPerformanceMetrics();
    let value, min, max, colorScale;
    
    if (selectedMetric === 'enrollment') {
      const enrollment = data.enrollment_trends?.find(t => t.year === selectedYear)?.enrollment;
      if (!enrollment) return '#e0e0e0';
      
      value = enrollment;
      min = metrics.enrollment.min;
      max = metrics.enrollment.max;
      // Blue scale for enrollment (light to dark = low to high)
      colorScale = ['#e6f2ff', '#b3d9ff', '#80bfff', '#4da6ff', '#1a8cff', '#0066cc', '#004c99'];
      
    } else if (selectedMetric === 'frl') {
      const frl = data.enrollment_trends?.find(t => t.year === selectedYear)?.frl;
      if (frl === null || frl === undefined) return '#e0e0e0';
      
      // For FRL, lower is better, so invert the scale
      value = frl;
      min = metrics.frl.min;
      max = metrics.frl.max;
      // Orange scale for FRL (light to dark = high to low percentage)
      colorScale = ['#663300', '#994d00', '#cc6600', '#ff8000', '#ff9933', '#ffb366', '#ffcc99'].reverse();
      
    } else if (selectedMetric === 'cmas') {
      const cmas = data.cmas_scores?.find(s => s.year === selectedYear)?.met_or_exceeded_pct;
      if (cmas === null || cmas === undefined) return '#e0e0e0';
      
      value = cmas;
      min = metrics.cmas.min;
      max = metrics.cmas.max;
      // Green scale for CMAS (light to dark = low to high)
      colorScale = ['#e6ffe6', '#b3ffb3', '#80ff80', '#4dff4d', '#1aff1a', '#00cc00', '#008000'];
    }
    
    // Normalize value to 0-1 range
    const normalized = (value - min) / (max - min);
    const index = Math.floor(normalized * (colorScale.length - 1));
    
    return colorScale[Math.min(Math.max(index, 0), colorScale.length - 1)];
  };

  const onEachDistrict = (feature, layer) => {
    const name = feature.properties.lgname;
    
    layer.on({
      click: () => setSelectedDistrict(name),
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: 'hsla(185.53, 59%, 37%, 1)',
          fillOpacity: 0.85
        });
        layer.bringToFront();
      },
      mouseout: (e) => {
        geoData && e.target.setStyle(districtStyle(feature));
      }
    });
    
    layer.bindTooltip(name, { 
      sticky: true,
      className: 'district-tooltip'
    });
  };

  // Style function for GeoJSON
  const districtStyle = (feature) => {
    const name = feature.properties.lgname;
    const isSelected = name === selectedDistrict;
    const isDenver = name === denverCounty1;
    
    return {
      color: isSelected ? 'hsla(185.53, 59%, 47%, 1)' : isDenver ? '#dc2626' : '#94a3b8',
      weight: isSelected || isDenver ? 3 : 1,
      fillColor: getDistrictColor(name),
      fillOpacity: isSelected || isDenver ? 0.8 : 0.6,
      dashArray: isDenver && !isSelected ? '5, 5' : null,
    };
  };

  // Component for rendering district charts
  const DistrictPanel = ({ districtName, districtData, enrollmentData, cmasData, isComparison = false, domains = {}, selectedMetric }) => {
    
    const renderChart = () => {
      switch(selectedMetric) {
        case "enrollment":
          return (
            <>
              <h3>Student Enrollment</h3>
              {enrollmentData && enrollmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={enrollmentData} margin={{ top: 20, right: 30, left: 30, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="year" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      domain={domains.enrollment || 'auto'}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      formatter={(value, name) => value !== null ? [value.toLocaleString(), name] : ['No data', name]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="enrollment" 
                      stroke={isComparison ? "#dc2626" : "hsla(185.53, 59%, 47%, 1)"} 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: isComparison ? "#dc2626" : "hsla(185.53, 59%, 47%, 1)" }} 
                      name="Students" 
                      connectNulls={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px 0', fontSize: '14px' }}>
                  Enrollment data not available
                </p>
              )}
            </>
          );
          
        case "frl":
          return (
            <>
              <h3>Free/Reduced Lunch %</h3>
              {enrollmentData && enrollmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={enrollmentData} margin={{ top: 20, right: 30, left: 30, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="year" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      domain={domains.frl || [0, 100]} 
                    />
                    <Tooltip 
                      contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      formatter={(value, name) => value !== null ? [`${value}%`, name] : ['No data', name]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="frl" 
                      stroke={isComparison ? "#dc2626" : "hsla(185.53, 59%, 47%, 1)"} 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: isComparison ? "#dc2626" : "hsla(185.53, 59%, 47%, 1)" }} 
                      name="FRL %" 
                      connectNulls={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px 0', fontSize: '14px' }}>
                  FRL data not available
                </p>
              )}
            </>
          );
          
        case "cmas":
          return (
            <>
              <h3>CMAS % Met/Exceeded</h3>
              {cmasData && cmasData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={cmasData} margin={{ top: 30, right: 40, left: 40, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="year" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      domain={domains.cmas || [0, 100]} 
                    />
                    <Tooltip 
                      contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          if (data.note) {
                            return (
                              <div style={{ padding: '10px', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
                                <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>{data.note}</p>
                              </div>
                            );
                          }
                          return (
                            <div style={{ padding: '10px', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                              <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
                              <p style={{ margin: '4px 0', color: isComparison ? "#dc2626" : 'hsla(185.53, 59%, 47%, 1)' }}>
                                CMAS: {data.met_or_exceeded_pct !== null ? `${data.met_or_exceeded_pct}%` : 'No data'}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="met_or_exceeded_pct" 
                      stroke={isComparison ? "#dc2626" : "hsla(185.53, 59%, 47%, 1)"}
                      strokeWidth={3} 
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        // Don't render dots for null values
                        if (payload.met_or_exceeded_pct === null) {
                          return null;
                        }
                        if (payload.note) {
                          return (
                            <g transform={`translate(${cx},${cy})`}>
                              <circle r="4" fill="#999" stroke="#fff" strokeWidth="2"/>
                            </g>
                          );
                        }
                        return <circle cx={cx} cy={cy} r="4" fill={isComparison ? "#dc2626" : "hsla(185.53, 59%, 47%, 1)"} stroke="#fff" strokeWidth="2"/>;
                      }} 
                      name="CMAS %" 
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px 0', fontSize: '14px' }}>
                  CMAS data not available
                </p>
              )}
            </>
          );
          
        default:
          return null;
      }
    };
    
    return (
      <div className={`district-panel ${isComparison ? 'comparison' : ''}`}>
        <div className="district-header">
          <h2>{districtName || "Select a District"}</h2>
          {isComparison && (
            <p className="comparison-note">Baseline for comparison</p>
          )}
        </div>
        <div className="chart-section">
          {renderChart()}
        </div>
      </div>
    );
  };

  // Combine data for both districts
  const getCombinedData = (metric) => {
    switch(metric) {
      case "enrollment":
        return enrollment.map((item, index) => ({
          year: item.year,
          [selectedDistrict || "District"]: item.enrollment,
          [denverCounty1]: denverEnrollment[index]?.enrollment
        }));
      case "frl":
        return enrollment.map((item, index) => ({
          year: item.year,
          [selectedDistrict || "District"]: item.frl,
          [denverCounty1]: denverEnrollment[index]?.frl
        }));
      case "cmas":
        return cmas.map((item, index) => ({
          year: item.year,
          [selectedDistrict || "District"]: item.met_or_exceeded_pct,
          [denverCounty1]: denverCmas[index]?.met_or_exceeded_pct
        }));
      default:
        return [];
    }
  };

  return (
    <>
      <header className="app-header">
        <h1>Colorado School District Data Dashboard</h1>
        <p>Compare enrollment, Free/Reduced Lunch rates, and CMAS performance across districts</p>
        <div className="view-mode-toggle">
          <button 
            className={viewMode === "districts" ? "active" : ""} 
            onClick={() => setViewMode("districts")}
          >
            District Comparison
          </button>
          <button 
            className={viewMode === "dps" ? "active" : ""} 
            onClick={() => setViewMode("dps")}
          >
            DPS Schools
          </button>
        </div>
      </header>
      <div className="app-container">
        {viewMode === "districts" ? (
          <>
            <div className="map-panel">
              <MapContainer 
                center={[39.0, -105.5]} 
                zoom={7} 
                style={{ height: "80vh", width: "100%", borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                minZoom={6}
                maxZoom={12}
                maxBounds={[[36.5, -109.5], [41.5, -101.5]]}
                maxBoundsViscosity={1.0}
              >
                <TileLayer 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {geoData && <GeoJSON key={`${selectedMetric}-${selectedYear}`} data={geoData} onEachFeature={onEachDistrict} style={districtStyle} />}
              </MapContainer>
            </div>
        <div className="comparison-container">
          <div className="control-panel">
            <div className="metric-selector">
              <label htmlFor="metric-select">Metric:</label>
              <select 
                id="metric-select"
                className="metric-dropdown"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                <option value="enrollment">Student Enrollment</option>
                <option value="frl">Free/Reduced Lunch %</option>
                <option value="cmas">CMAS % Met/Exceeded</option>
              </select>
            </div>
            
            <div className="year-selector">
              <label htmlFor="year-select">Year:</label>
              <select 
                id="year-select"
                className="year-dropdown"
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {selectedMetric === 'cmas' ? (
                  <>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                    <option value="2020">2020</option>
                    <option value="2019">2019</option>
                    <option value="2018">2018</option>
                    <option value="2017">2017</option>
                    <option value="2016">2016</option>
                  </>
                ) : (
                  <>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                    <option value="2020">2020</option>
                    <option value="2019">2019</option>
                    <option value="2018">2018</option>
                    <option value="2017">2017</option>
                    <option value="2016">2016</option>
                    <option value="2015">2015</option>
                    <option value="2014">2014</option>
                  </>
                )}
              </select>
            </div>
          </div>
          
          <div className="legend-panel">
            <h4>Performance Legend</h4>
            {selectedMetric === 'enrollment' && (
              <div className="legend-item">
                <div className="legend-gradient enrollment-gradient"></div>
                <div className="legend-labels">
                  <span>Lower</span>
                  <span>Higher (Better)</span>
                </div>
              </div>
            )}
            {selectedMetric === 'frl' && (
              <div className="legend-item">
                <div className="legend-gradient frl-gradient"></div>
                <div className="legend-labels">
                  <span>Higher</span>
                  <span>Lower (Better)</span>
                </div>
              </div>
            )}
            {selectedMetric === 'cmas' && (
              <div className="legend-item">
                <div className="legend-gradient cmas-gradient"></div>
                <div className="legend-labels">
                  <span>Lower</span>
                  <span>Higher (Better)</span>
                </div>
              </div>
            )}
            <div className="legend-item no-data">
              <div className="no-data-box"></div>
              <span>No Data</span>
            </div>
          </div>
          
          <div className="combined-chart-panel">
            <div className="chart-header">
              <h3>
                {selectedMetric === "enrollment" && "Student Enrollment"}
                {selectedMetric === "frl" && "Free/Reduced Lunch %"}
                {selectedMetric === "cmas" && "CMAS % Met/Exceeded"}
              </h3>
              <div className="districts-shown">
                <span className="district-label selected">
                  <span className="color-indicator" style={{background: "hsla(185.53, 59%, 47%, 1)"}}></span>
                  {selectedDistrict || "Select a District"}
                </span>
                <span className="district-label denver">
                  <span className="color-indicator" style={{background: "#dc2626"}}></span>
                  {denverCounty1}
                </span>
              </div>
            </div>
            
            <div className="chart-section">
              {selectedDistrict ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart 
                    data={getCombinedData(selectedMetric)} 
                    margin={{ top: 20, right: 30, left: 50, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" />
                    <YAxis 
                      tick={{ fontSize: 11 }} 
                      domain={
                        selectedMetric === "enrollment" ? enrollmentDomain :
                        selectedMetric === "frl" ? frlDomain :
                        cmasDomain
                      }
                    />
                    <Tooltip 
                      contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      formatter={(value, name) => {
                        if (value === null || value === undefined) return ['No data', name];
                        if (selectedMetric === "enrollment") return [value.toLocaleString(), name];
                        return [`${value}%`, name];
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      iconType="line"
                      wrapperStyle={{ paddingTop: '10px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={selectedDistrict || "District"}
                      stroke="hsla(185.53, 59%, 47%, 1)"
                      strokeWidth={3} 
                      dot={{ r: 4, fill: "hsla(185.53, 59%, 47%, 1)" }}
                      connectNulls={true}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={denverCounty1}
                      stroke="#dc2626"
                      strokeWidth={3} 
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: "#dc2626" }}
                      connectNulls={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px 0', fontSize: '16px' }}>
                  Please select a district from the map to compare with {denverCounty1}
                </p>
              )}
            </div>
          </div>
        </div>
          </>
        ) : (
          <DPSSchoolsEnhanced />
        )}
      </div>
    </>
  );
};

// DPS Schools View Component
const DPSSchoolsView = ({ schoolData, selectedSchool, setSelectedSchool, mapRef, setMapRef }) => {
  if (!schoolData) {
    return (
      <div className="dps-schools-view">
        <div className="loading-message">Loading DPS school data...</div>
      </div>
    );
  }

  // Get color for chronic absenteeism rate
  const getAbsenteeismColor = (rate) => {
    if (rate === null || rate === undefined) return '#999';
    const percent = rate * 100;
    if (percent >= 80) return '#8b0000'; // Dark red - critical
    if (percent >= 60) return '#dc143c'; // Crimson - severe
    if (percent >= 40) return '#ff6347'; // Tomato - high
    if (percent >= 20) return '#ffa500'; // Orange - concerning
    return '#32cd32'; // Green - acceptable
  };

  // Create custom icon based on absenteeism rate
  const createSchoolIcon = (school) => {
    const rate = school.attendance['2023-2024']?.chronicAbsentRate;
    const color = getAbsenteeismColor(rate);
    const size = Math.max(15, Math.min(40, school.enrollment['2024']?.total / 50 || 20));
    
    return L.divIcon({
      className: 'school-marker',
      html: `<div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid ${rate >= 0.5 ? '#fff' : '#333'};
        opacity: 0.8;
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  };

  // Calculate summary statistics
  const getStats = () => {
    const schools = schoolData.schools.filter(s => s.attendance['2023-2024']);
    const rates = schools.map(s => s.attendance['2023-2024'].chronicAbsentRate * 100);
    const critical = schools.filter(s => s.attendance['2023-2024'].chronicAbsentRate >= 0.8).length;
    const severe = schools.filter(s => s.attendance['2023-2024'].chronicAbsentRate >= 0.6).length;
    const high = schools.filter(s => s.attendance['2023-2024'].chronicAbsentRate >= 0.5).length;
    
    return {
      total: schools.length,
      average: rates.reduce((a, b) => a + b, 0) / schools.length,
      critical,
      severe,
      high,
      worst: schools.sort((a, b) => 
        b.attendance['2023-2024'].chronicAbsentRate - a.attendance['2023-2024'].chronicAbsentRate
      ).slice(0, 10)
    };
  };

  const stats = getStats();

  return (
    <>
      <div className="dps-map-container">
        <div className="dps-map-panel">
          <MapContainer
            center={[39.7392, -104.9903]} // Denver center
            zoom={11}
            style={{ height: "70vh", width: "100%", borderRadius: '12px' }}
            ref={setMapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {schoolData.schools.map((school, idx) => (
              <Marker
                key={idx}
                position={[school.latitude, school.longitude]}
                icon={createSchoolIcon(school)}
                eventHandlers={{
                  click: () => setSelectedSchool(school)
                }}
              >
                <Popup>
                  <div className="school-popup">
                    <strong>{school.name}</strong><br/>
                    {school.attendance['2023-2024'] && (
                      <>
                        Chronic Absenteeism: {(school.attendance['2023-2024'].chronicAbsentRate * 100).toFixed(1)}%<br/>
                        Students: {school.attendance['2023-2024'].studentCount}
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          
          <div className="map-legend">
            <h4>Chronic Absenteeism Rate</h4>
            <div className="legend-item">
              <div className="legend-color" style={{backgroundColor: '#8b0000'}}></div>
              <span>≥80% Critical</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{backgroundColor: '#dc143c'}}></div>
              <span>60-79% Severe</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{backgroundColor: '#ff6347'}}></div>
              <span>40-59% High</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{backgroundColor: '#ffa500'}}></div>
              <span>20-39% Concerning</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{backgroundColor: '#32cd32'}}></div>
              <span>&lt;20% Acceptable</span>
            </div>
          </div>
        </div>

        <div className="dps-sidebar">
          <div className="crisis-summary">
            <h2>DPS Chronic Absenteeism Crisis</h2>
            <div className="stat-grid">
              <div className="stat-box critical">
                <div className="stat-number">{stats.high}</div>
                <div className="stat-label">Schools with &gt;50% Chronic Absenteeism</div>
              </div>
              <div className="stat-box severe">
                <div className="stat-number">{stats.critical}</div>
                <div className="stat-label">Schools in Critical Condition (&gt;80%)</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{stats.average.toFixed(1)}%</div>
                <div className="stat-label">Average Chronic Absenteeism Rate</div>
              </div>
            </div>

            <div className="worst-schools">
              <h3>Schools in Crisis</h3>
              <div className="school-list">
                {stats.worst.map((school, idx) => (
                  <div 
                    key={idx} 
                    className="school-item"
                    onClick={() => setSelectedSchool(school)}
                  >
                    <div className="school-rank">{idx + 1}</div>
                    <div className="school-info">
                      <div className="school-name">{school.name}</div>
                      <div className="school-category">{school.category}</div>
                    </div>
                    <div className="school-rate">
                      {(school.attendance['2023-2024'].chronicAbsentRate * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedSchool && (
            <div className="school-detail-panel">
              <h3>{selectedSchool.name}</h3>
              <p className="school-category">{selectedSchool.category}</p>
              
              {selectedSchool.attendance['2023-2024'] && (
                <div className="attendance-alert">
                  <div className="alert-rate">
                    {(selectedSchool.attendance['2023-2024'].chronicAbsentRate * 100).toFixed(1)}%
                  </div>
                  <div className="alert-label">Chronically Absent</div>
                  <div className="alert-detail">
                    {selectedSchool.attendance['2023-2024'].chronicAbsentCount} of {selectedSchool.attendance['2023-2024'].studentCount} students
                  </div>
                </div>
              )}

              {selectedSchool.enrollment && Object.keys(selectedSchool.enrollment).length > 0 && (
                <div className="chart-section">
                  <h4>Enrollment Trends</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart 
                      data={Object.entries(selectedSchool.enrollment).map(([year, data]) => ({
                        year,
                        enrollment: data.total
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="enrollment" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {selectedSchool.frl && Object.keys(selectedSchool.frl).length > 0 && (
                <div className="frl-section">
                  <h4>Free/Reduced Lunch</h4>
                  {Object.entries(selectedSchool.frl).slice(-1).map(([year, data]) => (
                    <div key={year}>
                      <div className="frl-stat">{data.percentage}% ({year})</div>
                    </div>
                  ))}
                </div>
              )}

              <button 
                className="close-button"
                onClick={() => setSelectedSchool(null)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default COMap;
