model = None

def get_model():
    global model
    if model is None:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer("all-MiniLM-L6-v2")
    return model

def get_similarity(text1, text2):
    model = get_model()
    emb1 = model.encode(text1)
    emb2 = model.encode(text2)

    from sklearn.metrics.pairwise import cosine_similarity
    return cosine_similarity([emb1], [emb2])[0][0]