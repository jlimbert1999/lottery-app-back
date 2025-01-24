import { BadRequestException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model } from 'mongoose';
import {
  Prize,
  PrizeDocument,
  codeTypeEnum,
  Participant,
  ParticipantDocument,
  ParticipantEntity,
  ParticipantEntityDocument,
  ParticipantIndividual,
  ParticipantIndividualDocument,
} from './schemas';
import { FilesService } from './files/files.service';
import { PaginationParamsDto, uploadDataTypeEnum, UploadParticipantsDto, UploadPrizesDto } from './dtos';

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
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const prize = await this._checkValidPrize(prizeId, session);
      const [winner] = await this.participantModel
        .aggregate([{ $match: { isEnabled: true } }, { $sample: { size: 1 } }])
        .session(session);
      if (!winner) throw new BadRequestException('No hay participantes habilitados');
      const participant = await this.participantModel.findByIdAndUpdate(winner._id, { isEnabled: false }, { session });
      const result = await this.prizeModel
        .findByIdAndUpdate(prize._id, { participant }, { session, new: true })
        .populate('participant');

      await session.commitTransaction();
      return this._plainPrize(result);
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException();
    } finally {
      await session.endSession();
    }
  }

  async getPrizes() {
    const data = await this.prizeModel.find({}).populate('participant');
    return data.map((item) => this._plainPrize(item));
  }

  async getParticipants({ limit, offset }: PaginationParamsDto) {
    const [participants, length] = await Promise.all([
      this.participantModel.find({}).skip(offset).limit(limit),
      this.participantModel.countDocuments(),
    ]);
    return { participants, length };
  }

  async getWinnersPrizes() {
    return await this.prizeModel.find({ participant: { $ne: null } }).populate('participant');
  }

  async getAppDetails() {
    const [totalInmueble, totalVehiculo, totalLicencia, totalParticipants, totalPrizes] = await Promise.all([
      this.participantModel.countDocuments({ codeType: codeTypeEnum.IMBUEBLE }),
      this.participantModel.countDocuments({ codeType: codeTypeEnum.VEHICULO }),
      this.participantModel.countDocuments({ codeType: codeTypeEnum.LICENCIA }),
      this.participantModel.countDocuments(),
      this.prizeModel.countDocuments(),
    ]);
    return { totalParticipants, totalPrizes, totalInmueble, totalVehiculo, totalLicencia };
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

  private _plainPrize(prize: PrizeDocument) {
    const { image, ...props } = prize.toObject();
    return { ...props, image: this.fileService.buildFileUrl(image) };
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
