FROM node:alpine
WORKDIR /usr/src/backend
COPY package*.json .
RUN npm ci
COPY . .
CMD ["nodemon", "app"]
