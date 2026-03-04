import { Module } from '@nestjs/common';
import { VotesModule } from './votes/votes.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormConfig } from './config/typeorm/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync(ormConfig),
    VotesModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
