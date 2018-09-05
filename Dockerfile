# specify the node base image with your desired version node:<version>
FROM node:8.9.1

WORKDIR /usr/src/app

EXPOSE 1113 1114 2108 9229

# From docker offical docs
# (https://docs.docker.com/engine/userguide/eng-image/dockerfile_best-practices/):
# 1. Put mutiple params to mutiples lines with backslash so that it's
#    version-contorl friendly
# 2. You should avoid RUN apt-get upgrade or dist-upgrade.
# 3. Always combine RUN apt-get update with apt-get install in the same 
#    RUN statement

RUN mkdir -p /root/.litemsg/data/1113

# By running these commands, it will start the webpack dev server, which starts
# the build (for both node & browser targets), and watch the source file changes.
# It will also start two nodes - one is full, the other is spv.
# 
# If above is not what you want, try to overwrite the `CMD` here either with 
# docker cli command or a docker compose file.
CMD npm install && npm start
