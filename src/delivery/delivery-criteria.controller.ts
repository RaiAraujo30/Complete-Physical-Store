import { Controller, Get, Post, Body, Delete } from "@nestjs/common";
import { DeliveryCriteriaService } from "./delivery-criteria.service";
import { DeliveryCriteria } from "./entities/DeliveryCriteria.entity";
import { CreateDeliveryCriteriaDto } from "./dto/create-deliveryCriteria.dto";

@Controller('deliveryCriteria')
export class DeliveryCriteriaController {
    constructor(private readonly deliveryCriteriaService: DeliveryCriteriaService) {}

    @Get()
    async findAll(): Promise<DeliveryCriteria[]> {
        return this.deliveryCriteriaService.findAllSorted()
      }

    @Post()
    async create (@Body() createDeliveryCriteriaDto: CreateDeliveryCriteriaDto) {
        return this.deliveryCriteriaService.create(createDeliveryCriteriaDto);
    }

    @Delete(':id')
    async remove (id: string) {
        return this.deliveryCriteriaService.remove(id);
    }
}