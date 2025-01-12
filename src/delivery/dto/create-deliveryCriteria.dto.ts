import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateDeliveryCriteriaDto {
    @ApiProperty({ description: 'Maximum distance for delivery', example: 10 })
    @IsNumber()
    @IsNotEmpty()
    maxDistance: number;

    @ApiProperty({ description: 'Delivery method', example: 'Motoboy' })
    @IsString()
    @IsNotEmpty()
    deliveryMethod: string;

    @ApiProperty({ description: 'Delivery time', example: '1 day' })
    @IsString()
    @IsNotEmpty()
    deliveryTime: string;

    @ApiProperty({ description: 'Price for delivery', example: 5 })
    @IsNumber()
    @IsNotEmpty()
    price: number;
}