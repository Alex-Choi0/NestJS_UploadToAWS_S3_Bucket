// /src/aws/aws.controller.ts
import {
  Controller,
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
}
