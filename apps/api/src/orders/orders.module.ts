import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PricingService } from './pricing.service';
import { DistanceService } from './distance.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, PricingService, DistanceService],
  exports: [OrdersService, PricingService, DistanceService],
})
export class OrdersModule {}
