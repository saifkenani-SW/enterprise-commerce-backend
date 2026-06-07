import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(
    @InjectQueue('notifications')
    private notificationQueue: Queue,
    private notificationService: NotificationService, // ✅ أضف هذا
  ) {}

  /**
   * إرسال إشعارات - يضيف المهمة للـ Queue ويرجع فوراً
   */
  @Post('send')
  async sendNotifications(@Body() body: { title: string; message: string }) {
    const job = await this.notificationQueue.add('send-batch', {
      title: body.title,
      message: body.message,
    });

    return {
      success: true,
      message: 'Notification job queued',
      jobId: job.id,
      status: 'processing',
    };
  }

  /**
   * إرسال إشعار لمشتري منتج معين
   */
  @Post('send/product')
  async notifyProductBuyers(
    @Body() body: { productId: string; title: string; message: string },
  ) {
    const job = await this.notificationQueue.add('send-product', {
      productId: body.productId,
      title: body.title,
      message: body.message,
    });

    return {
      success: true,
      message: 'Product notification job queued',
      jobId: job.id,
    };
  }

  /**
   * جلب سجل الإشعارات
   */
  @Get('logs')
  async getLogs(
    @Query('page') page?: number,
    @Query('status') status?: 'sent' | 'failed' | 'pending',
  ) {
    return this.notificationService.getLogs(page || 1, 50, status);
  }

  /**
   * إحصائيات الإشعارات
   */
  @Get('stats')
  async getStats() {
    return this.notificationService.getStats();
  }
}
