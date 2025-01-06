import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateStoreDto } from './create-store.dto';
import { StoreType } from '../enum/StoreType.enum';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
  @ApiPropertyOptional({ description: 'Name of the store', example: 'Supermercado XYZ' })
  storeName?: string;

  @ApiPropertyOptional({ description: 'Indicates if store has take-out option', example: true })
  takeOutInStore?: boolean;

  @ApiPropertyOptional({ description: 'Estimated shipping time in days', example: 5 })
  shippingTimeInDays?: number;

  @ApiPropertyOptional({ description: 'Latitude of the store', example: '-23.550520' })
  latitude?: string;

  @ApiPropertyOptional({ description: 'Longitude of the store', example: '-46.633308' })
  longitude?: string;

  @ApiPropertyOptional({ description: 'Main address of the store', example: 'Rua das Flores, 123' })
  address1?: string;

  @ApiPropertyOptional({ description: 'District of the store', example: 'Centro' })
  district?: string;

  @ApiPropertyOptional({ description: 'State abbreviation', example: 'SP' })
  state?: string;

  @ApiPropertyOptional({ description: 'City where the store is located', example: 'São Paulo' })
  city?: string;

  @ApiPropertyOptional({ description: 'Type of the store', enum: ['PDV', 'ECOMMERCE', 'WAREHOUSE'], example: 'PDV' })
  type?: StoreType;

  @ApiPropertyOptional({ description: 'Country of the store', example: 'Brazil' })
  country?: string;

  @ApiPropertyOptional({ description: 'Postal code of the store', example: '01001-000' })
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Telephone number of the store', example: '+55 11 98765-4321' })
  telephoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email address of the store', example: 'contato@supermercadoxyz.com' })
  emailAddress?: string;
}
