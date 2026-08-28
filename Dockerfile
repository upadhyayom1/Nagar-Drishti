FROM python:3.10-slim

# Install system dependencies required by OpenCV and EasyOCR
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set up a new user named "user" with user ID 1000
# Hugging Face runs containers as a non-root user
RUN useradd -m -u 1000 user
USER user

# Set home to the user's home directory
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Set the working directory to the user's home directory
WORKDIR $HOME/app

# Copy the current directory contents into the container at $HOME/app setting the owner to the user
COPY --chown=user . $HOME/app

# Install the required packages
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 7860 (The port Hugging Face Spaces expects)
EXPOSE 7860

# Run the unified API on port 7860
CMD ["uvicorn", "unified_api:app", "--host", "0.0.0.0", "--port", "7860"]
