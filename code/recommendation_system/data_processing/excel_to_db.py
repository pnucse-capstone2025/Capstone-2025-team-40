import pandas as pd
import psycopg2
import json
import numpy as np

def format_operating_hours(time_str):
    """
    Transforms a simple time string (e.g., '11:00-22:00') into a
    structured JSON object for all days of the week.
    """
    if not isinstance(time_str, str) or '-' not in time_str:
        return None
    schedule = {
        "monday": time_str, "tuesday": time_str, "wednesday": time_str,
        "thursday": time_str, "friday": time_str, "saturday": time_str,
        "sunday": time_str,
    }
    return json.dumps(schedule)

def parse_period_dates(period_str):
    """
    Parses a date range string like '2025.01.04 - 2025.12.27'
    and returns a tuple of (start_date, end_date).
    """
    if not isinstance(period_str, str) or '-' not in period_str:
        return None, None
    try:
        parts = period_str.split('-')
        start_date = parts[0].strip().replace('.', '-')
        end_date = parts[1].strip().replace('.', '-')
        return start_date, end_date
    except Exception:
        return None, None

def load_excel_to_postgres(excel_path, db_params):
    """
    Connects to PostgreSQL, reads an Excel file, and inserts the data.
    """
    conn = None
    cur = None
    try:
        print(f"Reading data from '{excel_path}'...")
        df = pd.read_excel(excel_path)
        df = df.replace({np.nan: None})
        print("Data read successfully. Preparing for database insertion...")

        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()
        print("Successfully connected to the PostgreSQL database.")

        for index, row in df.iterrows():
            operating_hours_json = format_operating_hours(row.get('time'))
            start_date, end_date = parse_period_dates(row.get('period'))

            sql = """
                INSERT INTO locations (
                    name, address, naver_url, region, primary_category, tags,
                    price_level, indoor_outdoor, operating_hours,
                    period_start_date, period_end_date, website, meal_type, geom
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    ST_SetSRID(ST_MakePoint(%s, %s), 4326)
                ) ON CONFLICT (name) DO NOTHING;
            """
            
            data_tuple = (
                row.get('name'), row.get('address'), row.get('naver_url'), row.get('region'),
                row.get('primary_category'), row.get('tags'), row.get('price_level'),
                row.get('indoor_outdoor'), operating_hours_json, start_date, end_date,
                row.get('website'), row.get('type'),
                row.get('longitude'), row.get('latitude')
            )
            
            cur.execute(sql, data_tuple)

        conn.commit()
        print(f"\nSuccessfully processed and inserted {len(df)} rows into the 'locations' table.")

    except FileNotFoundError:
        print(f"ERROR: The file '{excel_path}' was not found.")
    except psycopg2.Error as e:
        print(f"DATABASE ERROR: {e}")
    except Exception as e:
        print(f"AN UNEXPECTED ERROR OCCURRED: {e}")
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()
            print("Database connection closed.")

if __name__ == '__main__':
    db_connection_params = {
        "host": "localhost",
        "database": "recommendation_locations",
        "user": "postgres",
        "password": "nafikova03",
        "port": "5432"
    }
    excel_file_path = "loc_data.xlsx"
    load_excel_to_postgres(excel_file_path, db_connection_params)