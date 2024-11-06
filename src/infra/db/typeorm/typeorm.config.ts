// src/infra/typeorm.config.ts
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Concert } from '../../../domain/concert/model/entity/concert.entity';
import { PerformanceDate } from '../../../domain/concert/model/entity/performance-date.entity';
import { Seat } from '../../../domain/concert/model/entity/seat.entity';
import { Payment } from '../../../domain/reservation/model/entity/payment.entity';
import { Reservation } from '../../../domain/reservation/model/entity/reservation.entity';
import { User } from '../../../domain/user/model/entity/user.entity';
import { WaitingQueue } from '../../../domain/waiting-queue/model/entity/waiting-queue.entity';
import { DataSource } from 'typeorm';

// NestJs 내부 서비스에서 데이터베이스를 사용하기 위한 설정.
// 주로 서비스에서 레포지토리나 엔티티를 주입할 때 사용.
// 의존성 주입 컨테이너에서 관리
export const typeOrmConfigFactory = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', 'postgres'),
  database: configService.get<string>('DB_NAME', 'concert'),
  entities: [
    User,
    WaitingQueue,
    Seat,
    Payment,
    Reservation,
    Concert,
    PerformanceDate,
  ],
  synchronize: configService.get<boolean>('DB_SYNC', false), // 운영 환경에선 false로 설정
  logging: configService.get<boolean>('DB_LOGGING', true),
});

// 마이그레이션 및 스크립트에서 TypeORM을 직접 사용할 때 사용하는 설정
// Ex) 데이터베이스 연결을 직접 제어하거나, 명령어로 마이그레이션을 실행할 때 사용
// NestJs 내부 모듈과는 독립적으로 사용
export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'concert',
  entities: [
    User,
    WaitingQueue,
    Seat,
    Payment,
    Reservation,
    Concert,
    PerformanceDate,
  ],
  synchronize: process.env.DB_SYNC === 'false',
  logging: process.env.DB_LOGGING === 'true',
});
