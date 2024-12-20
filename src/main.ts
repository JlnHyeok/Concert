import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { winstonLogger, HttpExceptionFilter } from './common';
import { MicroserviceOptions } from '@nestjs/microservices';
import { SET_KAFKA_OPTION } from './common/constants/kafka';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: winstonLogger,
  });

  // Kafka 설정
  const configService = app.get(ConfigService);
  const kafkaUrl = configService.get<string>('KAFKA_URL', 'localhost');
  const kafkaPort = configService.get<string>('KAFKA_PORT', '9092');

  app.connectMicroservice<MicroserviceOptions>(
    SET_KAFKA_OPTION(kafkaUrl, kafkaPort),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const validationErrors = errors.map((err) => ({
          property: err.property,
          constraints: err.constraints,
          value: err.value,
        }));
        return new BadRequestException(validationErrors);
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Concert 예약 시스템')
    .setDescription('Concert 예약 시스템 API 문서')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
