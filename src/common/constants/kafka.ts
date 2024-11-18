import { KafkaOptions, Transport } from '@nestjs/microservices';

export const KAFKA_OPTION: KafkaOptions = {
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'my-kafka-client',
      brokers: ['localhost:10000'],
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
