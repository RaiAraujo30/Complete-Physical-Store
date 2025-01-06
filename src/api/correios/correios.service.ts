import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CorreiosService {
  private readonly correiosUrl =
    'https://www.correios.com.br/@@precosEPrazosView';

  constructor(private readonly httpService: HttpService) {}

  async calculateFreight(data: any): Promise<any> {

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
      console.error('Erro ao calcular frete via Correios:', error.message);
      throw new Error('Erro ao calcular o frete via Correios.');
    }
  }
}
