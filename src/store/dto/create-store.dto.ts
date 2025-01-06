import { IsNotEmpty, IsString, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { StoreType } from '../enum/StoreType.enum';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  storeName: string;

  @IsBoolean()
  takeOutInStore: boolean;

  @IsNumber()
  shippingTimeInDays: number;

  @IsString()
  latitude: string;

  @IsString()
  longitude: string;

  @IsString()
  address1: string;

  @IsString()
  district: string;

  @IsString()
  state: string;

  @IsString()
  city: string;

  @IsEnum(StoreType)
  type: StoreType;

  @IsString()
  country: string;

  @IsString()
  postalCode: string;

  @IsString()
  telephoneNumber: string;

  @IsString()
  emailAddress: string;
}
