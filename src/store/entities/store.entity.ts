import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { StoreType } from '../enum/StoreType.enum';

@Schema()
export class Store extends Document {
  @Prop({ required: true })
  storeName: string;

  @Prop({ required: true })
  takeOutInStore: boolean;

  @Prop({ required: true })
  shippingTimeInDays: number;

  @Prop({ required: true })
  latitude: string;

  @Prop({ required: true })
  longitude: string;

  @Prop({ required: true })
  address1: string;

  @Prop({ required: false })
  address2: string;

  @Prop({ required: false })
  address3: string;

  @Prop({ required: true })
  district: string;

  @Prop({ required: true, maxlength: 255 })
  state: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true, enum: StoreType })
  type: StoreType; // PDV | LOJA

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ required: true })
  telephoneNumber: string;

  @Prop({ required: true })
  emailAddress: string;
}

export const StoreSchema = SchemaFactory.createForClass(Store);


