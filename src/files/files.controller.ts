import { Controller, Get, Param, ParseFilePipeBuilder, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { FilesService } from './files.service';
import { CustomUploadFileTypeValidator } from './validators/upload-file-type.validator';

@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addValidator(new CustomUploadFileTypeValidator(['png', 'jpg', 'jpeg', 'pdf']))
        .addMaxSizeValidator({ maxSize: 2 * 1000000 })
        .build(),
    )
    file: Express.Multer.File,
  ) {
    return this.filesService.saveFile(file);
  }

  @Get(':filename')
  getImage(@Res() res: Response, @Param('filename') filename: string) {
    const path = this.filesService.getStaticFile(filename);
    res.sendFile(path);
  }
}
