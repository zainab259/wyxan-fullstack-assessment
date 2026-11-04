import { Controller, Get, Module } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserSchema } from './schemas/user.schema';

@Controller('users')
class UsersController {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}
  @Get() async list(): Promise<Array<{ id: string; name: string }>> {
    const users = await this.users.find().sort({ name: 1 }).lean();
    return users.map((u) => ({ id: String(u._id), name: u.name }));
  }
}
@Module({ imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])], controllers: [UsersController] })
export class UsersModule {}
