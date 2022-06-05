FROM node:14
WORKDIR /iot-backend
COPY . .
RUN npm install
EXPOSE 3000
CMD [ "npm", "run", "start" ]
