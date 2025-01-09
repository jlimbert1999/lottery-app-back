import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { UploadParticipantsDto } from './upload-data.dto';
import { PaginationParamsDto } from './pagination.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('participants')
  uploadParticipants(@Body() body: UploadParticipantsDto) {
    return this.appService.uploadParticipants(body);
  }

  @Get('participants')
  getParticipants(@Query() queryParams: PaginationParamsDto) {
    return this.appService.findParticipants(queryParams);
  }
}
