import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OptimisticLockVersionMismatchError, Repository } from 'typeorm';
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



//   async decreaseStockOptimistic(
//   inventoryId: string,
//   quantityToDecrease: number,
// ): Promise<Inventory> {
//   const maxRetries = 3;

//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     const inventory = await this.inventoriesRepository.findOne({
//       where: { id: inventoryId },
//     });

//     if (!inventory) {
//       throw new NotFoundException(`Inventory with ID ${inventoryId} not found`);
//     }

//     if (inventory.quantity < quantityToDecrease) {
//       throw new BadRequestException('Not enough stock available');
//     }

//     const currentVersion = inventory.version;

//     inventory.quantity -= quantityToDecrease;

//     try {
//       await this.inventoriesRepository.manager.transaction(async (manager) => {
//         await manager.findOneOrFail(Inventory, {
//           where: { id: inventoryId },
//           lock: {
//             mode: 'optimistic',
//             version: currentVersion,
//           },
//         });

//         await manager.save(Inventory, inventory);
//       });

//       return inventory;
//     } catch (error) {
//       if (error instanceof OptimisticLockVersionMismatchError) {
//         if (attempt === maxRetries) {
//           throw new ConflictException(
//             'Inventory was updated by another request. Please try again.',
//           );
//         }

//         continue;
//       }

//       throw error;
//     }
//   }

//   throw new ConflictException('Could not update inventory safely');
// }



/**
 * optimistic lock-based stock decrease
 * @param inventoryId 
 * @param quantityToDecrease 
 * @returns 
 */
async decreaseStockOptimistic(
  inventoryId: string,
  quantityToDecrease: number,
): Promise<Inventory> {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const inventory = await this.inventoriesRepository.findOne({
      where: { id: inventoryId },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${inventoryId} not found`);
    }

    if (inventory.quantity < quantityToDecrease) {
      throw new BadRequestException('Not enough stock available');
    }

    const updateResult = await this.inventoriesRepository
      .createQueryBuilder()
      .update(Inventory)
      .set({
        quantity: () => `"quantity" - ${quantityToDecrease}`,
        version: () => `"version" + 1`,
      })
      .where('id = :id', { id: inventoryId })
      .andWhere('version = :version', { version: inventory.version })
      .andWhere('quantity >= :quantityToDecrease', { quantityToDecrease })
      .execute();

    if (updateResult.affected && updateResult.affected > 0) {
      const updatedInventory = await this.inventoriesRepository.findOne({
        where: { id: inventoryId },
      });

      if (!updatedInventory) {
        throw new NotFoundException(`Inventory with ID ${inventoryId} not found`);
      }

      return updatedInventory;
    }

    if (attempt === maxRetries) {
      throw new ConflictException(
        'Inventory was updated by another request. Please try again.',
      );
    }
  }

  throw new ConflictException('Could not update inventory safely');
}
}
