FROM node:20.16-alpine

ENV TZ=Asia/Seoul

WORKDIR /was

COPY ./package.json /was

RUN npm install

COPY ./dist /was/dist

CMD ["node", "dist/main" ]