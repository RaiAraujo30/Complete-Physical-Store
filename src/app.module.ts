import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StoreModule } from './store/store.module';
import { DeliveryCriteriaModule } from './delivery/delivery-criteria.module';
import { DatabaseModule } from './config/database.module';
import { LoggerService } from './config/Logger';

@Module({
  providers: [LoggerService],
  exports: [LoggerService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    StoreModule,
    DeliveryCriteriaModule
  ],

})
export class AppModule {}
