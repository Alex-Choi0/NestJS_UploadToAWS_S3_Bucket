// /src/aws/aws.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// 현재 실행되고 있는 root경로를 확인하고 pa에 저장
const pa = path.dirname(__dirname).replace('/dist', '');

@Injectable()
export class AwsService {
  // S3버킷을 .env파일에서 입력한다.
  private AWS_S3_BUCKET: String = process.env.S3_BUCKET;
  // s3를 사용하기 위해서 IAM계정의 ACCESS, SECRET_ACCESS KEY를 입력한다.
  private s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  });

  convertBinary(fileName: string) {
    return fs.readFileSync(pa + '/uploads/' + fileName);
  }

  // AWS 버킷에 여러 파일 upload
  async uploadMultiFiles(files) {
    // fileName은 실제 S3 버킷에 저장될시 파일 이름을 말합니다
    return await AwsService.uploadToS3MultiFiles(files);
  }

  // AWS 버킷에 파일 upload
  async uploadFile(file) {
    // savename은 실제 S3 버킷에 저장될시 파일 이름을 말합니다
    const { savename } = file;
    console.log('savename : ', savename);
    return await this.s3_upload(
      file.buffer, // 파일 버퍼(binary file)
      this.AWS_S3_BUCKET, // 저장할 S3버킷 이름
      savename, // S3버킷에 저장할 파일 이름
      file.mimetype, // 파일타입 : 위 코드에서는 'application/octet-stream'을 사용합니다.
    );
  }

  // 실제 AWS에 파일을 업로드 하는 method
  async s3_upload(file, bucket, name, mimetype) {
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
      ACL: 'public-read',
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: process.env.s3_REGION,
      },
    };

    console.log(params);

    try {
      let s3Response = await this.s3.upload(params).promise();

      console.log(s3Response);
      return s3Response;
    } catch (err) {
      console.log(err);
      throw new HttpException(err.message, err.status ? err.status : 500);
    }
  }

  // /src/aws/aws.service.ts
  // S3버킷에서 다운로드 받은 파일을 저장합니다.
  downLoad(Key: string, saveName: string) {
    // getObject에 인자로 넣을 params을 작성합니다.
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key, // 다운로드 받을 파일 이름
    };

    // s3를 이용하여 해당 params의 값을 확인후 callback함수의 data에 넣습니다
    this.s3.getObject(params, async function (error, data) {
      if (error != null) {
        // 에러시 에러 출력(서버 멈춤)
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      } else {
        console.log('data : ', data);
        //다운로드 한 파일을 downloads폴더에 저장한다.
        fs.createWriteStream(pa + '/downloads/' + saveName).write(data.Body);
      }
    });

    return true;
  }

  remove(fileName: string) {
    fs.rm(pa + '/uploads/' + fileName, { recursive: true }, (err) => {
      if (err) throw err;
      console.log(`file deleted.....`);
      console.log(`name : ${fileName}`);
    });

    return {
      result: true,
      message: `"${fileName}"은 삭제되었습니다.`,
    };
  }

  private static async uploadToS3MultiFiles(files) {
    const s3 = new AWS.S3({
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    });
    let images = [];
    files.forEach((file) => {
      return new Promise(async (res, rej) => {
        try {
          const splitFile = file.originalname.split('.');
          const random = Date.now();
          const fileName = `${splitFile[0]}_${random}.${splitFile[1]}`;
          const params = {
            Bucket: process.env.S3_BUCKET,
            Key: fileName,
            Body: file.buffer,
          };

          const uploadResponse = await s3.upload(params).promise();
          images.push(uploadResponse);
          if (images.length === files.length) {
            res(images);
          }
        } catch (err) {
          console.log('files uploads Error : ', err);
          rej(err);
        }
      });
    });
  }
}
