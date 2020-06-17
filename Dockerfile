FROM node:14.4.0-alpine

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json ./
COPY yarn.lock ./
RUN yarn install
RUN yarn add react-scripts

COPY . ./

EXPOSE 3000

CMD ["yarn", "start"]