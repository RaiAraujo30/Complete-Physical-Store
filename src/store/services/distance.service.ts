import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Store } from '../entities/store.entity';
import { StoreService } from './store.service';
import { AppError } from '../../common/exceptions/AppError';
import { StoreType } from '../enum/StoreType.enum';
import { MapsService } from '../../api/maps/maps.service';

@Injectable()
export class DistanceService {
  constructor(private readonly mapsService: MapsService) {}
  async calculateDistancesFromCep(
    cep: string,
    stores: Store[],
  ): Promise<{ store: Store; distance: number }[]> {
    // calculate distances for all stores in parallel
    const distances = await Promise.all(
      stores.map(async (store) => {
        try {

          // use the MapsService to calculate the distance between the given cep and the store's location
          const response = await this.mapsService.calculateDistance(
            cep,
            `${store.latitude},${store.longitude}`,
          );

          // extract the distance in meters from the api response
          const distanceInMeters =
            response.rows[0]?.elements[0]?.distance?.value;

          // convert meters to kilometers and round to 1 
          const distance =
            distanceInMeters !== undefined
              ? parseFloat((distanceInMeters / 1000).toFixed(1))
              : null;

          if (distance !== null) {
            return { store, distance };
          }
        } catch (error) {
          throw new AppError(
            'Failed to calculate distance for store',
            500,
            'DISTANCE_CALCULATION_ERROR',
            {
              storeId: store.id,
              cep,
              cause: error.message,
            },
          );
        }
        return null;
      }),
    );

    // pdvs that are more than 50km away are ignored and ignore null results
    const validDistances = distances.filter((item) => {
      if (!item) return false;
      if (item.store.type === StoreType.PDV && item.distance > 50) return false;
      return true;
    });

    if (validDistances.length === 0) return null;

    return validDistances.sort((a, b) => a.distance - b.distance);
  }
}
