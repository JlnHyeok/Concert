FROM node:20.16-alpine

ENV TZ=Asia/Seoul

WORKDIR /was

COPY ./package.json /was

RUN npm install

COPY ./dist /was/dist

COPY ./.env.prod /was/.env.prod

CMD ["node","--max-old-space-size=4096", "dist/main" ]