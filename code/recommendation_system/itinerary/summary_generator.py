import os
import openai
import json
from datetime import date, datetime


openai.api_key = os.getenv("OPENAI_API_KEY")

def generate_summary_with_ai(scheduled_itineraries):
    
    print("=== Scheduled Itineraries Received by Summary Generator ===")
    try:
        print(json.dumps(scheduled_itineraries, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"(Could not pretty-print itineraries: {e})")
        print(scheduled_itineraries)
        
    day_blocks = []
    for day in scheduled_itineraries:
        day_num = day.get("day", "?")
        weather_info = day.get("weather") or {}

        if isinstance(weather_info, str):
            weather_info = {"avg_temp": "N/A", "dominant_weather": weather_info}
        elif not isinstance(weather_info, dict):
            weather_info = {"avg_temp": "N/A", "dominant_weather": "Clear"}

        avg_temp = weather_info.get("avg_temp", "N/A")
        dominant_weather = weather_info.get("dominant_weather", "Clear")
        weather_str = f"Average temperature: {avg_temp}°C, {dominant_weather} conditions"

        items = []
        for item in day.get("itinerary", []):
            name = item.get("name", "Unnamed place")
            desc = item.get("description", "")
            sentences = desc.split(". ")
            short_desc = ". ".join(sentences[:2]).strip()
            if short_desc:
                items.append(f"{name} ({short_desc})")
            else:
                items.append(name)

        items_str = ", ".join(items)
        day_blocks.append(f"Day {day_num}:\nWeather: {weather_str}\nActivities: {items_str}")

    prompt_text = "\n\n".join(day_blocks)

    prompt = f"""
You are a helpful travel guide. Write a short descriptive paragraph suggesting a multi-day travel plan in 1100 characters, no markdown, just plain text.
Start each day with "Day X:" and include weather and activities for that day. dont mention dates or like "Day 27" at all. just explain the itinerary step by step and how it foes with the weather

INPUT:
{prompt_text}

OUTPUT: return a JSON object with only one field: "summary"
Example: {{"summary": "Your generated text here."}}
"""

    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful travel guide."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7,
        )

        content_raw = response.choices[0].message.content
        content = content_raw.strip() if content_raw else ""
        data = json.loads(content)
        return data.get("summary", "")

    except json.JSONDecodeError:
        return "Could not generate a valid JSON summary for the itinerary."
    except Exception as e:
        print(f"Error during AI summary generation: {e}")
        return "Could not generate an AI summary for the itinerary."