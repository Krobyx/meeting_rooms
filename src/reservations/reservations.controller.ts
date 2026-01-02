import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Patch } from '@nestjs/common';
import { UpdateReservationDto } from './dto/update-reservation.dto';


@UseGuards(AuthGuard('jwt'))
@Controller('reservations')
export class ReservationsController {
  constructor(private reservations: ReservationsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateReservationDto) {
    return this.reservations.create(req.user.userId, dto);
  }

  @Get()
  findAll() {
    return this.reservations.findAll();
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.reservations.remove(Number(id), req.user.userId);
  }

  @Delete('series/:recurringId')
  removeSeries(@Req() req: any, @Param('recurringId') recurringId: string) {
    return this.reservations.removeSeries(recurringId, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservations.findOne(Number(id));
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservations.update(Number(id), req.user.userId, dto);
  }
}
