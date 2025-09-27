import faiss
import numpy as np
import psycopg2
import pandas as pd
from sentence_transformers import SentenceTransformer
from datetime import datetime

from recommender.utils import haversine, deconstruct_query
from recommender.must_have_extractor import extract_must_haves
from itinerary.itinerary_planner import ItineraryPlanner

class Recommender:
    def __init__(self, db_params):
        print("Initializing Recommender...")
        self.db_params = db_params
        self.sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.faiss_index = faiss.read_index('location_index.faiss')
        self.location_ids = np.load('location_ids.npy', allow_pickle=True)
        self.planner = ItineraryPlanner()

        try:
            self.descriptions_df = pd.read_csv('descriptions_progress.csv', index_col='id')
            print("Location descriptions loaded successfully.")
        except FileNotFoundError:
            print("Warning: descriptions_progress.csv not found. Summaries will be less detailed.")
            self.descriptions_df = pd.DataFrame(columns=['description'])

        print("Models and indexes loaded successfully.")

    def get_recommendations(self, query, user_lat, user_lon, k_per_sub_query=20, exclude_ids=None):
        print(f"\nOriginal query: '{query}'")
        sub_queries = deconstruct_query(query)
        print(f"Deconstructed into: {sub_queries}")

        # FAISS retrieval
        candidate_pool = []
        for sub_q in sub_queries:
            emb = self.sbert_model.encode([sub_q]).astype('float32')
            faiss.normalize_L2(emb)
            scores, indices = self.faiss_index.search(emb, k_per_sub_query)
            ids = self.location_ids[indices.flatten()]
            for id, score in zip(ids, scores.flatten()):
                candidate_pool.append({'id': id, 'similarity_score': score, 'source_query': sub_q})

        if not candidate_pool:
            print("No candidates found for query.")
            return []

        df_candidates = pd.DataFrame(candidate_pool).drop_duplicates('id')

        if exclude_ids:
            print(f"Excluding {len(exclude_ids)} previously used IDs.")
            # Use isin() to find which candidates to remove and the ~ to invert the selection
            df_candidates = df_candidates[~df_candidates['id'].isin(exclude_ids)]
            if df_candidates.empty:
                print("All candidates were excluded.")
                return []

        # DB fetch
        conn = psycopg2.connect(**self.db_params)
        ids_tuple = tuple(df_candidates['id'])
        if not ids_tuple:
            return []
        sql = """
            SELECT id, name, region, primary_category, tags, operating_hours, meal_type,
                ST_Y(geom::geometry) as latitude, ST_X(geom::geometry) as longitude,
                indoor_outdoor, website, naver_url
            FROM locations 
            WHERE id IN %s;
        """
        df_db = pd.read_sql_query(sql, conn, index_col='id', params=(ids_tuple,))
        conn.close()
        df_db['region'] = df_db['region'].str.strip()
        df_candidates = df_candidates.set_index('id').join(df_db, how='inner')

        df_candidates = df_candidates.join(self.descriptions_df, how='left')
        df_candidates['description'].fillna('', inplace=True)

        if df_candidates.empty:
            return []

        # Region selection
        region_score = df_candidates.groupby('region').agg(
            total_score=('similarity_score', 'sum'),
            query_coverage=('source_query', 'nunique')
        )
        region_score['final_region_score'] = (region_score['query_coverage'] ** 2) * region_score['total_score']
        winning_region = region_score['final_region_score'].idxmax()
        print(f"Winning region: {winning_region}")
        df_final = df_candidates[df_candidates['region'] == winning_region].copy()
        if df_final.empty:
            return []

        # Distance penalty
        df_final['distance_km'] = haversine(user_lat, user_lon, df_final['latitude'], df_final['longitude'])
        df_final['distance_penalty'] = 1 / (1 + df_final['distance_km']**2)

        # Time bonus
        now = datetime.now()
        current_day, current_time = now.strftime('%A').lower(), now.strftime('%H:%M')

        def is_open(hours_json):
            if not isinstance(hours_json, dict) or current_day not in hours_json:
                return False
            time_range = hours_json[current_day]
            if time_range in ['Closed', '24 hours']:
                return time_range == '24 hours'
            try:
                start, end = [t.strip() for t in time_range.split('-')]
                return (end < start and (current_time >= start or current_time < end)) or (start <= current_time < end)
            except Exception:
                return False

        df_final['time_bonus'] = df_final['operating_hours'].apply(lambda h: 1.2 if is_open(h) else 1.0)

        # Final score
        df_final['final_score'] = df_final['similarity_score'] * df_final['distance_penalty'] * df_final['time_bonus']
        df_final = df_final.sort_values('final_score', ascending=False)

        # Itinerary planning
        must_haves = extract_must_haves(sub_queries, df_final)
        if must_haves:
            print(f"Applying hard constraints: {must_haves}")
            return self.planner.plan_day(df_final, mode="or_tools", must_haves=must_haves)
        else:
            return self.planner.plan_day(df_final, mode="beam", beam_width=3)
