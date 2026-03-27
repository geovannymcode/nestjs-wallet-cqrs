import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';

@Injectable()
export class ProducerService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(ProducerService.name);

  private readonly kafka = new Kafka({
    clientId: 'wallet-service',
    brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
  });

  private readonly producer: Producer = this.kafka.producer();

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Kafka Producer connected');
  }

  async produce(record: ProducerRecord) {
    await this.producer.send(record);
    this.logger.log(
      `Event produced → topic=${record.topic} | messages=${record.messages.length}`,
    );
  }

  async onApplicationShutdown() {
    await this.producer.disconnect();
    this.logger.log('Kafka Producer disconnected');
  }
}
