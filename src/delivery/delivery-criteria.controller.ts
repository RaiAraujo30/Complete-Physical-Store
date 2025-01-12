import { Controller, Get, Post, Body, Delete } from "@nestjs/common";
import { DeliveryCriteriaService } from "./delivery-criteria.service";
import { DeliveryCriteria } from "./entities/DeliveryCriteria.entity";
import { CreateDeliveryCriteriaDto } from "./dto/create-deliveryCriteria.dto";
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from "@nestjs/swagger";

@Controller('deliveryCriteria')
export class DeliveryCriteriaController {
    constructor(private readonly deliveryCriteriaService: DeliveryCriteriaService) {}

    @Get()
    @ApiOperation({ summary: 'Retrieve a list of all delivery criteria' })
    @ApiResponse({ status: 200, description: 'List of delivery criteria retrieved successfully.' })
    async findAll(): Promise<DeliveryCriteria[]> {
        return this.deliveryCriteriaService.findAllSorted()
      }

    @Post()
    @ApiOperation({ summary: 'Create a new delivery criteria' })
    @ApiBody({ type: CreateDeliveryCriteriaDto, description: 'The delivery criteria data to create' })
    @ApiResponse({ status: 201, description: 'Delivery criteria created successfully.' })
    async create (@Body() createDeliveryCriteriaDto: CreateDeliveryCriteriaDto) {
        return this.deliveryCriteriaService.create(createDeliveryCriteriaDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a delivery criteria by its ID' })
    @ApiParam({ name: 'id', description: 'The ID of the delivery criteria to delete' })
    @ApiResponse({ status: 200, description: 'Delivery criteria deleted successfully.' })
    @ApiResponse({ status: 404, description: 'Delivery criteria not found.' })
    async remove (id: string) {
        return this.deliveryCriteriaService.remove(id);
    }
}