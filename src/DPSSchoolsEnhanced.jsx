import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Helper function to resolve file paths for GitHub Pages
const getAssetPath = (filename) => {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? `${base}${filename}` : `${base}/${filename}`;
};

const DPSSchoolsEnhanced = () => {
  const [schoolsData, setSchoolsData] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [copData, setCopData] = useState(null);
  const [zoneMappings, setZoneMappings] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedYear, setSelectedYear] = useState('2023-2024');
  const [selectedMetric, setSelectedMetric] = useState('attendance'); // 'attendance' or 'chronic'
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterZone, setFilterZone] = useState('all');
  const [showBudgetOverlay, setShowBudgetOverlay] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareYear, setCompareYear] = useState('2022-2023');
  
  // Load data
  useEffect(() => {
    Promise.all([
      fetch(getAssetPath('dps_schools_data_multi_year.json')).then(res => res.json()),
      fetch(getAssetPath('dps_budget_data.json')).then(res => res.json()).catch(() => null),
      fetch(getAssetPath('dps_cop_data.json')).then(res => res.json()).catch(() => null),
      fetch(getAssetPath('cleaned_school_to_zone_lookup.json')).then(res => res.json()).catch(() => null)
    ]).then(([schools, budget, cop, zones]) => {
      setSchoolsData(schools);
      setBudgetData(budget);
      setCopData(cop);
      setZoneMappings(zones);
    });
  }, []);

  if (!schoolsData) {
    return <div className="loading-message">Loading DPS schools data...</div>;
  }

  // Get school grade levels from name and common patterns
  const getSchoolType = (school) => {
    const name = school.name.toLowerCase();
    
    // Direct name matches
    if (name.includes('elementary') || name.includes('elem')) return 'Elementary';
    if (name.includes('middle school') || name.includes(' ms') || name.includes(' ms ')) return 'Middle';
    if (name.includes('high school') || name.includes(' hs') || name.includes(' hs ')) return 'High';
    if (name.match(/k-8|k8|prek-8|ece-8/)) return 'K-8';
    if (name.match(/k-12|k12|6-12/)) return 'K-12';
    
    // Common DPS patterns
    if (name.includes('early college')) return 'High';
    if (name.includes('academy') && !name.includes('prep')) return 'K-8'; // Many academies are K-8
    if (name.includes('prep')) return 'High';
    if (name.includes('montessori')) return 'Elementary'; // Most Montessori are elementary
    if (name.includes('international') && !name.includes('high')) return 'K-8'; // International schools often K-8
    if (name.includes('ece-')) return 'Elementary'; // Early Childhood Education
    
    // If still unclear, use category to help
    if (school.category) {
      const cat = school.category.toLowerCase();
      if (cat.includes('pathways')) return 'High'; // Pathways are typically alternative high schools
    }
    
    return 'Other';
  };

  // Filter schools
  const filteredSchools = schoolsData.schools.filter(school => {
    if (filterCategory !== 'all') {
      const schoolType = getSchoolType(school);
      if (schoolType !== filterCategory) return false;
    }
    if (filterZone !== 'all') {
      // Use actual enrollment zone mappings if available
      if (zoneMappings) {
        const schoolName = school.name.toLowerCase().trim();
        const assignedZone = zoneMappings[schoolName];
        
        // Map filter zone values to actual zone names
        const zoneMapping = {
          'centralEast': 'Central East (Elementary)',
          'centralParkArea': 'Central Park-Area (Elementary)',
          'farSoutheast': 'Far Southeast (Elementary)',
          'gateway': 'Gateway (Elementary)',
          'greaterFivePointsCentral': 'Greater Five Points/Central (Elementary)',
          'northwestElem': 'Northwest (Elementary)',
          'southwestCentral': 'Southwest/Central (Elementary)',
          'tower': 'Tower (Elementary)',
          'farNortheast': 'Far Northeast (Middle)',
          'greaterParkHill': 'Greater Park Hill/Central Park (Middle)',
          'nearNortheast': 'Near Northeast (Middle)',
          'northwestMiddle': 'Northwest (Middle)',
          'southwestMiddle': 'Southwest (Middle)',
          'westDenver': 'West Denver (Middle)',
          'farNortheastHigh': 'Far Northeast (High)'
        };
        
        const targetZone = zoneMapping[filterZone];
        if (targetZone && assignedZone !== targetZone) {
          return false;
        }
        
        // If the zone mapping doesn't exist, fall back to no filtering for that zone
        if (targetZone && !assignedZone) {
          return false; // School not in any mapped zone
        }
      }
      
      // Fallback geographic filtering for basic zones
      const lat = school.latitude;
      const lng = school.longitude;
      const centerLat = 39.7392;
      const centerLng = -104.9903;
      
      if (filterZone === 'north' && lat <= centerLat) return false;
      if (filterZone === 'south' && lat >= centerLat) return false;
      if (filterZone === 'east' && lng <= centerLng) return false;
      if (filterZone === 'west' && lng >= centerLng) return false;
      if (filterZone === 'central') {
        const distance = Math.sqrt(Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2));
        if (distance > 0.05) return false; // Roughly 3.5 miles from center
      }
    }
    return true;
  });

  // Calculate statistics
  const calculateStats = (schools, year) => {
    let totalStudents = 0;
    let totalDaysExpected = 0;
    let totalDaysMissed = 0;
    let schoolsBelow90 = 0; // Schools with <90% attendance
    let schoolsBelow80 = 0; // Schools with <80% attendance
    let schoolsBelow70 = 0; // Schools with <70% attendance
    let chronicAbsentStudents = 0; // Students who are chronically absent

    schools.forEach(school => {
      const attendance = school.attendance[year];
      if (attendance) {
        const studentCount = parseInt(attendance.studentCount) || 0;
        totalStudents += studentCount;
        
        if (year === '2023-2024') {
          // Use different logic based on selected metric for 2023-2024
          if (year === selectedYear && selectedMetric === 'chronic' && attendance.chronicAbsentRate !== null) {
            // Chronic absenteeism mode - count students with >10% absence
            const chronicRate = parseFloat(attendance.chronicAbsentRate);
            const attendRate = 1 - chronicRate; // Convert for threshold comparison
            
            if (attendRate < 0.90) schoolsBelow90++;
            if (attendRate < 0.80) schoolsBelow80++;
            if (attendRate < 0.70) schoolsBelow70++;
            
            // Calculate days missed based on chronic rate
            const daysInSession = 180;
            totalDaysExpected += studentCount * daysInSession;
            totalDaysMissed += studentCount * daysInSession * chronicRate;
            
            // Calculate chronically absent students
            chronicAbsentStudents += studentCount * chronicRate;
            
          } else if (attendance.attendanceRate !== null) {
            // Attendance rate mode - use actual attendance data
            const attendRate = parseFloat(attendance.attendanceRate);
            
            if (attendRate < 0.90) schoolsBelow90++;
            if (attendRate < 0.80) schoolsBelow80++;
            if (attendRate < 0.70) schoolsBelow70++;
            
            // Calculate days missed based on actual attendance
            const daysInSession = 180;
            totalDaysExpected += studentCount * daysInSession;
            totalDaysMissed += studentCount * daysInSession * (1 - attendRate);
            
            // Calculate chronically absent students if available
            if (attendance.chronicAbsentRate !== null) {
              const chronicRate = parseFloat(attendance.chronicAbsentRate);
              chronicAbsentStudents += studentCount * chronicRate;
            } else {
              // Estimate based on attendance (students with <90% attendance)
              if (attendRate < 0.90) {
                chronicAbsentStudents += studentCount * (1 - attendRate);
              }
            }
          }
          
        } else if (attendance.attendanceRate !== null) {
          // Attendance rate mode for other years
          const attendRate = parseFloat(attendance.attendanceRate);
          if (attendRate < 0.90) schoolsBelow90++;
          if (attendRate < 0.80) schoolsBelow80++;
          if (attendRate < 0.70) schoolsBelow70++;
          
          // Calculate days missed based on attendance rate
          const daysInSession = 180;
          totalDaysExpected += studentCount * daysInSession;
          totalDaysMissed += studentCount * daysInSession * (1 - attendRate);
          
          // Estimate chronically absent students (>10% absences = <90% attendance)
          if (attendRate < 0.90) {
            chronicAbsentStudents += studentCount * (1 - attendRate);
          }
        }
      }
    });

    const overallAttendanceRate = totalDaysExpected > 0 
      ? ((totalDaysExpected - totalDaysMissed) / totalDaysExpected * 100).toFixed(1)
      : 0;

    return {
      totalStudents,
      totalDaysMissed: Math.round(totalDaysMissed),
      totalDaysExpected,
      schoolsBelow90,
      schoolsBelow80,
      schoolsBelow70,
      overallAttendanceRate,
      chronicAbsentStudents: Math.round(chronicAbsentStudents)
    };
  };

  const currentStats = calculateStats(filteredSchools, selectedYear);
  const compareStats = compareMode ? calculateStats(filteredSchools, compareYear) : null;

  // Get worst schools (lowest attendance)
  const worstSchools = filteredSchools
    .filter(school => {
      const att = school.attendance[selectedYear];
      return att && (att.chronicAbsentRate !== null || att.attendanceRate !== null);
    })
    .map(school => {
      const att = school.attendance[selectedYear];
      let attendanceRate;
      let displayMetric;
      
      if (selectedYear === '2023-2024') {
        if (selectedMetric === 'chronic' && att.chronicAbsentRate !== null) {
          const chronicRate = parseFloat(att.chronicAbsentRate);
          attendanceRate = 1 - chronicRate; // For sorting only
          displayMetric = chronicRate;
        } else if (att.attendanceRate !== null) {
          attendanceRate = parseFloat(att.attendanceRate);
          displayMetric = attendanceRate;
        }
      } else if (att.attendanceRate !== null) {
        attendanceRate = parseFloat(att.attendanceRate);
        displayMetric = attendanceRate;
      }
      
      return { ...school, attendanceRate, displayMetric };
    })
    .filter(school => school.attendanceRate !== undefined)
    .sort((a, b) => {
      // For chronic absenteeism mode, sort by highest chronic rates (worst first)
      // For attendance mode, sort by lowest attendance rates (worst first)
      if (selectedYear === '2023-2024' && selectedMetric === 'chronic') {
        return b.displayMetric - a.displayMetric; // Highest chronic rates first
      } else {
        return a.attendanceRate - b.attendanceRate; // Lowest attendance rates first
      }
    })
    .slice(0, 10);

  // Export functionality
  const exportData = () => {
    const exportData = {
      generatedDate: new Date().toISOString(),
      filter: { category: filterCategory, zone: filterZone },
      year: selectedYear,
      statistics: currentStats,
      worstSchools: worstSchools.map(school => ({
        name: school.name,
        category: school.category,
        chronicAbsenteeismRate: school.attendance[selectedYear].chronicAbsentRate,
        studentCount: school.attendance[selectedYear].studentCount,
        frlRate: school.frl[selectedYear.split('-')[0]]?.percentage
      })),
      budgetAnalysis: budgetData ? {
        totalBudget: budgetData.years[selectedYear.split('-')[0]]?.totalBudget,
        perPupilSpending: budgetData.years[selectedYear.split('-')[0]]?.perPupilSpending,
        costOfCrisis: currentStats.chronicAbsentStudents * (budgetData.years[selectedYear.split('-')[0]]?.perPupilSpending || 0)
      } : null
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dps-chronic-absenteeism-${selectedYear}.json`;
    a.click();
  };

  // Budget vs Outcomes chart data
  const budgetCorrelation = budgetData?.correlation || [];

  return (
    <div className="dps-enhanced-container">
      {/* Control Panel */}
      <div className="enhanced-control-panel">
        <div className="filter-controls">
          <div className="filter-group">
            <label>School Type:</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Schools</option>
              <option value="Elementary">Elementary</option>
              <option value="Middle">Middle</option>
              <option value="High">High</option>
              <option value="K-8">K-8</option>
              <option value="Other">Other/Special</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Zone:</label>
            <select value={filterZone} onChange={(e) => setFilterZone(e.target.value)}>
              <option value="all">All Zones</option>
              <option value="north">North Denver</option>
              <option value="south">South Denver</option>
              <option value="east">East Denver</option>
              <option value="west">West Denver</option>
              <option value="central">Central Denver</option>
              <optgroup label="Elementary School Enrollment Zones">
                <option value="centralEast">Central East</option>
                <option value="centralParkArea">Central Park-Area</option>
                <option value="farSoutheast">Far Southeast</option>
                <option value="gateway">Gateway</option>
                <option value="greaterFivePointsCentral">Greater Five Points/Central</option>
                <option value="northwestElem">Northwest</option>
                <option value="southwestCentral">Southwest/Central</option>
                <option value="tower">Tower</option>
              </optgroup>
              <optgroup label="Middle School Enrollment Zones">
                <option value="farNortheast">Far Northeast</option>
                <option value="greaterParkHill">Greater Park Hill/Central Park</option>
                <option value="nearNortheast">Near Northeast</option>
                <option value="northwestMiddle">Northwest</option>
                <option value="southwestMiddle">Southwest</option>
                <option value="westDenver">West Denver</option>
              </optgroup>
              <optgroup label="High School Enrollment Zone">
                <option value="farNortheastHigh">Far Northeast</option>
              </optgroup>
            </select>
          </div>

          <div className="filter-group">
            <label>Year:</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="2023-2024">2023-2024</option>
              <option value="2022-2023">2022-2023</option>
              <option value="2021-2022">2021-2022</option>
              <option value="2020-2021">2020-2021</option>
              <option value="2019-2020">2019-2020</option>
            </select>
          </div>
          
          {selectedYear === '2023-2024' && (
            <div className="filter-group">
              <label>Metric:</label>
              <select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
                <option value="attendance">Attendance Rate</option>
                <option value="chronic">Chronic Absenteeism</option>
              </select>
            </div>
          )}
          
          {selectedYear !== '2023-2024' && (
            <div className="filter-note">
              Note: Chronic absenteeism data only available for 2023-2024
            </div>
          )}
        </div>

        <div className="action-controls">
          <button 
            className={`toggle-button ${showBudgetOverlay ? 'active' : ''}`}
            onClick={() => setShowBudgetOverlay(!showBudgetOverlay)}
          >
            Budget Overlay
          </button>
          
          <button 
            className={`toggle-button ${compareMode ? 'active' : ''}`}
            onClick={() => setCompareMode(!compareMode)}
          >
            Compare Years
          </button>
          
          <button className="export-button" onClick={exportData}>
            Export Data
          </button>
        </div>
      </div>

      <div className="dps-main-content">
        {/* Map Panel */}
        <div className="enhanced-map-panel">
          <MapContainer 
            center={[39.7392, -104.9903]} 
            zoom={11} 
            style={{ height: '100%', width: '100%' }}
            maxBounds={[
              [39.4, -105.3], // Southwest corner of Denver area
              [40.1, -104.6]  // Northeast corner of Denver area
            ]}
            maxBoundsViscosity={1.0}
            minZoom={10}
            maxZoom={16}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            
            {filteredSchools.map(school => {
              if (!school.latitude || !school.longitude) return null;
              
              const attendance = school.attendance[selectedYear];
              let attendRate = null;
              let displayValue = null;
              
              if (attendance) {
                if (selectedYear === '2023-2024') {
                  // For 2023-2024, we have both chronic and attendance data
                  if (selectedMetric === 'chronic' && attendance.chronicAbsentRate !== null) {
                    // Show chronic absenteeism
                    const chronicRate = parseFloat(attendance.chronicAbsentRate);
                    attendRate = 1 - chronicRate; // For color scaling only
                    displayValue = chronicRate;
                  } else if (attendance.attendanceRate !== null) {
                    // Show actual attendance rate
                    attendRate = parseFloat(attendance.attendanceRate);
                    displayValue = attendRate;
                  }
                } else if (attendance.attendanceRate !== null) {
                  // Show attendance rate for other years
                  attendRate = parseFloat(attendance.attendanceRate);
                  displayValue = attendRate;
                }
              }
              
              let color = '#999999'; // Gray for no data
              let radius = 8;
              
              if (attendRate !== null) {
                // Color based on attendance rate (green = good, red = bad)
                if (attendRate >= 0.95) { color = '#006400'; radius = 8; }       // Dark green
                else if (attendRate >= 0.90) { color = '#228B22'; radius = 8; }  // Forest green
                else if (attendRate >= 0.85) { color = '#32CD32'; radius = 9; }  // Lime green
                else if (attendRate >= 0.80) { color = '#FFD700'; radius = 9; }  // Gold
                else if (attendRate >= 0.70) { color = '#FF8C00'; radius = 10; } // Dark orange
                else if (attendRate >= 0.60) { color = '#FF6347'; radius = 11; } // Tomato
                else { color = '#8B0000'; radius = 12; }                         // Dark red
              }

              // Add budget indicator if enabled
              if (showBudgetOverlay && budgetData) {
                const perPupil = budgetData.years[selectedYear.split('-')[0]]?.perPupilSpending || 0;
                if (perPupil > 15000) radius += 3;
                else if (perPupil > 12000) radius += 2;
                else if (perPupil > 10000) radius += 1;
              }
              
              return (
                <CircleMarker
                  key={school.name}
                  center={[school.latitude, school.longitude]}
                  radius={radius}
                  fillColor={color}
                  color="#333"
                  weight={2}
                  opacity={1}
                  fillOpacity={0.8}
                  eventHandlers={{
                    click: () => setSelectedSchool(school)
                  }}
                >
                  <Popup>
                    <div className="school-popup">
                      <strong>{school.name}</strong><br/>
                      {school.category}<br/>
                      {displayValue !== null && (
                        <>
                          {selectedYear === '2023-2024' && selectedMetric === 'chronic' 
                            ? `Chronic Absenteeism: ${(displayValue * 100).toFixed(1)}%`
                            : `Attendance Rate: ${(displayValue * 100).toFixed(1)}%`
                          }
                        </>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Enhanced Legend */}
          <div className="enhanced-map-legend">
            <h4>
              {selectedYear === '2023-2024' && selectedMetric === 'chronic' 
                ? 'Chronic Absenteeism Rates' 
                : 'Attendance Rates'}
            </h4>
            {selectedYear === '2023-2024' && selectedMetric === 'chronic' ? (
              <>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#006400' }}></div>
                  <span>&lt;5% Absent</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#228B22' }}></div>
                  <span>5-10% Absent</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#32CD32' }}></div>
                  <span>10-15% Absent</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#FFD700' }}></div>
                  <span>15-20% Absent</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#FF8C00' }}></div>
                  <span>20-30% Absent</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#FF6347' }}></div>
                  <span>30-40% Absent</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#8B0000' }}></div>
                  <span>&gt;40% Absent</span>
                </div>
              </>
            ) : (
              <>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#006400' }}></div>
                  <span>≥95% Present</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#228B22' }}></div>
                  <span>90-95% Present</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#32CD32' }}></div>
                  <span>85-90% Present</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#FFD700' }}></div>
                  <span>80-85% Present</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#FF8C00' }}></div>
                  <span>70-80% Present</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#FF6347' }}></div>
                  <span>60-70% Present</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#8B0000' }}></div>
                  <span>&lt;60% Present</span>
                </div>
              </>
            )}
            
            {showBudgetOverlay && (
              <>
                <h5 style={{ marginTop: '1rem' }}>Budget Indicator</h5>
                <div className="legend-note">Larger circles = Higher per-pupil spending</div>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Sidebar */}
        <div className="enhanced-sidebar">
          {/* Crisis Summary with Comparisons */}
          <div className="enhanced-crisis-summary">
            <h2>
              {selectedYear === '2023-2024' && selectedMetric === 'chronic' 
                ? 'DPS Chronic Absenteeism Crisis'
                : 'DPS Attendance Crisis'
              }
            </h2>
            
            <div className="stats-comparison">
              <div className="stat-column">
                <h3>{selectedYear}</h3>
                <div className="stat-grid">
                  <div className="stat-box critical">
                    <div className="stat-number">{currentStats.schoolsBelow80}</div>
                    <div className="stat-label">
                      {selectedYear === '2023-2024' && selectedMetric === 'chronic'
                        ? 'Schools >20% Chronic Absent'
                        : 'Schools <80% Attendance'
                      }
                    </div>
                  </div>
                  <div className="stat-box severe">
                    <div className="stat-number">{currentStats.schoolsBelow70}</div>
                    <div className="stat-label">
                      {selectedYear === '2023-2024' && selectedMetric === 'chronic'
                        ? 'Schools >30% Chronic Absent'
                        : 'Schools <70% Attendance'
                      }
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-number">{currentStats.overallAttendanceRate}%</div>
                    <div className="stat-label">
                      {selectedYear === '2023-2024' && selectedMetric === 'chronic'
                        ? 'Overall Attendance Rate'
                        : 'Overall Attendance Rate'
                      }
                    </div>
                  </div>
                  {copData && (
                    <div className="stat-box warning">
                      <div className="stat-number">
                        ${copData.debtBurdenAnalysis.debtServicePerPupil[selectedYear.split('-')[0]] || copData.debtBurdenAnalysis.debtServicePerPupil['2022'] || '795'}
                      </div>
                      <div className="stat-label">Debt Service per Student</div>
                      <div className="stat-note">Money not available for instruction</div>
                    </div>
                  )}
                </div>
              </div>
              
              {compareMode && compareStats && (
                <div className="stat-column">
                  <h3>{compareYear}</h3>
                  <div className="stat-grid">
                    <div className="stat-box critical">
                      <div className="stat-number">{compareStats.schoolsBelow80}</div>
                      <div className="stat-label">Schools &lt;80% Attendance</div>
                      <div className="change-indicator">
                        {currentStats.schoolsBelow80 - compareStats.schoolsBelow80 > 0 ? '↑' : '↓'}
                        {Math.abs(currentStats.schoolsBelow80 - compareStats.schoolsBelow80)}
                      </div>
                    </div>
                    <div className="stat-box severe">
                      <div className="stat-number">{compareStats.schoolsBelow70}</div>
                      <div className="stat-label">Schools &lt;70% Attendance</div>
                      <div className="change-indicator">
                        {currentStats.schoolsBelow70 - compareStats.schoolsBelow70 > 0 ? '↑' : '↓'}
                        {Math.abs(currentStats.schoolsBelow70 - compareStats.schoolsBelow70)}
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-number">{compareStats.overallAttendanceRate}%</div>
                      <div className="stat-label">Overall Attendance Rate</div>
                      <div className="change-indicator">
                        {parseFloat(currentStats.overallAttendanceRate) - parseFloat(compareStats.overallAttendanceRate) < 0 ? '↓' : '↑'}
                        {Math.abs(parseFloat(currentStats.overallAttendanceRate) - parseFloat(compareStats.overallAttendanceRate)).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {compareMode && (
              <div className="compare-controls">
                <label>Compare with:</label>
                <select value={compareYear} onChange={(e) => setCompareYear(e.target.value)}>
                  <option value="2022-2023">2022-2023</option>
                  <option value="2021-2022">2021-2022</option>
                </select>
              </div>
            )}
          </div>

          {/* Budget Analysis */}
          {showBudgetOverlay && budgetData && (
            <div className="budget-analysis-panel">
              <h3>Budget vs Outcomes Analysis</h3>
              
              <div className="budget-stats">
                <div className="budget-stat">
                  <div className="label">Total Budget ({selectedYear.split('-')[0]})</div>
                  <div className="value">
                    ${(budgetData.years[selectedYear.split('-')[0]]?.totalBudget / 1000000000).toFixed(2)}B
                  </div>
                </div>
                <div className="budget-stat">
                  <div className="label">Per Pupil Spending</div>
                  <div className="value">
                    ${budgetData.years[selectedYear.split('-')[0]]?.perPupilSpending?.toLocaleString() || 'N/A'}
                  </div>
                </div>
                {copData && (
                  <>
                    <div className="budget-stat warning">
                      <div className="label">Outstanding COP Debt</div>
                      <div className="value">
                        ${(copData.summary.totalOutstandingDebt / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <div className="budget-stat warning">
                      <div className="label">Annual Debt Service</div>
                      <div className="value">
                        ${(copData.summary.totalAnnualDebtService / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <div className="budget-stat critical">
                      <div className="label">Debt Service per Pupil</div>
                      <div className="value">
                        ${copData.debtBurdenAnalysis.debtServicePerPupil[selectedYear.split('-')[0]] || copData.debtBurdenAnalysis.debtServicePerPupil['2022'] || '795'}
                      </div>
                      <div className="note">Money diverted from education</div>
                    </div>
                  </>
                )}
                <div className="budget-stat critical">
                  <div className="label">Cost of Lost Learning</div>
                  <div className="value">
                    ${((currentStats.chronicAbsentStudents * (budgetData.years[selectedYear.split('-')[0]]?.perPupilSpending || 0)) / 1000000).toFixed(1)}M
                  </div>
                  <div className="note">Spending on chronically absent students</div>
                </div>
              </div>

              {/* Scatter plot of spending vs outcomes */}
              <div className="chart-section">
                <h4>Spending vs Chronic Absenteeism Trend</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="perPupilSpending" 
                      name="Per Pupil Spending"
                      label={{ value: 'Per Pupil Spending ($)', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      dataKey="avgChronicAbsenteeism" 
                      name="Chronic Absenteeism %"
                      label={{ value: 'Chronic Absenteeism (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'perPupilSpending') return `$${value.toLocaleString()}`;
                        return `${value.toFixed(1)}%`;
                      }}
                    />
                    <Scatter 
                      data={budgetCorrelation} 
                      fill="#dc143c"
                      name="Year"
                      line={{ stroke: "#dc143c", strokeWidth: 2 }}
                    >
                      {budgetCorrelation.map((entry, index) => (
                        <text
                          key={index}
                          x={entry.perPupilSpending}
                          y={entry.avgChronicAbsenteeism}
                          fill="#666"
                          fontSize={12}
                          textAnchor="middle"
                          dy={-10}
                        >
                          {entry.year}
                        </text>
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="chart-note">
                  Despite increasing per-pupil spending, chronic absenteeism continues to rise
                </div>
              </div>

              {/* COP Debt Burden Trend */}
              {copData && (
                <div className="chart-section">
                  <h4>Certificate of Participation Debt Burden Growth</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={copData.debtBurdenAnalysis.cumulativeDebtGrowth} margin={{ top: 20, right: 20, bottom: 40, left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="year" 
                        label={{ value: 'Year', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        label={{ value: 'Outstanding Debt ($M)', angle: -90, position: 'insideLeft', offset: -25, style: { textAnchor: 'middle' } }}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${(value / 1000000).toFixed(1)}M`, 'Outstanding Debt']}
                        labelFormatter={(year) => `Year: ${year}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#ff9800" 
                        strokeWidth={3}
                        dot={{ fill: '#ff9800', strokeWidth: 2, r: 4 }}
                        name="Outstanding Debt"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="chart-note">
                    Growing debt burden diverts resources from classroom instruction
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Worst Schools List */}
          <div className="enhanced-worst-schools">
            <h3>Lowest Attendance Rates ({selectedYear})</h3>
            <div className="school-list">
              {worstSchools.map((school, index) => (
                <div 
                  key={school.name}
                  className="school-item"
                  onClick={() => setSelectedSchool(school)}
                >
                  <div className="school-rank">{index + 1}</div>
                  <div className="school-info">
                    <div className="school-name">{school.name}</div>
                    <div className="school-category">{school.category}</div>
                    {school.frl[selectedYear.split('-')[0]]?.percentage && (
                      <div className="school-frl">FRL: {school.frl[selectedYear.split('-')[0]].percentage}%</div>
                    )}
                  </div>
                  <div className="school-rate">
                    {selectedYear === '2023-2024' && selectedMetric === 'chronic'
                      ? `${(school.displayMetric * 100).toFixed(1)}% Absent`
                      : `${(school.displayMetric * 100).toFixed(1)}%`
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected School Detail */}
          {selectedSchool && (
            <div className="enhanced-school-detail">
              <h3>{selectedSchool.name}</h3>
              <p className="school-category">{selectedSchool.category}</p>
              
              {/* Show current attendance/absenteeism data */}
              {selectedSchool.attendance[selectedYear] && (
                <div className="attendance-alert">
                  <div className="alert-rate">
                    {selectedYear === '2023-2024' && selectedMetric === 'chronic' && selectedSchool.attendance[selectedYear].chronicAbsentRate !== null
                      ? `${(parseFloat(selectedSchool.attendance[selectedYear].chronicAbsentRate) * 100).toFixed(1)}%`
                      : selectedSchool.attendance[selectedYear].attendanceRate !== null
                      ? `${(parseFloat(selectedSchool.attendance[selectedYear].attendanceRate) * 100).toFixed(1)}%`
                      : 'N/A'
                    }
                  </div>
                  <div className="alert-label">
                    {selectedYear === '2023-2024' && selectedMetric === 'chronic' 
                      ? 'Chronically Absent'
                      : 'Attendance Rate'
                    }
                  </div>
                  {selectedSchool.attendance[selectedYear].studentCount && (
                    <div className="alert-detail">
                      {selectedSchool.attendance[selectedYear].studentCount} students enrolled
                    </div>
                  )}
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
    </div>
  );
};

export default DPSSchoolsEnhanced;