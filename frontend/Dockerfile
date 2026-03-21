FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["sh", "-c", "npm start -- --host 0.0.0.0 --port ${FRONTEND_PORT:-8080}"]
