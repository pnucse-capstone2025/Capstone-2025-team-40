import React from 'react';
import './ExpandedItemView.css';

const getWeatherIcon = (condition) => {
  if (!condition) return '❓';
  const cond = condition.toLowerCase();
  if (cond.includes('rain')) return '🌧️';
  if (cond.includes('clear')) return '☀️';
  if (cond.includes('clouds')) return '☁️';
  if (cond.includes('snow')) return '❄️';
  if (cond.includes('windy')) return '💨';
  return '🌫️';
};

function ExpandedItemView({ item, onClose, listNumber }) {
  if (!item) return null;

  const handleCardClick = (e) => e.stopPropagation();

  return (
    <div className="eiv-overlay" onClick={onClose}>
      <div className="eiv-card" onClick={handleCardClick}>
        <button className="eiv-close-btn" onClick={onClose}>&times;</button>

        <div className="eiv-content-col">
          <div className="eiv-item-info">
            <div className="eiv-header">
              <span className="eiv-number">{listNumber}</span>
              <h2 className="eiv-title">{item.title}</h2>

              <div className="eiv-links-inline">
                {item.websiteUrl && (
                  <a
                    className="eiv-link-icon"
                    href={item.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Official Website"
                  >
                    🌐
                  </a>
                )}
                {item.naverUrl && (
                  <a
                    className="eiv-link-icon"
                    href={item.naverUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Naver Map"
                  >
                    🗺️
                  </a>
                )}
              </div>
            </div>
            <p className="eiv-hours">{item.openHours}</p>

            <div className="eiv-desc-weather-grid">
                <div className="eiv-desc-panel">
                <p className="eiv-description">{item.description}</p>

                {item.slot && (
                    <p className="eiv-slot-text">
                    {item.slot === "Activity 🌳" &&
                        "It is recommended to do this activity during the afternoon 🌳"}
                    {item.slot === "Cafe ☕" &&
                        "It is recommended to go to this cafe during the afternoon or evening ☕"}
                    {item.slot !== "Activity 🌳" && item.slot !== "Cafe ☕" && (
                        <>
                        It is recommended to go to this place during <strong>{item.slot}</strong>.
                        </>
                    )}
                    </p>
                )}
                </div>

              {item.weather && (
                <div className="eiv-weather-panel">
                  <h3>{item.date ? `${item.date}'s Forecast` : "Weather Forecast"}</h3>
                  <div className="eiv-forecast-list">
                    {item.weather.split(', ').map((forecastStr, index) => {
                      const parts = forecastStr.match(/(\d{1,2}:\d{2})\s(\w+)\s\(([\d.]+)/);
                      if (!parts) return null;
                      if (parts[1].startsWith('9:')) return null; // ignore 9:00 AM
                      const forecast = {
                        time: parts[1],
                        condition: parts[2],
                        temp: parseFloat(parts[3]).toFixed(1),
                      };
                      return (
                        <div key={index} className="eiv-forecast-item">
                          <span className="eiv-weather-icon">{getWeatherIcon(forecast.condition)}</span>
                          <span className="eiv-forecast-time">{forecast.time}</span>
                          <span className="eiv-forecast-temp">{forecast.temp}°C</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpandedItemView;
