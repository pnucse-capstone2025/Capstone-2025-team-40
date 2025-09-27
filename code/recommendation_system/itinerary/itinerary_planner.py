import pandas as pd
from datetime import datetime
from ortools.sat.python import cp_model

class ItineraryPlanner:
    def __init__(self):
        self.schedule_structure = [
            {'slot': 'Lunch 🍱', 'time': '13:00', 'types': ['FOOD']},
            {'slot': 'Activity 🌳', 'time': '14:00', 'types': ['AFTERNOON', 'ACTIVITY']},
            {'slot': 'Activity 🌳', 'time': '15:00', 'types': ['AFTERNOON', 'ACTIVITY']},
            {'slot': 'Cafe ☕', 'time': '16:30', 'types': ['CAFE']},
            {'slot': 'Dinner 🍽️', 'time': '19:00', 'types': ['FOOD']},
            {'slot': 'Evening ✨', 'time': '21:00', 'types': ['EVENING_EVENT']}
        ]

        self.transition_scores = {
            ('FOOD', 'ACTIVITY'): 1.0, ('FOOD', 'CAFE'): 1.0,
            ('ACTIVITY', 'FOOD'): 1.0,
            ('CAFE', 'FOOD'): 1.0,
            ('CAFE', 'EVENING_EVENT'): 1.0, ('ACTIVITY', 'EVENING_EVENT'): 1.0,
            ('AFTERNOON', 'FOOD'): 1.0,
            ('FOOD', 'FOOD'): -0.5,
        }

    # Helper functions
    def _categorize_location(self, row):
        tags = str(row.get('primary_category', '')).lower()
        food_keywords = ['dinner restaurant', 'brunch', 'restaurant', 'bbq', 'japanese restaurant',
                         'chinese restaurant', 'italian restaurant', 'korean restaurant', 'burger',
                         'taiwanese restaurant', 'fried chicken', 'spanish restaurant']
        cafe_keywords = ['cafe', 'tea house', 'dessert cafe', 'bakery', 'specialty coffee',
                         'gelato shop', 'brunch cafe', 'bakery cafe']
        evening_keywords = ['bar', 'jazz club', 'izakaya', 'wine bar', 'coffee bar',
                            'lp bar', 'whisky bar']
        afternoon_keywords = ['museum', 'entertainment', 'shopping', 'park', 'dog cafe', 'cat cafe']

        if any(k in tags for k in evening_keywords): return 'EVENING_EVENT'
        if any(k in tags for k in food_keywords): return 'FOOD'
        if any(k in tags for k in cafe_keywords): return 'CAFE'
        if any(k in tags for k in afternoon_keywords): return 'AFTERNOON'
        return 'ACTIVITY'

    def _is_open_at(self, hours_json, day_str, time_str):
        if not isinstance(hours_json, dict) or day_str not in hours_json:
            return False
        time_range = hours_json[day_str]
        if time_range in ['Closed', '24 hours']:
            return time_range == '24 hours'
        try:
            start, end = [t.strip() for t in time_range.split('-')]
            if end < start:
                return time_str >= start or time_str < end
            else:
                return start <= time_str < end
        except (ValueError, AttributeError):
            return False

    # Beam Search
    def _plan_day_beam(self, df_candidates, beam_width=5):
        print("\n[Beam Search] Building itinerary with Query-Coverage-Aware Beam Search...")
        df_candidates['schedule_category'] = df_candidates.apply(self._categorize_location, axis=1)

        current_day = datetime.now().strftime('%A').lower()
        beam = []
        coverage_bonus = 2.0

        step_info = self.schedule_structure[0]
        pool = df_candidates[
            (df_candidates['schedule_category'].isin(step_info['types'])) &
            (df_candidates['operating_hours'].apply(lambda h: self._is_open_at(h, current_day, step_info['time'])))
        ]

        for index, location in pool.iterrows():
            beam.append({
                'ids': [index],
                'categories': [location['schedule_category']],
                'score': location['final_score'],
                'covered_queries': {location['source_query']}
            })
        beam = sorted(beam, key=lambda x: x['score'], reverse=True)[:beam_width]

        # Expand through schedule
        for step_info in self.schedule_structure[1:]:
            potential_new_paths = []
            for path in beam:
                last_category = path['categories'][-1]
                next_pool = df_candidates[
                    (~df_candidates.index.isin(path['ids'])) &
                    (df_candidates['schedule_category'].isin(step_info['types'])) &
                    (df_candidates['operating_hours'].apply(lambda h: self._is_open_at(h, current_day, step_info['time'])))
                ]
                for index, next_location in next_pool.iterrows():
                    trans_score = self.transition_scores.get((last_category, next_location['schedule_category']), 0)

                    bonus = 0
                    if next_location['source_query'] not in path['covered_queries']:
                        bonus = coverage_bonus

                    new_score = path['score'] + next_location['final_score'] + trans_score + bonus
                    new_covered_queries = path['covered_queries'].union({next_location['source_query']})

                    potential_new_paths.append({
                        'ids': path['ids'] + [index],
                        'categories': path['categories'] + [next_location['schedule_category']],
                        'score': new_score,
                        'covered_queries': new_covered_queries
                    })

            if not potential_new_paths:
                continue
            beam = sorted(potential_new_paths, key=lambda x: x['score'], reverse=True)[:beam_width]

        if not beam:
            print("Could not generate a full itinerary (Beam Search).")
            return []

        return self._format_schedule(df_candidates, beam[0]['ids'])

    # OR-Tools 
    def _plan_day_or_tools(self, df_candidates, must_haves=None):
        print("\n[OR-Tools] Solving itinerary with hard constraints...")
        df_candidates['schedule_category'] = df_candidates.apply(self._categorize_location, axis=1)
        current_day = datetime.now().strftime('%A').lower()

        model = cp_model.CpModel()
        x = {}  # decision variables
        for i, step in enumerate(self.schedule_structure):
            for j, row in df_candidates.iterrows():
                open_ok = self._is_open_at(row['operating_hours'], current_day, step['time'])
                valid_type = row['schedule_category'] in step['types']
                x[i, j] = model.NewBoolVar(f"x[{i},{j}]")
                if not (open_ok and valid_type):
                    model.Add(x[i, j] == 0)

        # Each slot: at most one location
        for i in range(len(self.schedule_structure)):
            model.Add(sum(x[i, j] for j in df_candidates.index) <= 1)

        # Each location: used at most once
        for j in df_candidates.index:
            model.Add(sum(x[i, j] for i in range(len(self.schedule_structure))) <= 1)

        # Must-have constraints
        if must_haves:
            for tag in must_haves:
                tag_cover = []
                for i, step in enumerate(self.schedule_structure):
                    for j, row in df_candidates.iterrows():
                        text = (str(row.get("primary_category", "")) + " " + str(row.get("name", ""))).lower()
                        if tag.lower() in text:
                            tag_cover.append(x[i, j])
                if tag_cover:
                    model.Add(sum(tag_cover) >= 1)

        # Objective: maximize score
        objective_terms = []
        for i, step in enumerate(self.schedule_structure):
            for j, row in df_candidates.iterrows():
                score = row['final_score']
                objective_terms.append(score * x[i, j])
        model.Maximize(sum(objective_terms))

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 10
        status = solver.Solve(model)

        if status not in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            print("No feasible itinerary found (OR-Tools).")
            return []

        chosen_ids = []
        for i in range(len(self.schedule_structure)):
            for j in df_candidates.index:
                if solver.Value(x[i, j]) == 1:
                    chosen_ids.append(j)

        return self._format_schedule(df_candidates, chosen_ids)

    def _format_schedule(self, df_candidates, chosen_ids):
        final_schedule = []
        # --- MODIFIED to handle cases where fewer items are chosen than schedule slots ---
        num_items = min(len(chosen_ids), len(self.schedule_structure))

        for i in range(num_items):
            loc_id = chosen_ids[i]
            slot_name = self.schedule_structure[i]['slot']
            location_details = df_candidates.loc[loc_id]
            
            # --- MODIFIED to add more details to the response ---
            final_schedule.append({
                'step': i + 1,
                'slot': slot_name,
                'id': loc_id,
                'name': location_details['name'],
                'geom': {
                    'lon': location_details['longitude'],
                    'lat': location_details['latitude']
                },
                'operating_hours': location_details['operating_hours'],
                'website': location_details.get('website'),
                'naver_url': location_details.get('naver_url'),
                'description': location_details.get('description', '')
            })
        return final_schedule

    def plan_day(self, df_candidates, mode="beam", beam_width=5, must_haves=None):
        if mode == "or_tools":
            return self._plan_day_or_tools(df_candidates, must_haves=must_haves)
        else:
            return self._plan_day_beam(df_candidates, beam_width=beam_width)
