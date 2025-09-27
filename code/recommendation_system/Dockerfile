FROM python:3.10-slim

WORKDIR /app

# Hugging Face cache setup
ENV TRANSFORMERS_CACHE="/app/.cache"
ENV HF_HOME="/app/.cache"
ENV HF_HUB_ENABLE_HF_TRANSFER="0"

RUN mkdir -p /app/.cache && chmod -R 777 /app/.cache

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip -r requirements.txt

# Pre-download model during build
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

COPY . .

EXPOSE 7860
ENV PORT=7860
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port $PORT"]
