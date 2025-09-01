import React, { useState } from 'react';
import { useTour } from '@reactour/tour';

// Guided tour steps with educational content
export const tourSteps = [
  {
    selector: '.app-header',
    content: (
      <div style={{ maxWidth: '400px', lineHeight: '1.6' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c5aa0' }}>Welcome to the Colorado School Data Dashboard</h3>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          This interactive tool consolidates years of public education data to reveal patterns of educational equity and resource allocation across Colorado school districts.
        </p>
        <p style={{ margin: '0', fontSize: '0.9rem', fontStyle: 'italic', color: '#666' }}>
          All data comes from official Colorado Department of Education sources and represents real student outcomes from 2014-2024.
        </p>
      </div>
    ),
    position: 'bottom',
  },
  {
    selector: '.view-mode-toggle',
    content: (
      <div style={{ maxWidth: '380px', lineHeight: '1.6' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c5aa0' }}>Two Analysis Views</h3>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          <strong>District Comparison:</strong> Compare any Colorado district's performance against Denver County 1 (DPS) across key metrics.
        </p>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          <strong>DPS Schools:</strong> Drill down into individual Denver Public Schools to examine the chronic absenteeism crisis affecting specific communities.
        </p>
        <p style={{ margin: '0', fontSize: '0.9rem', color: '#e74c3c' }}>
          These views help reveal systemic patterns that impact educational outcomes.
        </p>
      </div>
    ),
    position: 'bottom',
  },
  {
    selector: '.map-panel',
    content: (
      <div style={{ maxWidth: '420px', lineHeight: '1.6' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c5aa0' }}>Interactive Colorado School District Map</h3>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          This map shows all 178 Colorado school districts. Each district is color-coded based on the selected performance metric.
        </p>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          <strong>Click any district</strong> to see detailed performance comparisons with Denver County 1 (shown with red dashed border).
        </p>
        <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
          Geographic patterns often reveal how location, demographics, and resources impact student outcomes.
        </p>
      </div>
    ),
    position: 'right',
  },
  {
    selector: '.control-panel',
    content: (
      <div style={{ maxWidth: '400px', lineHeight: '1.6' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c5aa0' }}>Performance Metrics & Time Analysis</h3>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          Choose which metric to analyze and which year to examine:
        </p>
        <ul style={{ margin: '0 0 0.75rem 1.5rem', padding: 0 }}>
          <li style={{ marginBottom: '0.5rem' }}><strong>Student Enrollment:</strong> District size and growth patterns</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Free/Reduced Lunch %:</strong> Poverty indicator (higher % = more economic need)</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>CMAS Scores:</strong> Academic achievement (higher % = better performance)</li>
        </ul>
        <p style={{ margin: '0', fontSize: '0.9rem', color: '#e74c3c' }}>
          These metrics together reveal educational equity issues across different communities.
        </p>
      </div>
    ),
    position: 'bottom',
  },
  {
    selector: '.legend-panel',
    content: (
      <div style={{ maxWidth: '380px', lineHeight: '1.6' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c5aa0' }}>Understanding the Color Scale</h3>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          The color gradient shows performance relative to all Colorado districts:
        </p>
        <ul style={{ margin: '0 0 0.75rem 1.5rem', padding: 0, fontSize: '0.9rem' }}>
          <li style={{ marginBottom: '0.4rem' }}><strong>Darker colors:</strong> Higher values (better for enrollment/CMAS, worse for FRL)</li>
          <li style={{ marginBottom: '0.4rem' }}><strong>Lighter colors:</strong> Lower values</li>
          <li style={{ marginBottom: '0.4rem' }}><strong>Gray:</strong> No data available for selected year</li>
        </ul>
        <p style={{ margin: '0', fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
          Look for patterns: do wealthy districts (low FRL) consistently show better CMAS scores?
        </p>
      </div>
    ),
    position: 'left',
  },
  {
    selector: '.combined-chart-panel',
    content: (
      <div style={{ maxWidth: '450px', lineHeight: '1.6' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c5aa0' }}>District Comparison Charts</h3>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          Once you select a district, this panel shows side-by-side comparisons with Denver County 1 over time (2014-2024).
        </p>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          <span style={{ color: 'hsla(185.53, 59%, 47%, 1)', fontWeight: 'bold' }}>Solid line:</span> Selected district<br/>
          <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Dashed line:</span> Denver County 1 (DPS)
        </p>
        <p style={{ margin: '0', fontSize: '0.9rem', color: '#e74c3c' }}>
          <strong>Key insight:</strong> Persistent gaps between districts over time may indicate systemic inequities rather than temporary issues.
        </p>
      </div>
    ),
    position: 'left',
  },
  {
    selector: '[data-tour="enrollment-explanation"]',
    content: (
      <div style={{ maxWidth: '420px', lineHeight: '1.6' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c5aa0' }}>Why Student Enrollment Matters</h3>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          Enrollment trends reveal community stability and school district attractiveness:
        </p>
        <ul style={{ margin: '0 0 0.75rem 1.5rem', padding: 0 }}>
          <li style={{ marginBottom: '0.5rem' }}>Declining enrollment may indicate families leaving due to school quality concerns</li>
          <li style={{ marginBottom: '0.5rem' }}>Rapid growth can strain resources and class sizes</li>
          <li style={{ marginBottom: '0.5rem' }}>Stable enrollment suggests community confidence</li>
        </ul>
        <p style={{ margin: '0', fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
          Compare Denver's enrollment trends with other districts - what patterns do you notice?
        </p>
      </div>
    ),
    position: 'bottom',
  },
  {
    selector: '[data-tour="frl-explanation"]',
    content: (
      <div style={{ maxWidth: '440px', lineHeight: '1.6' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c5aa0' }}>Free/Reduced Lunch: A Poverty Indicator</h3>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          The percentage of students qualifying for free or reduced-price lunch is a federal measure of economic disadvantage.
        </p>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          <strong>Research shows:</strong> Schools with higher FRL percentages face additional challenges including:
        </p>
        <ul style={{ margin: '0 0 0.75rem 1.5rem', padding: 0, fontSize: '0.9rem' }}>
          <li>Student mobility and housing instability</li>
          <li>Limited access to educational resources at home</li>
          <li>Higher rates of chronic absenteeism</li>
        </ul>
        <p style={{ margin: '0', fontSize: '0.9rem', color: '#e74c3c' }}>
          <strong>Critical question:</strong> Do high-poverty districts receive adequate additional support?
        </p>
      </div>
    ),
    position: 'bottom',
  },
  {
    selector: '[data-tour="cmas-explanation"]',
    content: (
      <div style={{ maxWidth: '450px', lineHeight: '1.6' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c5aa0' }}>CMAS Scores: Academic Achievement Measure</h3>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          The Colorado Measures of Academic Success (CMAS) test all students in grades 3-8. The percentage shown represents students who "Met" or "Exceeded" expectations.
        </p>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          <strong>Important context:</strong>
        </p>
        <ul style={{ margin: '0 0 0.75rem 1.5rem', padding: 0, fontSize: '0.9rem' }}>
          <li>No data for 2020 due to COVID-19</li>
          <li>Scores often correlate strongly with poverty levels</li>
          <li>Gaps between districts can persist for years</li>
        </ul>
        <p style={{ margin: '0', fontSize: '0.9rem', color: '#e74c3c' }}>
          <strong>Legal significance:</strong> Persistent achievement gaps may indicate unequal educational opportunities.
        </p>
      </div>
    ),
    position: 'bottom',
  },
  {
    selector: '.view-mode-toggle button:last-child',
    content: (
      <div style={{ maxWidth: '400px', lineHeight: '1.6' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c5aa0' }}>Denver Public Schools Deep Dive</h3>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          Click "DPS Schools" to examine individual schools within Denver Public Schools district.
        </p>
        <p style={{ margin: '0 0 0.75rem 0' }}>
          This view reveals the <strong style={{ color: '#e74c3c' }}>chronic absenteeism crisis</strong> - where students miss 18+ days per year (10% of school year).
        </p>
        <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
          Individual school data helps identify which communities are most affected by systemic issues.
        </p>
      </div>
    ),
    position: 'bottom',
  },
  {
    selector: 'body',
    content: (
      <div style={{ maxWidth: '450px', lineHeight: '1.6', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c5aa0' }}>Start Your Analysis</h3>
        <p style={{ margin: '0 0 1rem 0' }}>
          You're now ready to explore Colorado's educational landscape. Use this data to:
        </p>
        <ul style={{ margin: '0 0 1.5rem 1.5rem', padding: 0, textAlign: 'left' }}>
          <li style={{ marginBottom: '0.5rem' }}>Compare districts across different metrics</li>
          <li style={{ marginBottom: '0.5rem' }}>Identify patterns of educational equity</li>
          <li style={{ marginBottom: '0.5rem' }}>Examine trends over the past decade</li>
          <li style={{ marginBottom: '0.5rem' }}>Focus on specific schools within DPS</li>
        </ul>
        <p style={{ margin: '0', fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
          Click "Start Tour Again" anytime to replay this guidance.
        </p>
      </div>
    ),
    position: 'center',
  },
];

// Tour configuration
export const tourConfig = {
  steps: tourSteps,
  styles: {
    popover: (base) => ({
      ...base,
      '--reactour-accent': 'hsla(185.53, 59%, 47%, 1)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      maxWidth: '500px',
    }),
    maskArea: (base) => ({
      ...base,
      rx: 8,
    }),
    badge: (base) => ({
      ...base,
      left: 'auto',
      right: '-0.8125em',
    }),
  },
  showCloseButton: true,
  showNavigation: true,
  showBadge: true,
  disableDotsNavigation: false,
  disableKeyboardNavigation: false,
  className: 'educational-tour',
  maskClassName: 'tour-mask',
  highlightedMaskClassName: 'tour-highlight',
  beforeClose: () => {
    localStorage.setItem('tourCompleted', 'true');
  },
};

// Tour control component
export const TourButton = () => {
  const { setIsOpen } = useTour();
  
  const startTour = () => {
    localStorage.removeItem('tourCompleted'); // Allow retaking
    setIsOpen(true);
  };
  
  return (
    <button 
      onClick={startTour}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'hsla(185.53, 59%, 47%, 1)',
        color: 'white',
        border: 'none',
        borderRadius: '50px',
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        zIndex: 1000,
        transition: 'all 0.2s ease',
      }}
      onMouseOver={(e) => {
        e.target.style.transform = 'scale(1.05)';
        e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
      }}
      onMouseOut={(e) => {
        e.target.style.transform = 'scale(1)';
        e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
      }}
    >
      📚 Start Guided Tour
    </button>
  );
};

// Auto-start tour for first-time visitors
export const useAutoStartTour = () => {
  const { setIsOpen } = useTour();
  
  React.useEffect(() => {
    const hasSeenTour = localStorage.getItem('tourCompleted');
    if (!hasSeenTour) {
      // Small delay to ensure all components are mounted
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [setIsOpen]);
};