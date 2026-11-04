import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Site, SiteSchema } from './schemas/site.schema';
import { SitesController } from './sites.controller';
import { SitesService } from './sites.service';
@Module({ imports: [MongooseModule.forFeature([{ name: Site.name, schema: SiteSchema }, { name: User.name, schema: UserSchema }])], controllers: [SitesController], providers: [SitesService], exports: [SitesService] })
export class SitesModule {}
