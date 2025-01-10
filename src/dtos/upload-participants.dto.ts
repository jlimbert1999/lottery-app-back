import { IsArray, IsEnum, IsIn, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ParticipantDto {
  @IsString()
  @IsNotEmpty()
  CONTRIBUYENTE: string;

  @IsString()
  DOC_IDENTIDAD: string;

  @IsNotEmpty()
  CODIGO: string;

  @IsIn(['NATURAL', 'JURIDICO'])
  TIPO_CONTRIBUYENTE: 'NATURAL' | 'JURIDICO';
}

export enum uploadDataTypeEnum {
  INMUEBLES = 'INMUEBLES',
  ACTIVIDADES = 'ACTIVIDADES',
  VEHICULOS = 'VEHICULOS',
}

export class CreateParticipantsDto {
  @IsEnum(uploadDataTypeEnum)
  type: uploadDataTypeEnum;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participants: ParticipantDto[];
}

export class UploadParticipantsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantsDto)
  data: CreateParticipantsDto[];
}
