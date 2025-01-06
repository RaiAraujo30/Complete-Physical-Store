import { PartialType } from '@nestjs/mapped-types';
import { CreateStoreDto } from './create-store.dto';
import { StoreType } from '../enum/StoreType.enum';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
  storeName?: string;
  takeOutInStore?: boolean;
  shippingTimeInDays?: number;
  latitude?: string;
  longitude?: string;
  address1?: string;
  district?: string;
  state?: string;
  city?: string;
  type?: StoreType;
  country?: string;
  postalCode?: string;
  telephoneNumber?: string;
  emailAddress?: string;
}
