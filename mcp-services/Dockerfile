FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3001

# Check for .env file or use environment variables
CMD ["node", "src/index.js"]
