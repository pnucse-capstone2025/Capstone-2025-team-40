const transformApiResponse = (apiData) => {
  if (!apiData || !apiData.scheduled_itineraries || apiData.scheduled_itineraries.length === 0) {
    console.error("Invalid or empty API data received in transformApiResponse");
    return null;
  }

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };
  
  const getWeatherIconUrl = (weather) => {
    if (!weather) return 'https://openweathermap.org/img/wn/50d@2x.png';
    const weatherCondition = weather.toLowerCase();
    if (weatherCondition.includes('rain')) return 'https://openweathermap.org/img/wn/10d@2x.png';
    if (weatherCondition.includes('clouds')) return 'https://openweathermap.org/img/wn/03d@2x.png';
    if (weatherCondition.includes('clear')) return 'https://openweathermap.org/img/wn/01d@2x.png';
    return 'https://openweathermap.org/img/wn/50d@2x.png';
  };

  const fullItinerary = apiData.scheduled_itineraries.map(daySchedule => ({
    day: new Date(daySchedule.day + 'T00:00:00').getDate(),
    items: daySchedule.itinerary.map(item => ({
      id: item.id,
      title: item.name,
      openHours: `OPEN ${item.operating_hours?.monday || 'N/A'}`,
      lat: item.geom.lat,
      lon: item.geom.lon,
      description: item.description,
      longDescription: item.description,
      websiteUrl: item.website,
      naverUrl: item.naver_url,
      slot: item.slot,
      weather: item.weather,
      summary: null, // start with null
    }))
  }));

  const weatherForecasts = apiData.daily_forecast.slice(0, 6).map(forecast => ({
    day: getDayOfWeek(forecast.date),
    iconUrl: getWeatherIconUrl(forecast.dominant_weather),
    temp: Math.round(forecast.avg_temp),
  }));

  return {
    fullItinerary,
    weatherForecasts
  };
};


// This function makes the actual POST request to your backend
export const generateItinerary = async (requestBody) => {
  const API_ENDPOINT = "https://tueniuu-itinerary-recommender-api.hf.space/schedule";

  // << --- THE FIX --- >>
  // Get the token directly using the key "token"
  const token = localStorage.getItem('token');

  // Debugging line to confirm the token is found
  console.log("Attempting to use token from localStorage key 'token':", token);

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    // The token from localStorage is just the string, no need to parse JSON
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.error("TOKEN NOT FOUND under key 'token'. The request will be forbidden.");
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Response:", errorBody);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.json();
    return transformApiResponse(rawData);

  } catch (error) {
    console.error("Failed to generate itinerary:", error);
    return null;
  }
};
