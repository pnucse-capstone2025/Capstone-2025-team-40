import React from 'react';
import { connectItineraryWebSocket } from './utils/itineraryApi';

function ItineraryItem({ item, listNumber, onClick }) {
  const { id, title, openHours, description } = item;

  const handleClick = () => {
    if (onClick) {
      onClick(item);
    }
  };

  return (
    <div className="itinerary-item" onClick={handleClick}>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '0.25rem' }}>
        <span className="itinerary-number">{listNumber}</span>
        <h3 className="itinerary-title">{title}</h3>
      </div>
      <div style={{ paddingLeft: '2.25rem' }}>
        <p className="itinerary-hours">{openHours}</p>
        <p className="itinerary-description">{description}</p>
      </div>
    </div>
  );
}

export default ItineraryItem;