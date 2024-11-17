import { KafkaOptions, Transport } from '@nestjs/microservices';

export const KAFKA_OPTION: KafkaOptions = {
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'my-kafka-client',
      brokers: ['localhost:10000'],
    },
    consumer: {
      groupId: 'my-kafka-consumer',
    },
  },
};
