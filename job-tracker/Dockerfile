FROM apify/actor-node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD ["node", "src/actor/main.js"]
