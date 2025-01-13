import { BadRequestException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  codeTypeEnum,
  Participant,
  ParticipantDocument,
  ParticipantEntity,
  ParticipantEntityDocument,
  ParticipantIndividual,
  ParticipantIndividualDocument,
} from './participant.schema';
import { ClientSession, Connection, Model } from 'mongoose';
import { uploadDataTypeEnum, UploadParticipantsDto } from './dtos/upload-participants.dto';
import { PaginationParamsDto } from './pagination.dto';
import { UploadPrizesDto } from './dtos';
import { Prize, PrizeDocument } from './prize.schema';
import { FilesService } from './files/files.service';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(ParticipantIndividual.name) private participantIndividualModel: Model<ParticipantIndividualDocument>,
    @InjectModel(ParticipantEntity.name) private participantEntityModel: Model<ParticipantEntityDocument>,
    @InjectModel(Participant.name) private participantModel: Model<ParticipantDocument>,
    @InjectModel(Prize.name) private prizeModel: Model<PrizeDocument>,
    @InjectConnection() private connection: Connection,
    private fileService: FilesService,
  ) {}

  async getWinner(prizeId: string) {
    console.log(prizeId);
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const prize = await this._checkValidPrize(prizeId, session);
      const [winner] = await this.participantModel
        .aggregate([{ $match: { isEnabled: true } }, { $sample: { size: 1 } }])
        .session(session);
      if (!winner) throw new BadRequestException('No hay participantes habilitados');
      const participant = await this.participantModel.findByIdAndUpdate(winner._id, { isEnabled: false }, { session });
      await this.prizeModel.findByIdAndUpdate(prize._id, { participant: participant._id });
      await session.commitTransaction();
      return winner;
    } catch (error) {
      console.log(error);
      await session.abortTransaction();
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException();
    } finally {
      await session.endSession();
    }
  }

  async getActivePrizes() {
    const data = await this.prizeModel.find({ participant: null });
    return this._plainPrizes(data);
  }

  async findParticipants({ limit, offset }: PaginationParamsDto) {
    const [participants, length] = await Promise.all([
      this.participantModel.find({}).skip(offset).limit(limit),
      this.participantModel.countDocuments(),
    ]);
    return { participants, length };
  }

  async findPrizes() {
    const data = await this.prizeModel.find({});
    return this._plainPrizes(data);
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
    return { message: 'Upload completed' };
  }

  async uploadPrizes({ data }: UploadPrizesDto) {
    for (const { NRO, DESCRIPCION, PREMIO } of data) {
      const model = new this.prizeModel({ number: NRO, name: PREMIO, description: DESCRIPCION.replace('\n', ', ') });
      await model.save();
    }
    return { message: 'Upload completed' };
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

  private _plainPrizes(prizes: PrizeDocument[]) {
    return prizes.map((item) => {
      const { image, ...props } = item.toObject();
      return { ...props, image: this.fileService.buildFileUrl(image) };
    });
  }

  private async _checkValidPrize(prizeId: string, session: ClientSession) {
    const prize = await this.prizeModel.findById(prizeId, null, { session });
    if (!prize) throw new BadRequestException(`Premio ${prizeId} no existe`);
    if (prize.participant) {
      throw new BadRequestException(`El premio ${prize} ya ha sido asignado`);
    }
    return prize;
  }
}
