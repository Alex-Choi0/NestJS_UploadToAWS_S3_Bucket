// /src/aws/aws.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
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

  @Post('aws/upload/client/file')
  @ApiOperation({ summary: '파일을 서버쪽으로 upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      dest: './uploads', // 서버에 uploads폴더를 자동 생성(이안에 다운 받은 파일이 저장)
    }),
  )
  async downloadFile(
    // 다운로드 받은 파일 속성
    @UploadedFile('file') file,
    // A3 Bucket에 업로드시 사용할 파일 이름
    @Query('uploadFileName') uploadFileName: string,
  ) {
    // file["savename"]에 업로드시 지정할 파일 이름을 저장한다.
    file['savename'] = uploadFileName;
    // file["buffer"]에 업로드할 파일의 버퍼를 저장한다.
    file['buffer'] = this.awsService.convertBinary(file.filename);
    console.log('file data : ', file);

    // 해당 file을 AWS Bucket에 업로드 하고 결과를 data변수에 저장한다.
    const data = await this.awsService.uploadFile(file);

    // 버퍼로 다운받은 파일을 삭제합니다.
    console.log(this.awsService.remove(file['filename']));

    // data변수를 클라이언트 쪽에 전달한다.
    return data;
  }

  // 파일을 S3버킷에서 다운로드 받습니다
  @Get('getFile/')
  @ApiOperation({ summary: '파일을 S3 Bucket에서 서버쪽으로 download' })
  async download(
    // S3버킷에서 다운로드 할 파일 이름 입니다.
    @Query('downloadName') downloadName: string,
    // 서버에 저장할 파일 이름 입니다.
    @Query('saveName') saveName: string,
  ) {
    // 다운로드를 진행하고 결과값을 클라이언트에 보내줍니다.
    return await this.awsService.downLoad(downloadName, saveName);
  }
}
