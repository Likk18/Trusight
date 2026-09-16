FROM python:3.11-slim

# System libraries required for audio decoding
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /service

# Install Python dependencies first (layer-cached unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY train_model.py .
COPY sample_audio/ ./sample_audio/

# Ensure uploads directory exists
RUN mkdir -p app/uploads app/models

# If no pretrained model was copied in, train the synthetic-prototype
# fallback so the service has something loadable at boot.
RUN if [ ! -f app/models/deception_model.pkl ]; then python train_model.py; fi

EXPOSE 8000

# Run the service
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
