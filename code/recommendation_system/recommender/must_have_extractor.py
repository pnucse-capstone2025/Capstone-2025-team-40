def extract_must_haves(sub_queries, df_candidates):
    """
    Dynamically extract must-have constraints from user sub-queries
    by checking overlap with location attributes.
    """
    must_haves = set()
    all_texts = (
        df_candidates['primary_category'].astype(str).str.lower() + " " +
        df_candidates['name'].astype(str).str.lower()
    )

    for sq in sub_queries:
        sq_lower = sq.lower()
        for word in sq_lower.split():
            if len(word) < 3:  # skip short words
                continue
            if all_texts.str.contains(word).any():
                must_haves.add(word)

    return list(must_haves)
