# Presage Engine – Ubuntu 22.04 + Presage SmartSpectra SDK
# Based on https://github.com/seifotefa/deltahacks-12/tree/main/presage-engine

FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Basic tools and SDK dependencies
RUN apt-get update && apt-get install -y \
  curl wget gpg lsb-release software-properties-common \
  build-essential git pkg-config \
  libcurl4-openssl-dev libssl-dev libv4l-dev \
  libgl1-mesa-dev libgles2-mesa-dev libegl1-mesa-dev libunwind-dev \
  && rm -rf /var/lib/apt/lists/*

# CMake 3.27+ (required by SmartSpectra SDK)
RUN apt-get update && apt-get remove --purge --auto-remove cmake -y 2>/dev/null || true \
  && wget -qO - https://apt.kitware.com/keys/kitware-archive-latest.asc | gpg --dearmor - \
  | tee /etc/apt/trusted.gpg.d/kitware.gpg >/dev/null \
  && echo "deb https://apt.kitware.com/ubuntu/ $(lsb_release -cs) main" \
  | tee /etc/apt/sources.list.d/kitware.list >/dev/null \
  && apt-get update && apt-get install -y cmake \
  && rm -rf /var/lib/apt/lists/*

# Presage SmartSpectra SDK from official PPA
RUN curl -s "https://presage-security.github.io/PPA/KEY.gpg" | gpg --dearmor \
  | tee /etc/apt/trusted.gpg.d/presage-technologies.gpg >/dev/null \
  && curl -s --compressed -o /etc/apt/sources.list.d/presage-technologies.list \
  "https://presage-security.github.io/PPA/presage-technologies.list" \
  && apt-get update \
  && apt-get install -y libphysiologyedge-dev libsmartspectra-dev=2.0.4 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone presage-engine from deltahacks-12
RUN git clone --depth 1 https://github.com/seifotefa/deltahacks-12.git /tmp/dh \
  && cp -r /tmp/dh/presage-engine/. . \
  && rm -rf /tmp/dh

# Header-only deps (httplib, json)
RUN mkdir -p deps \
  && wget -q https://raw.githubusercontent.com/yhirose/cpp-httplib/master/httplib.h -O deps/httplib.h \
  && wget -q https://github.com/nlohmann/json/releases/download/v3.11.2/json.hpp -O deps/json.hpp

# Build
RUN mkdir -p build && cd build && cmake .. && make -j$(nproc)

# Presage Engine writes uploaded videos here (main.cpp uses /app/uploads)
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Presage Engine listens on 8080
EXPOSE 8080

CMD ["/bin/bash", "-c", "cd /app/build && exec ./presage_engine"]
