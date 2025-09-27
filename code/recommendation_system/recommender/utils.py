import numpy as np
import re

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlon, dlat = lon2 - lon1, lat2 - lat1
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    return R * 2 * np.arcsin(np.sqrt(a))

def deconstruct_query(query: str):
    sub_queries = re.split(r',\s*|\s+and\s+', query.lower())
    filler_phrases = ['i want to go to', 'i want', 'can you find me', 'find me', 'a', 'an']
    cleaned = []
    for q in sub_queries:
        q = q.strip()
        for phrase in filler_phrases:
            if q.startswith(phrase + ' '):
                q = q[len(phrase):].strip()
                break
        if q:
            cleaned.append(q)
    return cleaned
