FROM node:20.16-alpine

ENV TZ=Asia/Seoul

WORKDIR /payment

COPY ./package.json /payment

RUN npm install

COPY . /payment

CMD ["node", "src/server.js" ]