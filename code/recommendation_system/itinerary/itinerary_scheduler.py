from datetime import datetime, timedelta
from collections import Counter
from recommender.weather_api import get_weather_forecast, is_good_weather

class ItineraryScheduler:
    def __init__(self, user_lat, user_lon, start_date, end_date):
        self.user_lat = user_lat
        self.user_lon = user_lon
        self.start_date = start_date
        self.end_date = end_date
        forecast_end = min(end_date, datetime.now().date() + timedelta(days=7))
        self.forecasts = get_weather_forecast(user_lat, user_lon, start_date, forecast_end)

    def schedule_itineraries(self, itineraries):
        scheduled = []
        needs_reschedule = False
        days = [self.start_date + timedelta(days=i) for i in range((self.end_date - self.start_date).days + 1)]

        for i, (query, itinerary) in enumerate(itineraries):
            day = days[i % len(days)] if days else self.start_date
            
            weather_for_day = [f for f in self.forecasts if f["datetime"].date() == day]
            outdoor_ratio = 0
            warning = None
            weather_status = "no forecast available"

            weather_info_for_ai = {"avg_temp": "N/A", "condition": "unknown"}
            if weather_for_day:
                daytime_forecasts = [f for f in weather_for_day if 9 <= f['datetime'].hour <= 18]
                if daytime_forecasts:
                    temps = [f['temp'] for f in daytime_forecasts]
                    weather_info_for_ai['avg_temp'] = str(int(sum(temps) / len(temps)))
                    conditions = [f['weather'] for f in daytime_forecasts]
                    weather_info_for_ai['condition'] = Counter(conditions).most_common(1)[0][0]

            if itinerary:
                outdoor_ratio = sum(1 for place in itinerary if place.get("indoor_outdoor") == "outdoor") / len(itinerary)
                good_weather = True
                if weather_for_day:
                    key_hours = [12, 15, 18, 21]
                    key_forecasts = [f for f in weather_for_day if f["datetime"].hour in key_hours]
                    if key_forecasts:
                        good_weather = all(is_good_weather(f) for f in key_forecasts)
                        weather_status = ", ".join([f"{f['datetime'].hour}:00 {f['weather']} ({f['temp']}°C)" for f in key_forecasts])
                    if outdoor_ratio > 0.5 and not good_weather:
                        warning = "⚠️ Weather may not be ideal for these outdoor activities."
            
            for place in itinerary:
                place["weather"] = weather_status

            scheduled.append({
                "query": query,
                "day": str(day),
                "itinerary": itinerary,
                "weather": weather_status,
                "warning": warning
            })

        if all(item.get("warning") for item in scheduled if item["itinerary"]):
            needs_reschedule = True

        return {
            "scheduled": scheduled,
            "needs_reschedule": needs_reschedule
        }