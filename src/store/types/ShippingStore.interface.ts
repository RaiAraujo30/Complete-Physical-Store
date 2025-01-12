import { StoreType } from "../enum/StoreType.enum";

export interface ShippingStore {
  name: string;
  city: string;
  postalCode: string;
  type: StoreType;
  distance: string;
  value: {
    prazo: string;
    price: string;
    description: string;
  }[];
}