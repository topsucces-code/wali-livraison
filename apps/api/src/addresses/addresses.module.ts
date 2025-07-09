import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { GeocodingService } from './geocoding.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
  ],
  controllers: [AddressesController],
  providers: [AddressesService, GeocodingService],
  exports: [AddressesService, GeocodingService],
})
export class AddressesModule {}
