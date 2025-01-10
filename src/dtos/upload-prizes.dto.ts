import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class PrizeDto {
  @IsInt()
  @Type(() => Number)
  NRO: number;

  @IsString()
  @IsNotEmpty()
  PREMIO: string;

  @IsString()
  @IsNotEmpty()
  DESCRIPCION: string;
}

export class UploadPrizesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrizeDto)
  data: PrizeDto[];
}
