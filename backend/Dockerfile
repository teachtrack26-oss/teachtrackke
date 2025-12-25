FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt requirements_production.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements_production.txt

# Copy application code
COPY . .

# Create a non-root user for Celery privilege dropping (keep default user as root)
RUN groupadd -g 1000 appuser && \
    useradd -m -u 1000 -g 1000 appuser

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
