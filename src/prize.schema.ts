import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Participant, ParticipantDocument } from './participant.schema';

export type PrizeDocument = HydratedDocument<Prize>;

@Schema()
export class Prize {
  @Prop()
  number: number;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  image?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Participant.name, unique: true, sparse: true })
  participant: ParticipantDocument;
}
export const PrizeSchema = SchemaFactory.createForClass(Prize);
