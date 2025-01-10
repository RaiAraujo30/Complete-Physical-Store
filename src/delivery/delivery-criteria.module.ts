import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryCriteria, DeliveryCriteriaSchema } from './entities/DeliveryCriteria.entity';
import { DeliveryCriteriaService } from './delivery-criteria.service';
import { DeliveryCriteriaController } from './delivery-criteria.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: DeliveryCriteria.name, schema: DeliveryCriteriaSchema }])],
  controllers: [DeliveryCriteriaController],
  providers: [DeliveryCriteriaService],
  exports: [DeliveryCriteriaService],
})
export class DeliveryCriteriaModule {}
