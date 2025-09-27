// src/WeatherCard.jsx - No changes needed

import React from 'react';
import { Card } from 'react-bootstrap';

function WeatherCard({ day, iconUrl, temp }) {
  return (
    <Card className="text-center border-0 weather-card">
      <Card.Body>
        <Card.Title className="weather-day">{day}</Card.Title>
        <img src={iconUrl} alt="weather icon" className="weather-icon" />
        <p className="weather-temp">{temp}&deg;</p>
      </Card.Body>
    </Card>
  );
}

export default WeatherCard;