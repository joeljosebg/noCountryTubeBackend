import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../../applications/dtos/crear-user.dto';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../domain/port/user-repository.port';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { UpdateUserDto } from '../../applications/dtos/update-user.dto';

@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(data: CreateUserDto): Promise<User> {
    const user = await this.userRepository.save({
      ...data,
      role: 'user',
      isActive: true,
    });
    return user as User;
  }

  async getUsers(): Promise<User[]> {
    const users = this.userRepository.find({
      select: {
        id: true,
        email: true,
        userName: true,
        firstName: true,
        lastName: true,
        birthday: true,
        phone: true,
        isActive: true,
        photo: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users;
  }
  async getUserWithVideos(): Promise<User[]> {
    const topUsers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.videos', 'video')
      .leftJoin('video.interactions', 'interaction')
      .leftJoin('video.views', 'view')
      .select('user.id', 'userId')
      .addSelect('user.userName', 'userName')
      .addSelect(
        'SUM(CASE WHEN interaction.like = TRUE THEN 1 ELSE 0 END)',
        'totallikes',
      )
      .addSelect('COUNT(view.id)', 'totalviews')
      .groupBy('user.id')
      .orderBy('totallikes', 'DESC')
      .addOrderBy('totalviews', 'DESC')
      .limit(10)
      .getRawMany();

    return topUsers.map((user) => ({
      ...user,
      totalLikes: Number(user.totallikes) || 0,
      totalViews: Number(user.totalviews) || 0,
      totallikes: undefined,
      totalviews: undefined,
    }));
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    console.log({ updateUserDto });
    await this.userRepository.update(id, {
      ...updateUserDto,
    });
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async getUser(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }
  async getUserProfileAndVideos(userName: string): Promise<User> {
    return this.userRepository.findOne({
      where: { userName },
      relations: ['videos'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByUsername(userName: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { userName },
    });
  }
  async updatePassword(id: string, password: string): Promise<User> {
    await this.userRepository.update(id, {
      password,
    });
    return this.userRepository.findOne({ where: { id } }) as Promise<User>;
  }
}
