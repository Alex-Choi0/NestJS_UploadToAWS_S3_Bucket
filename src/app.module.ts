import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AwsModule } from './aws/aws.module';

@Module({
  imports: [ConfigModule.forRoot(), AwsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
