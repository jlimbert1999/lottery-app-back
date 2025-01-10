import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  Participant,
  ParticipantEntity,
  ParticipantEntitySchema,
  ParticipantIndividual,
  ParticipantIndividualSchema,
  ParticipantSchema,
} from './participant.schema';
import { Prize, PrizeSchema } from './prize.schema';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/lottery-app'),
    MongooseModule.forFeature([
      { name: Prize.name, schema: PrizeSchema },
      {
        name: Participant.name,
        schema: ParticipantSchema,
        discriminators: [
          {
            name: ParticipantIndividual.name,
            schema: ParticipantIndividualSchema,
          },
          {
            name: ParticipantEntity.name,
            schema: ParticipantEntitySchema,
          },
        ],
      },
    ]),
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
