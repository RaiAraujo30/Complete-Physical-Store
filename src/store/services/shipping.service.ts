import { Injectable } from '@nestjs/common';
import { Store } from '../entities/store.entity';
import { ShippingStore } from '../types/ShippingStore.interface';
import { CorreiosService } from '../../api/correios/correios.service';
import { DeliveryCriteriaService } from '../../delivery/delivery-criteria.service';
import { AppError } from '../../common/exceptions/AppError';
import { FreightValue } from '../types/FreightValue.interface';
import { cleanCep } from '../utils/validation.utils';

@Injectable()
export class ShippingService {
  constructor(
    private readonly deliveryCriteriaService: DeliveryCriteriaService,
    private readonly correiosService: CorreiosService,
    
  ) {}
  async createPdvStoreWithFixedShipping(
    store: Store,
    distance: number,
  ): Promise<ShippingStore> {
    const criteria = await this.deliveryCriteriaService.findAllSorted();

    const matchedCriterion = criteria.find((c) => distance <= c.maxDistance);

    if (!matchedCriterion) {
      throw new AppError(
        'No delivery criteria found for the given distance',
        404,
        'DELIVERY_CRITERIA_NOT_FOUND',
        { distance },
      );
    }

    return {
      name: store.storeName,
      city: store.city,
      postalCode: store.postalCode,
      type: store.type,
      distance: `${distance} km`,
      value: [
        {
          prazo: matchedCriterion.deliveryTime,
          price: `R$ ${matchedCriterion.price.toFixed(2)}`,
          description: matchedCriterion.deliveryMethod,
        },
      ],
    };
  }

  async createStoreWithDynamicShipping(
    store: Store,
    cep: string,
    distance: number,
  ): Promise<ShippingStore> {
    try {
      const freightValues = await this.correiosService.calculateFreight({
        cepDestino: cleanCep(cep),
        cepOrigem: cleanCep(store.postalCode),
        comprimento: '30',
        largura: '15',
        altura: '10',
      });

      return {
        name: store.storeName,
        city: store.city,
        postalCode: store.postalCode,
        type: store.type,
        distance: `${distance} km`,
        value: freightValues.map((freight: FreightValue) => ({
          price: freight.precoAgencia,
          prazo: `${parseInt(store.shippingTimeInDays.toString(), 10) + parseInt(freight.prazo, 10)} dias úteis`,
          description: freight.urlTitulo,
        })),
      };
    } catch (error) {
      throw new AppError(
        `Failed to calculate freight for store ${store.storeName}`,
        500,
        'FREIGHT_CALCULATION_ERROR',
        {
          storeName: store.storeName,
          cepDestino: cleanCep(cep),
          cepOrigem: cleanCep(store.postalCode),
          cause: error.message,
        },
      );
    }
  }
}
