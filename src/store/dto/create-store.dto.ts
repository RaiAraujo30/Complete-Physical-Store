import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { StoreType } from '../enum/StoreType.enum';

export class CreateStoreDto {
  @ApiProperty({ description: 'Name of the store', example: 'Supermercado XYZ' })
  @IsString()
  @IsNotEmpty()
  storeName: string;

  @ApiProperty({ description: 'Indicates if store has take-out option', example: true })
  @IsBoolean()
  takeOutInStore: boolean;

  @ApiProperty({ description: 'Estimated shipping time in days', example: 5 })
  @IsNumber()
  shippingTimeInDays: number;


  @ApiProperty({ description: 'Main address of the store', example: 'Rua das Flores, 123' })
  @IsString()
  address1: string;

  @ApiProperty({ description: 'District of the store', example: 'Centro' })
  @IsString()
  district: string;

  @ApiProperty({ description: 'State abbreviation', example: 'SP' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'City where the store is located', example: 'São Paulo' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Type of the store', enum: StoreType, example: StoreType.PDV })
  @IsEnum(StoreType)
  type: StoreType;

  @ApiProperty({ description: 'Country of the store', example: 'Brazil' })
  @IsString()
  country: string;

  @ApiProperty({ description: 'Postal code of the store', example: '01001-000' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Telephone number of the store', example: '+55 11 98765-4321' })
  @IsString()
  telephoneNumber: string;

  @ApiProperty({ description: 'Email address of the store', example: 'contato@supermercadoxyz.com' })
  @IsString()
  emailAddress: string;
}
