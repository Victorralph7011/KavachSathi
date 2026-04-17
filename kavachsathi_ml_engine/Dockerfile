# ML Engine Dockerfile
FROM python:3.12-slim

# Install build dependencies required for some ML packages
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application, including the models/ folder with .pkl files
COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
