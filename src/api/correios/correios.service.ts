import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../common/exceptions/AppError';

@Injectable()
export class CorreiosService {
  private readonly correiosUrl =
    'https://www.correios.com.br/@@precosEPrazosView';

  constructor(private readonly httpService: HttpService) {}

  async calculateFreight(data: FreightRequestPayload): Promise<FreightResponse[]> {

    // payload for the open API request
    const payload = {
      cepDestino: data.cepDestino,
      cepOrigem: data.cepOrigem,
      comprimento: data.comprimento,
      largura: data.largura,
      altura: data.altura,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.correiosUrl, payload, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      throw new AppError(
        'Failed to calculate freight via Correios API',
        502, // Bad Gateway, as it involves an external API
        'CORREIOS_API_ERROR',
        {
          correiosUrl: this.correiosUrl,
          payload,
          error: error.message,
        }
      );
    }
  }
}
