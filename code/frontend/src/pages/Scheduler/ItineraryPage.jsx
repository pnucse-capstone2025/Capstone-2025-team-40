import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import ItineraryItem from "../../ItineraryItem";
import WeatherCard from "../../WeatherCard";
import InteractiveMap from "../../InteractiveMap"; 
import ExpandedItemView from '../../components/ExpandedItemView'; 
import { useLocation, useNavigate } from 'react-router-dom';
import { connectItineraryWebSocket } from "../../utils/itineraryApi";
import GeminiChat from "../../components/GeminiChat";
import "../../styles/itinerary.css";

function ItineraryPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [pageData, setPageData] = useState(location.state?.itineraryData);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [summaryText, setSummaryText] = useState(pageData?.summaryText || "");
  const [selectedItemNumber, setSelectedItemNumber] = useState(null);

  const itineraryContext = useMemo(() => {
    if (!pageData || !pageData.fullItinerary) return "";

    const formatDay = (day) => {
      const items = day.items.map(item => 
        `  - ${item.name}: ${item.description}`
      ).join('\n');
      return `Day ${day.day}:\n${items}`;
    };

    return pageData.fullItinerary.map(formatDay).join('\n\n');
  }, [pageData]);

  const weatherContext = useMemo(() => {
  if (!pageData || !pageData.weatherForecasts) return "";

  const formatForecast = (forecast) => 
    `- ${forecast.day}: The temperature will be around ${forecast.temp}.`;

  return "Weather Forecast:\n" + pageData.weatherForecasts.map(formatForecast).join('\n');
}, [pageData]);

  useEffect(() => {
    if (!pageData) return;

    const handleSummaryUpdate = (message) => {
      if (message.summary) {
        setSummaryText(message.summary);
      }
    };

const initialData = {
  scheduled_itineraries: pageData.fullItinerary.map(day => ({
    day: day.day,
    itinerary: day.items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      lat: item.lat,
      lon: item.lon,
      weather: item.weather || null
    })),
    weather: day.items[0]?.weather || null,
    warning: false
  }))
};

    const ws = connectItineraryWebSocket(handleSummaryUpdate, initialData);

    return () => ws.close();
  }, [pageData]);


  const handleItemClick = (item, listNumber) => {
    setSelectedItem(item);
    setSelectedItemNumber(listNumber);
  };

  const handleCloseExpandedView = () => {
    setSelectedItem(null);
    setSelectedItemNumber(null);
  };

  const handlePrevDay = () => {
    setCurrentDayIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  const handleNextDay = () => {
    if (!pageData) return;
    setCurrentDayIndex((prevIndex) =>
      Math.min(pageData.fullItinerary.length - 1, prevIndex + 1)
    );
  };

  if (!pageData || !pageData.fullItinerary) {
    return <div className="loading-screen">Loading Itinerary...</div>;
  }

  const currentItinerary = pageData.fullItinerary[currentDayIndex];

  return (
    <>
      <div className="page-title-container animate-title">
        <h1 className="main-title">YOUR<br />ITINERARIES</h1>
      </div>

      <Card className="border-0 itinerary-card animate-card">
        <Row className="g-0 itinerary-main-content">
          <Col md={5} className="itinerary-list-col">
            <Card.Body>
              <div className="itinerary-items-container">
                {currentItinerary.items.map((item, index) => {
                  const sentences = item.description.split('. ');
                  const firstTwo = sentences.slice(0, 2).join('. ') + (sentences.length >= 2 ? '.' : '');

                  return (
                    <ItineraryItem
                      key={`${currentDayIndex}-${item.id}`}
                      item={{ ...item, description: firstTwo }}
                      listNumber={index + 1}
                      onClick={() => {
                        const dateForDay = pageData.weatherForecasts[currentDayIndex]?.day;
                        handleItemClick({ ...item, date: dateForDay });
                      }}
                    />
                  );
                })}
              </div>
              <div className="day-navigator">
                <button
                  className="day-arrow"
                  onClick={handlePrevDay}
                  disabled={currentDayIndex === 0}
                >
                  &lt;
                </button>
                <span> DAY {currentDayIndex + 1} </span>
                <button
                  className="day-arrow"
                  onClick={handleNextDay}
                  disabled={currentDayIndex === pageData.fullItinerary.length - 1}
                >
                  &gt;
                </button>
              </div>
            </Card.Body>
          </Col>
          <Col md={7} className="image-col">
            <InteractiveMap locations={currentItinerary.items} />
          </Col>
        </Row>
      </Card>

      <Container fluid className="lower-section animate-card">
        <Row>
          <Col md={6} className="pt-5">
            <Card className="border-0 h-100 info-card">
            <Card.Body>
              <p>{summaryText || "Generating itinerary summary..."}</p>
            </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="border-0 weather-panel">
              <Card.Body>
                <h2 className="weather-forecast-title mt-0">WEATHER FORECAST</h2>
                <div className="weather-forecast-grid">
                  {pageData.weatherForecasts.map((day, index) => (
                    <div key={day.day} className="animate-weather-day" style={{ animationDelay: `${index * 0.1}s` }}>
                      <WeatherCard day={day.day} iconUrl={day.iconUrl} temp={day.temp} />
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {selectedItem && (
        <>
          {console.log("Data for expanded view:", selectedItem)}
          <ExpandedItemView 
          item={selectedItem}
          listNumber={selectedItemNumber}
          onClose={handleCloseExpandedView} 
        />
        </>
      )}
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "30px",
    gap: "40px",
    background: "#FFFBF6",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  }}
>
  <h1
    style={{
      fontSize: "4rem",
      fontWeight: "900",
      lineHeight: "1.2",
      color: "#1f2937",
      margin: 0,
      whiteSpace: "pre-line",
    }}
  >
    HAVE A {"\n"} QUESTION ABOUT {"\n"} THE ITINERARY?{"\n"}ASK!
  </h1>

  <div
    style={{
      flexShrink: 0,
      width: "1000px",
      height: "450px",
      borderRadius: "20px", 
      overflow: "hidden",
      boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
      background: "#ffffff",
      padding: "10px",
    }}
  >
    <GeminiChat itineraryContext={itineraryContext} weatherContext={weatherContext} />
  </div>
</div>
    </>
  );
}

export default ItineraryPage;