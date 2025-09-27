export const connectItineraryWebSocket = (onUpdate, initialData) => {
  const ws = new WebSocket("wss://tueniuu-itinerary-recommender-api.hf.space/ws/itinerary");

  ws.onopen = () => {
    console.log("Connected to itinerary WebSocket");
    // Send initial itinerary data to backend
    ws.send(JSON.stringify(initialData));
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    onUpdate(message); 
  };

  ws.onclose = () => {
    console.log("WebSocket connection closed");
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };

  return ws;
};
