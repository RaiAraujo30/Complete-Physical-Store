import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StoreModule } from './store/store.module';
import { DeliveryCriteriaModule } from './delivery/delivery-criteria.module';
import { DatabaseModule } from './config/database.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/Logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot(winstonConfig),
    DatabaseModule,
    StoreModule,
    DeliveryCriteriaModule
  ],

})
export class AppModule {}
