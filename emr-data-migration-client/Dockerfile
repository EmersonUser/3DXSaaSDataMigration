FROM node:21.0.0
# Update package lists, install required packages, and clean up
RUN apt-get update -y && \
    apt-get install -y libnghttp2-14 libde265-0 \
    && apt-get clean

#RUN useradd -ms /bin/bash configitUser
#USER configitUser
#WORKDIR /app

# Create app directory
WORKDIR /usr/src/app
COPY package.json /usr/src/app/package.json
#RUN rm -r ./node_modules && package-lock.json
# RUN npm install --legacy-peer-deps && npm build && rm -r ./node_modules
#RUN yarnpkg install && yarnpkg cache clean
RUN npm install

COPY . /usr/src/app
# RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
