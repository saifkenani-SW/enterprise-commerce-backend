import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoriesRepository: Repository<Inventory>,
  ) {}

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const inventory = this.inventoriesRepository.create(createInventoryDto);
    return this.inventoriesRepository.save(inventory);
  }

  async findAll(): Promise<Inventory[]> {
    return this.inventoriesRepository.find();
  }

  async findOne(id: string): Promise<Inventory> {
    const inventory = await this.inventoriesRepository.findOneBy({ id });
    if (!inventory) {
      throw new NotFoundException(`Inventory with id ${id} not found`);
    }
    return inventory;
  }

  async update(
    id: string,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<Inventory> {
    const inventory = await this.findOne(id);
    Object.assign(inventory, updateInventoryDto);
    return this.inventoriesRepository.save(inventory);
  }

  async remove(id: string): Promise<void> {
    const inventory = await this.findOne(id);
    await this.inventoriesRepository.remove(inventory);
  }
}
