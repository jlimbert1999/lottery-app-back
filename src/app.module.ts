import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import {
  Prize,
  PrizeSchema,
  Participant,
  ParticipantEntity,
  ParticipantEntitySchema,
  ParticipantIndividual,
  ParticipantIndividualSchema,
  ParticipantSchema,
} from './schemas';
import { FilesModule } from './files/files.module';
import { envs } from './config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    MongooseModule.forRoot(envs.database_url),
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
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
