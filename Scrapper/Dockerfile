# Use official Python slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies first (for layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app source (exclude venv, __pycache__, etc.)
COPY scraper.py .
COPY web_gui.py .
COPY wsgi.py .
COPY scraper-ui.html .
COPY listings.json .

# Expose port
EXPOSE 8080

# Start with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "120", "wsgi:app"]
