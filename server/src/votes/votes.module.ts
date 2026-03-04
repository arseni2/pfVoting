import { Module } from '@nestjs/common';
import { VotesService } from './services/votes.service';
import { VotesController } from './controllers/votes.controller';

@Module({
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
