import { ConfigModule, ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const ormConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService, ModuleRef],

  useFactory: (cfg: ConfigService, moduleRef: ModuleRef) => {
    return {
      type: 'sqlite',
    //   host: cfg.get('API_DB_HOST'),
    //   username: cfg.get('API_DB_USERNAME'),
    //   password: cfg.get('API_DB_PASSWORD'),
      database: cfg.get('DATABASE'),
    //   port: 3306,

      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: true,
      container: moduleRef,

      charset: 'utf8mb4',
      extra: {
        charset: 'utf8mb4_unicode_ci',
      },
    };
  },
};