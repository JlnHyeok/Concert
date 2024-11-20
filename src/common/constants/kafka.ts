import { KafkaOptions, Transport } from '@nestjs/microservices';

export const SET_KAFKA_OPTION: (url: string, port: string) => KafkaOptions = (
  url: string,
  port: string,
) => {
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'my-kafka-client',
        brokers: [`${url}:${port}`],
        retry: {
          retries: 2,
        },
      },
      consumer: {
        allowAutoTopicCreation: true,
        groupId: 'my-kafka-consumer',
        retry: {
          retries: 2,
        },
      },
    },
  };
};
