import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { envs } from 'src/config';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FilesService {
  private readonly folders: Record<string, string[]> = {
    images: ['jpg', 'png', 'jpeg'],
    documents: ['pdf'],
  };
  constructor() {}

  async saveFile(file: Express.Multer.File): Promise<{ filename: string; title: string }> {
    const fileExtension = file.mimetype.split('/')[1];
    const savedFileName = `${uuid()}.${fileExtension}`;
    const path = join(__dirname, '..', '..', 'static', savedFileName);
    try {
      await writeFile(path, file.buffer);
      return { filename: savedFileName, title: file.originalname };
    } catch (error) {
      throw new InternalServerErrorException('Error saving file');
    }
  }

  getStaticFile(filename: string) {
    const path = join(__dirname, '..', '..', 'static', filename);
    if (!existsSync(path)) {
      throw new BadRequestException(`No file found with ${filename}`);
    }
    return path;
  }

  public buildFileUrl(filename: string): string {
    return `${envs.host}/files/${filename}`;
  }
}
