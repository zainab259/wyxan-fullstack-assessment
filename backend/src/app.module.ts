import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { SitesModule } from './sites/sites.module';
import { VisitsModule } from './visits/visits.module';
import { SearchModule } from './search/search.module';
import { HealthModule } from './health/health.module';

function validateConfig(config: Record<string, unknown>): Record<string, unknown> {
  const uri = config.MONGODB_URI;
  if (typeof uri !== 'string' || !/^mongodb(\+srv)?:\/\//.test(uri) || uri.includes('<DB_PASSWORD>')) {
    throw new Error('MONGODB_URI is required. Set it privately in backend/.env.');
  }
  try {
    const parsed = new URL(uri);
    if (!parsed.username || !parsed.password || parsed.hostname !== 'cluster0.r1p9wxc.mongodb.net' || parsed.pathname.replace(/^\//, '') !== 'wyxan_browser') throw new Error();
  } catch {
    throw new Error('MONGODB_URI must contain the configured Atlas host, database, username, and password.');
  }
  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env', validate: validateConfig }),
    MongooseModule.forRootAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({ uri: config.getOrThrow<string>('MONGODB_URI'), serverSelectionTimeoutMS: 8000, autoIndex: true }) }),
    UsersModule, SitesModule, VisitsModule, SearchModule, HealthModule,
  ],
})
export class AppModule {}
