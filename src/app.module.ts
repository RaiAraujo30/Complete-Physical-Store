import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreModule } from './store/store.module';
import { DeliveryCriteriaModule } from './delivery/delivery-criteria.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_CONNECT),
    StoreModule,
    DeliveryCriteriaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
