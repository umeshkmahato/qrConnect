import { Module } from '@nestjs/common';
import { OrgVehiclesController, VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({ controllers: [VehiclesController, OrgVehiclesController], providers: [VehiclesService] })
export class VehiclesModule {}
