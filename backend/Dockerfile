FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev wget && \
    wget https://github.com/ethereum/solidity/releases/download/v0.8.20/solc-static-linux -O /usr/local/bin/solc && \
    chmod +x /usr/local/bin/solc && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY backend ./backend
WORKDIR /app/backend

EXPOSE 5000
CMD ["python", "wsgi.py"]

