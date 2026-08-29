FROM python:3.10-slim

# Install system dependencies required by OpenCV and EasyOCR
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 user
USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

COPY --chown=user . $HOME/app

RUN pip install --no-cache-dir -r requirements.txt

# Start the server using Render's dynamically injected PORT variable
CMD uvicorn unified_api:app --host 0.0.0.0 --port $PORT