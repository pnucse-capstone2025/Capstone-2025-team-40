import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import marker2x from 'leaflet/dist/images/marker-icon-2x.png';
import marker1x from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';


function MapController({ bounds }) {
  const map = useMap();

  useEffect(() => {
    map.scrollWheelZoom.disable();
    map.dragging.enable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]); 

  return null;
}

function InteractiveMap({ locations }) {
  if (!locations || locations.length === 0) {
    return (
      <MapContainer
        center={[35.165, 129.135]}
        zoom={13}
        zoomControl={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapController />
      </MapContainer>
    );
  }

  const bounds = L.latLngBounds(locations.map(item => [item.lat, item.lon]));

  return (
    <MapContainer
      zoomControl={true}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {locations.map(item => (
        <Marker key={item.id} position={[item.lat, item.lon]}>
          <Popup>
            <strong>{item.title}</strong>
          </Popup>
        </Marker>
      ))}

      <MapController bounds={bounds} />
    </MapContainer>
  );
}

export default InteractiveMap;