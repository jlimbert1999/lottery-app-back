import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { PaginationParamsDto } from './pagination.dto';
import { UploadPrizesDto, UploadParticipantsDto } from './dtos';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('winner/:prizeId')
  getWinner(@Param('prizeId') prizeId: string) {
    return this.appService.getWinner(prizeId);
  }

  @Get('prizes/active')
  getActivePrizes() {
    return this.appService.getActivePrizes();
  }

  @Get('participants')
  getParticipants(@Query() queryParams: PaginationParamsDto) {
    return this.appService.findParticipants(queryParams);
  }

  @Post('participants')
  uploadParticipants(@Body() body: UploadParticipantsDto) {
    return this.appService.uploadParticipants(body);
  }

  @Post('prizes')
  uploadPrizes(@Body() body: UploadPrizesDto) {
    return this.appService.uploadPrizes(body);
  }

  @Get('prizes')
  getPrizes() {
    return this.appService.findPrizes();
  }
}
