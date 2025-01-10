import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class DeliveryCriteria extends Document {
  @Prop({ required: true })
  maxDistance: number; 

  @Prop({ required: true })
  deliveryMethod: string; 
  @Prop({ required: true })
  deliveryTime: string; 

  @Prop({ required: true })
  price: number; 
}

export const DeliveryCriteriaSchema = SchemaFactory.createForClass(DeliveryCriteria);
