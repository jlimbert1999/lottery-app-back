import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum codeTypeEnum {
  IMBUEBLE = 'NUMERO DE INMUEBLE',
  VEHICULO = 'NUMERO DE PLACA',
  LICENCIA = 'NUMERO DE LICENCIA',
}

export type ParticipantIndividualDocument = HydratedDocument<ParticipantIndividual>;
@Schema()
export class ParticipantIndividual {
  code: string;
  codeType: codeTypeEnum;
  group: string;

  @Prop()
  firstname: string;

  @Prop()
  middlename: string;

  @Prop()
  lastname: string;

  @Prop()
  dni: string;

  @Prop()
  extension: string;
}

export const ParticipantIndividualSchema = SchemaFactory.createForClass(ParticipantIndividual);

export type ParticipantEntityDocument = HydratedDocument<ParticipantEntity>;

@Schema()
export class ParticipantEntity {
  code: string;
  codeType: codeTypeEnum;
  group: string;

  @Prop()
  name: string;

  @Prop()
  nit: string;
}

export type ParticipantDocument = HydratedDocument<Participant>;
@Schema({ discriminatorKey: 'group' })
export class Participant {
  @Prop({ required: true })
  code: string;

  @Prop({ enum: codeTypeEnum, required: true })
  codeType: codeTypeEnum;

  @Prop({ enum: [ParticipantIndividual.name, ParticipantEntity.name] })
  group: string;

  @Prop({ default: true })
  isEnabled: boolean;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);

export const ParticipantEntitySchema = SchemaFactory.createForClass(ParticipantEntity);
