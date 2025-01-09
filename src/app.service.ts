import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  codeTypeEnum,
  Participant,
  ParticipantDocument,
  ParticipantEntity,
  ParticipantEntityDocument,
  ParticipantIndividual,
  ParticipantIndividualDocument,
} from './participant.schema';
import { Model } from 'mongoose';
import { uploadDataTypeEnum, UploadParticipantsDto } from './upload-data.dto';
import { PaginationParamsDto } from './pagination.dto';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(ParticipantIndividual.name) private participantIndividualModel: Model<ParticipantIndividualDocument>,
    @InjectModel(ParticipantEntity.name) private participantEntityModel: Model<ParticipantEntityDocument>,
    @InjectModel(Participant.name) private participantModel: Model<ParticipantDocument>,
  ) {}

  async findParticipants({ limit, offset }: PaginationParamsDto) {
    const [participants, length] = await Promise.all([
      this.participantModel.find({}).skip(offset).limit(limit),
      this.participantModel.countDocuments(),
    ]);
    return { participants, length };
  }

  async uploadParticipants({ data }: UploadParticipantsDto) {
    for (const element of data) {
      const codeType = this._getCodeType(element.type);
      for (const el of element.participants) {
        switch (el.TIPO_CONTRIBUYENTE) {
          case 'JURIDICO':
            const nit = el.DOC_IDENTIDAD.split(' ')[1];
            const participantEntity = new this.participantEntityModel({
              name: el.CONTRIBUYENTE,
              code: el.CODIGO,
              codeType,
              nit,
            });
            await participantEntity.save();
            break;
          default:
            const [, dni, extension] = el.DOC_IDENTIDAD.split(' ');
            const [middlename = '', lastname = '', ...name] = el.CONTRIBUYENTE.split(' ');
            const participantIndividual = new this.participantIndividualModel({
              firstname: name.join(' ').trim(),
              code: el.CODIGO,
              codeType,
              middlename,
              lastname,
              extension,
              dni,
            });
            await participantIndividual.save();
            break;
        }
      }
    }
  }

  private _getCodeType(type: uploadDataTypeEnum): string {
    switch (type) {
      case uploadDataTypeEnum.ACTIVIDADES:
        return codeTypeEnum.LICENCIA;
      case uploadDataTypeEnum.INMUEBLES:
        return codeTypeEnum.IMBUEBLE;
      default:
        return codeTypeEnum.VEHICULO;
    }
  }
}
