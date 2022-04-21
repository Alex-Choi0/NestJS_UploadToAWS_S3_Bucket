// /src/aws/aws.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AwsService } from './aws.service';

@ApiTags('AWS S3 버킷으로 파일을 올리기')
@Controller('aws')
export class AwsController {
  constructor(private readonly awsService: AwsService) {}

  // uploads에 저장된 파일을 S3 Bucket에 올리기
  @Get('aws/upload/storage/file')
  @ApiOperation({
    summary: 'AWS S3버킷으로 저장된 파일을 전송합니다.',
  })
  async uploadStorage(
    @Query('fileName') fileName: string,
    @Query('saveName') saveName: string,
  ) {
    // 해당 파일을 전송 가능하도록 binary로 변환한다
    const binary = this.awsService.convertBinary(fileName);

    // 필요 내용을 file Object로 저장한다.
    const file = {
      buffer: binary,
      savename: saveName,
      mimetype: 'application/octet-stream',
    };

    // 업로드를 실행하고 해당 return값을 client쪽으로 전달한다.
    return await this.awsService.uploadFile(file);
  }
}
