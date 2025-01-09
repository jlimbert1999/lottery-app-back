import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PrizeDocument = HydratedDocument<Prize>;

@Schema()
export class Prize {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  image: string;
}
export const PrizeSchema = SchemaFactory.createForClass(Prize);
