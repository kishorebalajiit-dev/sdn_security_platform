FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    mininet \
    openvswitch-switch \
    iproute2 \
    iputils-ping \
    curl \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install requests

WORKDIR /app
COPY . /app

CMD ["sh", "-c", "service openvswitch-switch start && python3 topology.py"]
