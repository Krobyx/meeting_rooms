import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('rooms')
export class RoomsController {
  constructor(private rooms: RoomsService) {}

  // ✅ vsi prijavljeni lahko vidijo sobe (da USER lahko rezervira)
  @Get()
  findAll() {
    return this.rooms.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rooms.findOne(Number(id));
  }

  // ✅ samo ADMIN lahko ustvarja/ureja/briše sobe
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateRoomDto) {
    return this.rooms.create(dto);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.rooms.update(Number(id), dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rooms.remove(Number(id));
  }
}
