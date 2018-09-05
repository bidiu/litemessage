# specify the node base image with your desired version node:<version>
FROM node:8.9.1

WORKDIR /usr/src/app

EXPOSE 1113 1114

# From docker offical docs
# (https://docs.docker.com/engine/userguide/eng-image/dockerfile_best-practices/):
# 1. Put mutiple params to mutiples lines with backslash so that it's
#    version-contorl friendly
# 2. You should avoid RUN apt-get upgrade or dist-upgrade.
# 3. Always combine RUN apt-get update with apt-get install in the same 
#    RUN statement

RUN mkdir -p /root/.litemsg/data/1113

RUN npm config set unsafe-perm=true

# install the specific version of litemessage globally
RUN npm install -g litemessage@0.6.0

CMD ["litenode", "-D"]
