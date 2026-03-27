import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import {
  Consumer,
  ConsumerRunConfig,
  ConsumerSubscribeTopics,
  Kafka,
} from 'kafkajs';

@Injectable()
export class ConsumerService implements OnApplicationShutdown {
  private readonly logger = new Logger(ConsumerService.name);

  private readonly kafka = new Kafka({
    clientId: 'wallet-projection',
    brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
  });

  private readonly consumers: Consumer[] = [];

  async consume(topics: ConsumerSubscribeTopics, config: ConsumerRunConfig) {
    const consumer = this.kafka.consumer({ groupId: 'wallet-projection-group' });

    await consumer.connect();
    this.logger.log('Kafka Consumer connected');

    await consumer.subscribe(topics);
    this.logger.log(`Subscribed to topics: ${topics.topics}`);

    await consumer.run(config);

    this.consumers.push(consumer);
  }

  async onApplicationShutdown() {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
    this.logger.log('All Kafka Consumers disconnected');
  }
}
