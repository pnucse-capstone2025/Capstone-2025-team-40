import React, { useState, useEffect } from 'react';

// Helper function to format dates
const formatDate = (dateString) => {
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Helper function to get a color for the activity badge
const getBadgeColor = (slot) => {
  if (slot.includes('🍱') || slot.includes('🍽️')) return { background: '#FFFBEB', color: '#B45309' };
  if (slot.includes('🌳')) return { background: '#F0FDF4', color: '#15803D' };
  if (slot.includes('☕')) return { background: '#FDF2F8', color: '#9D174D' };
  if (slot.includes('✨')) return { background: '#F5F3FF', color: '#5B21B6' };
  return { background: '#F3F4F6', color: '#4B5563' };
};

const ItineraryDisplay = ({ itineraries, onDelete }) => {
  const [openItineraries, setOpenItineraries] = useState(new Set());

  // Effect to open the first itinerary by default when the component loads
  useEffect(() => {
    if (itineraries && itineraries.length > 0) {
      setOpenItineraries(new Set([itineraries[0].id]));
    }
  }, [itineraries]);

  // Function to handle clicking the header to toggle an itinerary
  const handleToggle = (id) => {
    setOpenItineraries(prevOpen => {
      const newOpen = new Set(prevOpen);
      if (newOpen.has(id)) {
        newOpen.delete(id);
      } else {
        newOpen.add(id);
      }
      return newOpen;
    });
  };

  if (!itineraries || itineraries.length === 0) {
    return <p style={{ color: '#6B7280' }}>No itineraries found.</p>;
  }

  return (
    <div>
      {itineraries.map((itinerary) => {
        const isOpen = openItineraries.has(itinerary.id);
        
        return (
          <div key={itinerary.id} style={S.itineraryCard}>
            <div style={S.headerContainer}>
              <button onClick={() => handleToggle(itinerary.id)} style={S.mainHeaderButton}>
                <span>🗓️ Itinerary from {new Date(itinerary.created_at).toLocaleDateString()}</span>
                <span style={S.chevron}>{isOpen ? '▲' : '▼'}</span>
              </button>
              <button onClick={() => onDelete(itinerary.id)} style={S.deleteButton}>
                Delete
              </button>
            </div>
            
            {isOpen && (
              <div style={S.contentWrapper}>
                {itinerary.itinerary_data.scheduled.map((daySchedule) => (
                  <div key={daySchedule.day} style={S.dayContainer}>
                    <h4 style={S.dateHeader}>{formatDate(daySchedule.day)}</h4>
                    <div style={S.timeline}>
                      {daySchedule.itinerary.map((location, locIndex, arr) => (
                        <div key={location.id} style={S.timelineItem}>
                          <div style={S.timelineGraphic}>
                            <div style={S.timelineCircle}>{location.step}</div>
                            {locIndex < arr.length - 1 && <div style={S.timelineLine} />}
                          </div>
                          <div style={S.timelineContent}>
                            {location.naver_url ? (
                              <a href={location.naver_url} target="_blank" rel="noopener noreferrer" style={S.locationLink}>
                                {location.name}
                              </a>
                            ) : (
                              <p style={S.locationName}>{location.name}</p>
                            )}
                            <span style={{...S.badge, ...getBadgeColor(location.slot)}}>
                              {location.slot}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// --- Styles ---
const S = {
  itineraryCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    marginBottom: '16px',
    background: '#fff',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    overflow: 'hidden',
  },
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  mainHeaderButton: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827',
    textAlign: 'left',
  },
  deleteButton: {
    padding: '8px 16px',
    marginRight: '16px',
    border: '1px solid #ef4444',
    background: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  chevron: {
    fontSize: '14px',
  },
  contentWrapper: {
    padding: '24px',
  },
  dayContainer: {
    marginBottom: '16px',
  },
  dateHeader: {
    margin: '0 0 16px 0',
    color: '#374151',
    fontWeight: '600',
    fontSize: '18px',
  },
  timeline: {
    position: 'relative',
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  },
  timelineGraphic: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  timelineCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#4f46e5',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    zIndex: 1,
  },
  timelineLine: {
    width: '2px',
    height: '100%',
    minHeight: '60px',
    background: '#e5e7eb',
  },
  timelineContent: {
    paddingTop: '6px',
    flex: 1,
  },
  locationName: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  locationLink: {
    display: 'block',
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#3b82f6',
    textDecoration: 'none',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '600',
  },
};

export default ItineraryDisplay;