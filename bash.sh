#!/bin/bash
nerdctl run -d --name jenkins -p 8080:8080 -p 50000:50000 --restart unless-stopped -v jenkins_home:/var/jenkins_home -v /var/run/docker.sock:/var/run/docker.sock -e TZ=Asia/Yangon docker.io/jenkins/jenkins:latest
