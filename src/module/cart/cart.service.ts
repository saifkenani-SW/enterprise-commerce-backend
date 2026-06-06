import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from '../order-item/entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemsRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createCartDto: CreateCartDto): Promise<Cart> {
    if (!createCartDto.items || createCartDto.items.length === 0) {
      throw new BadRequestException('Cart must contain at least one item');
    }

    let totalAmount = 0;
    const cartItemsData: CartItem[] = [];

    // Validate products and calculate total
    for (const itemDto of createCartDto.items) {
      const product = await this.productsRepository.findOneBy({
        id: itemDto.productId,
      });

      if (!product) {
        throw new NotFoundException(
          `Product with id ${itemDto.productId} not found`,
        );
      }

      const subtotal =
        Number(product.price) * itemDto.quantity;
      totalAmount += subtotal;

      const cartItem = this.cartItemsRepository.create({
        productId: itemDto.productId,
        quantity: itemDto.quantity,
        unitPrice: product.price,
        subtotal: subtotal,
      });

      cartItemsData.push(cartItem);
    }

    // Create cart
    const cart = this.cartRepository.create({
      userId: createCartDto.userId,
      totalAmount: totalAmount,
      items: cartItemsData,
    });

    // Save order and items
    const savedCart = await this.cartRepository.save(cart);

    // // Associate items with order
    // for (const item of orderItemsData) {
    //   item.orderId = savedOrder.id;
    // }
    // await this.orderItemsRepository.save(orderItemsData);

    // const result = await this.ordersRepository.findOneBy({ id: savedOrder.id });
    // if (!result) {
    //   throw new NotFoundException(`Order with id ${savedOrder.id} not found`);
    // }

    return savedCart;
  }

  async findAll(): Promise<Cart[]> {
    return this.cartRepository.find();
  }

  async findOne(id: string): Promise<Cart> {
    const cart = await this.cartRepository.findOneBy({ id });
    if (!cart) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return cart;
  }

  async update(id: string, updateCartDto: UpdateCartDto): Promise<Cart> {
    const cart = await this.findOne(id);
    Object.assign(cart, updateCartDto);
    return this.cartRepository.save(cart);
  }

  async remove(id: string): Promise<void> {
    const cart = await this.findOne(id);
    await this.cartRepository.remove(cart);
  }
}
