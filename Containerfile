FROM docker.io/jenkins/jenkins:latest

USER root

# Update package lists and install common tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        wget \
        git \
        vim \
        nano \
        unzip \
        zip \
        jq \
        ca-certificates \
        gnupg \
        lsb-release \
        sudo \
        procps \
        iputils-ping \
        net-tools \
        python3 \
        python3-pip \
        && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Return to Jenkins user
USER jenkins

EXPOSE 8080 50000
