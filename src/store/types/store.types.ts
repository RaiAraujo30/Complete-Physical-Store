import { StoreType } from "../enum/StoreType.enum";

export interface StorePin {
    position: {
      lat: number;
      lng: number;
    };
    title: string;
  }
  
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

  export interface FreightValue {
    precoAgencia: string; 
    prazo: string;
    urlTitulo: string; 
  }