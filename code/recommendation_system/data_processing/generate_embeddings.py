import pandas as pd
import psycopg2
import numpy as np
from sentence_transformers import SentenceTransformer
import sys
import os
import time
import json
import random
import google.generativeai as genai
from google.api_core import exceptions

# --- (The 'generate_gemini_description_json' function remains the same as the last version with exponential backoff) ---
def generate_gemini_description_json(row, model):
    # This function with the retry logic is still needed and is unchanged.
    location_data = {
        'name': row.get('name', ''),
        'category': row.get('primary_category', ''),
        'tags': row.get('tags', '')
    }
    location_data = {k: v for k, v in location_data.items() if v}
    data_string = ", ".join([f"{key}: {value}" for key, value in location_data.items()])
    prompt = f"""
    You are a data enrichment specialist. Your task is to generate a JSON object containing a creative, appealing description for a location in Busan, South Korea.
    **Instructions:**
    - Use the provided data to create an engaging, fluent paragraph between 40 and 70 words.
    - Your output MUST be a valid JSON object with a single key: "description".
    **Input Data:**
    {data_string} 
    **Output JSON:**
    """
    max_retries = 5
    base_delay = 60
    for attempt in range(max_retries):
        try:
            generation_config = genai.types.GenerationConfig(response_mime_type="application/json")
            response = model.generate_content(prompt, generation_config=generation_config)
            response_json = json.loads(response.text)
            description = response_json['description']
            return description.strip()
        except exceptions.ResourceExhausted as e:
            print(f"  - Rate limit hit for ID {row.get('id', 'N/A')}. Waiting... (Attempt {attempt + 1}/{max_retries})")
            delay = base_delay * (2 ** attempt) + random.uniform(0, 5)
            print(f"    ...backing off for {delay:.2f} seconds.")
            time.sleep(delay)
        except (json.JSONDecodeError, KeyError) as e:
            print(f"  - JSON Parsing Error for ID {row.get('id', 'N/A')}: {e}. Retrying...")
            time.sleep(5)
        except Exception as e:
            print(f"  - Unexpected API Error for ID {row.get('id', 'N/A')}: {e}. Retrying with backoff...")
            delay = base_delay * (2 ** attempt) + random.uniform(0, 5)
            time.sleep(delay)
    print(f"  - All retries failed for ID {row.get('id', 'N/A')}. Using fallback.")
    return f"{row.get('name', '')}. Tags include: {row.get('tags', '')}"


# --- THE MAIN ORCHESTRATION SCRIPT ---
def generate_and_save_embeddings(db_params, api_key):
    # Configure the Gemini API
    genai.configure(api_key=api_key)
    gemini_model = genai.GenerativeModel('gemini-2.5-pro')

    # --- NEW: RESUME LOGIC ---
    PROGRESS_FILE = 'descriptions_progress.csv'
    
    # 1. Fetch ALL locations from the database first
    conn = psycopg2.connect(**db_params)
    sql_query = "SELECT id, name, tags, primary_category, meal_type FROM locations ORDER BY id;"
    df_all_locations = pd.read_sql_query(sql_query, conn)
    conn.close()
    print(f"Total locations to process: {len(df_all_locations)}")

    # 2. Check for an existing progress file
    processed_ids = set()
    if os.path.exists(PROGRESS_FILE):
        print(f"Found existing progress file: '{PROGRESS_FILE}'. Resuming...")
        df_progress = pd.read_csv(PROGRESS_FILE)
        processed_ids = set(df_progress['id'])
        print(f"{len(processed_ids)} locations already have descriptions.")
    else:
        print("No progress file found. Starting a new session.")
        df_progress = pd.DataFrame(columns=['id', 'description'])

    # 3. Filter out the locations that are already processed
    df_to_process = df_all_locations[~df_all_locations['id'].isin(processed_ids)]
    print(f"{len(df_to_process)} locations remaining to be processed.")

    if df_to_process.empty:
        print("All locations have already been processed.")
    
    # --- NEW: GRACEFUL SHUTDOWN AND INCREMENTAL SAVING ---
    newly_processed_data = []
    try:
        if not df_to_process.empty:
            print("\nStarting Gemini description generation...")
            for index, row in df_to_process.iterrows():
                print(f"Processing ID: {row['id']}...")
                description = generate_gemini_description_json(row, gemini_model)
                newly_processed_data.append({'id': row['id'], 'description': description})

    except KeyboardInterrupt:
        print("\n--- KeyboardInterrupt detected! Saving progress before exiting. ---")
    finally:
        if newly_processed_data:
            df_new_progress = pd.DataFrame(newly_processed_data)
            df_combined = pd.concat([df_progress, df_new_progress], ignore_index=True)
            df_combined.to_csv(PROGRESS_FILE, index=False)
            print(f"\nSuccessfully saved {len(newly_processed_data)} new descriptions to '{PROGRESS_FILE}'.")
            df_progress = df_combined
        else:
            print("\nNo new descriptions were generated in this session.")

    # --- FINAL EMBEDDING GENERATION (runs after the loop is complete) ---
    print("\n--- All descriptions are now generated. Proceeding to create embeddings. ---")
    
    # Merge the final descriptions with the original data to ensure correct order
    df_final = df_all_locations.merge(df_progress, on='id', how='left')
    
    # Check for any locations that might have been missed
    if df_final['description'].isnull().any():
        print("WARNING: Some locations are missing descriptions. Using fallback.")
        df_final['description'].fillna("No description available.", inplace=True)
        
    sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
    sentences = df_final['description'].tolist()
    print(f"Encoding {len(sentences)} final descriptions into vectors...")
    
    location_embeddings = sbert_model.encode(sentences, show_progress_bar=True)
    location_ids = df_final['id'].to_numpy()
    
    np.save('location_embeddings.npy', location_embeddings)
    np.save('location_ids.npy', location_ids)
    
    print("\nEmbeddings from Gemini descriptions generated successfully!")
    print(f"Embeddings matrix shape: {location_embeddings.shape}")

if __name__ == '__main__':
    GEMINI_API_KEY = ""

    if GEMINI_API_KEY == "YOUR_API_KEY_HERE":
        print("ERROR: Please replace 'YOUR_API_KEY_HERE' with your actual Gemini API key.")
    else:
        db_connection_params = {
            "host": "",
            "database": "",
            "user": "",
            "password": "",
            "port": ""
        }
        generate_and_save_embeddings(db_connection_params, GEMINI_API_KEY)