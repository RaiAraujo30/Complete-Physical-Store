import { Injectable } from '@nestjs/common';
import { Store } from '../entities/store.entity';
import { StorePin } from '../types/StorePin.interface';

@Injectable()
export class PinService {
  constructor() {}
  createPin(store: Store): StorePin {
    return {
      position: {
        lat: parseFloat(store.latitude),
        lng: parseFloat(store.longitude),
      },
      title: store.storeName,
    };
  }
}
