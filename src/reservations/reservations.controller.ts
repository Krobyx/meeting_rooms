import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('reservations')
export class ReservationsController {
  constructor(private reservations: ReservationsService) {}

  // CREATE: vsak prijavljen user
  @Post()
  create(@Req() req: any, @Body() dto: CreateReservationDto) {
    return this.reservations.create(req.user.userId, dto);
  }

  @Get()
  findAll() {
    return this.reservations.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservations.findOne(Number(id));
  }

  // UPDATE: user samo svoje, admin vse
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservations.update(
      Number(id),
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  // DELETE: user samo svoje, admin vse
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.reservations.remove(Number(id), req.user.userId, req.user.role);
  }

  // DELETE SERIES: user samo svoje, admin vse
  @Delete('series/:recurringId')
  removeSeries(@Req() req: any, @Param('recurringId') recurringId: string) {
    return this.reservations.removeSeries(
      recurringId,
      req.user.userId,
      req.user.role,
    );
  }
}
