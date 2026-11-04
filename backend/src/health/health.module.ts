import { Controller, Get, Module } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, STATES } from 'mongoose';
@Controller('health')
class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}
  @Get() get() { const connected = this.connection.readyState === STATES.connected; return { status: connected ? 'ok' : 'unavailable', database: connected ? 'connected' : 'disconnected' }; }
}
@Module({ controllers: [HealthController] })
export class HealthModule {}
