import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { typeOrmConfigFactory } from './typeorm/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 환경변수 모듈을 글로벌로 설정
      envFilePath: ['.env'], // 환경변수 파일 경로
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: typeOrmConfigFactory,
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
