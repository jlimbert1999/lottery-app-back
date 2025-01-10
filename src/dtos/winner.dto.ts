import { IsMongoId } from 'class-validator';

export class SetWinnerDto {
  @IsMongoId()
  prizeId: string;
}
