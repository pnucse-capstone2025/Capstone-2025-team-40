import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List
from datetime import date, datetime, timedelta
from collections import Counter
import math
import jwt
import json
import os
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from itinerary.summary_generator import generate_summary_with_ai
from recommender.recommender import Recommender
from itinerary.itinerary_scheduler import ItineraryScheduler
from recommender.weather_api import get_weather_forecast


load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "defau1t@#_1n$ecure@#_key1$%")
ALGORITHM = "HS256"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)



class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_text(json.dumps(message))

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_text(json.dumps(message))


manager = ConnectionManager()


class ItineraryRequest(BaseModel):
    queries: List[str]
    user_lat: float
    user_lon: float
    start_date: date
    end_date: date

    class Config:
        schema_extra = {
            "example": {
                "queries": [
                    "I want to eat at a korean restaurant and go on a sky capsule ride",
                    "I want to go to a luxurious italian restaurant and drink at a jazz club"
                ],
                "user_lat": 35.1796,
                "user_lon": 129.0756,
                "start_date": "2025-09-14",
                "end_date": "2025-09-15"
            }
        }

security = HTTPBearer()
def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Decodes the JWT token to get the user's ID."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id") # 'sub' is the standard claim for subject/user ID
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token: User ID not found")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- FastAPI Application Setup ---
app = FastAPI(
    title="Itinerary Recommendation API",
    description="An API to generate scheduled travel itineraries based on user queries, location, and dates.",
    version="1.0.0"
)

# --- Database and Recommender Initialization ---
db_params = {
    "host": os.getenv("DB_HOST"),
    "database": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "port": os.getenv("DB_PORT")
}

recommender = Recommender(db_params)


def format_daily_forecast(forecasts):
    if not forecasts:
        return []

    daily_data = {}
    for f in forecasts:
        day = f['datetime'].date()
        if day not in daily_data:
            daily_data[day] = {'temps': [], 'weathers': []}
        daily_data[day]['temps'].append(f['temp'])
        daily_data[day]['weathers'].append(f['weather'])

    daily_summary = []
    for day, data in sorted(daily_data.items()):
        if not data['temps']:
            continue

        # Find the most common weather condition for the day
        weather_counts = Counter(w for w in data['weathers'] if w)
        dominant_weather = weather_counts.most_common(1)[0][0] if weather_counts else "Unknown"

        daily_summary.append({
            "date": str(day),
            "temp_min": min(data['temps']),
            "temp_max": max(data['temps']),
            "avg_temp": round(sum(data['temps']) / len(data['temps']), 1),
            "dominant_weather": dominant_weather.capitalize()
        })

    return daily_summary


@app.get("/")
def health_check():
    """A simple endpoint to confirm the API is running."""
    return {"status": "healthy"}


# --- CORS Middleware ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, 
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- API Endpoint Definition ---
@app.post("/schedule", summary="Generate a Scheduled Itinerary")
def create_scheduled_itinerary(
    request: ItineraryRequest,
    user_id: str = Depends(get_current_user_id)
):
    used_place_ids = set()
    all_itineraries = []

    # 1. Get recommendations for each query
    for query in request.queries:
        itinerary = recommender.get_recommendations(
            query,
            request.user_lat,
            request.user_lon,
            exclude_ids=list(used_place_ids)
        )
        if itinerary:
            new_ids = {place['id'] for place in itinerary}
            used_place_ids.update(new_ids)
            all_itineraries.append((query, itinerary))

    # 2. Pass to the scheduler
    scheduler = ItineraryScheduler(
        request.user_lat,
        request.user_lon,
        request.start_date,
        request.end_date
    )
    scheduled_result = scheduler.schedule_itineraries(all_itineraries)

    # 3. Get and format the 6-day forecast
    forecast_start = date.today()
    forecast_end = forecast_start + timedelta(days=6)
    raw_forecast = get_weather_forecast(request.user_lat, request.user_lon, forecast_start, forecast_end)
    daily_forecast = format_daily_forecast(raw_forecast)

    try:
        supabase.table('itineraries').insert({
            "user_id": user_id,
            "itinerary_data": scheduled_result,
            "start_date": request.start_date.isoformat(),
            "end_date": request.end_date.isoformat()
        }).execute()
        print(f"Successfully saved itinerary for user: {user_id}")
    except Exception as e:
        print(f"ERROR: Could not save itinerary to Supabase. Reason: {e}")

    # 4. Combine results into the final response
    return {
        "scheduled_itineraries": scheduled_result["scheduled"],
        "needs_reschedule": scheduled_result["needs_reschedule"],
        "daily_forecast": daily_forecast
    }


@app.websocket("/ws/itinerary")
async def websocket_itinerary(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Receive initial data from client
        data = await websocket.receive_text()
        request_data = json.loads(data)

        # Extract the full scheduled itinerary
        scheduled_itineraries = request_data["scheduled_itineraries"]

        # Send initial itinerary immediately without summary
        await manager.send_personal_message(
            {"scheduled_itineraries": scheduled_itineraries, "summary": None},
            websocket
        )

        # Combine all itinerary items across all days
        combined_itinerary = []
        for day in scheduled_itineraries:
            combined_itinerary.extend(day["itinerary"])

        weather_info = scheduled_itineraries[0]["weather"] if scheduled_itineraries else {}

        cleaned_itineraries = []
        for day in scheduled_itineraries:
            cleaned_itineraries.append({
                "itinerary": day["itinerary"],
                "weather": day.get("weather")
            })
        
        summary = generate_summary_with_ai(
            scheduled_itineraries=cleaned_itineraries
        )

        # Send back the summary in one message
        await manager.send_personal_message(
            {"scheduled_itineraries": scheduled_itineraries, "summary": summary},
            websocket
        )

    except WebSocketDisconnect:
        manager.disconnect(websocket)


