import { Store } from "src/store/entities/store.entity";
import { StorePin } from "src/store/types/StorePin.interface";

export function createPin(store: Store): StorePin {
  return {
    position: {
      lat: parseFloat(store.latitude),
      lng: parseFloat(store.longitude),
    },
    title: store.storeName,
  };
}
