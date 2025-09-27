import requests
from datetime import datetime
import os

API_KEY = os.getenv("WEATHER_API_KEY")
BASE_URL = "https://api.openweathermap.org/data/2.5/forecast"

def get_weather_forecast(lat, lon, start_date, end_date):
    """
    Returns forecast by 3-hour blocks for a date range.
    """
    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
        "units": "metric"
    }
    resp = requests.get(BASE_URL, params=params).json()
    forecasts = []

    for item in resp.get('list', []):
        dt = datetime.fromtimestamp(item['dt'])
        if start_date <= dt.date() <= end_date:
            forecasts.append({
                'datetime': dt,
                'temp': item['main']['temp'],
                'weather': item['weather'][0]['main'].lower(),
                'rain': item.get('rain', {}).get('3h', 0)
            })
    return forecasts

def is_good_weather(forecast):
    """
    Returns True if the weather is suitable for outdoor activities.
    """
    return forecast['rain'] < 1 and forecast['weather'] not in ['rain', 'thunderstorm']
