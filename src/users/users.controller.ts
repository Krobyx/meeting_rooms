import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: any) {
    return this.users.me(req.user.userId);
  }
}
