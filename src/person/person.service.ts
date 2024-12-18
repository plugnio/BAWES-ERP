import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Injectable()
export class PersonService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPersonDto: CreatePersonDto) {
    return this.prisma.person.create({
      data: createPersonDto,
    });
  }

  async findAll() {
    return this.prisma.person.findMany({
      where: {
        isDeleted: false,
      },
    });
  }

  async findOne(id: string) {
    const person = await this.prisma.person.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        emails: true,
        phones: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }

    return person;
  }

  async update(id: string, updatePersonDto: UpdatePersonDto) {
    await this.findOne(id);

    return this.prisma.person.update({
      where: { id },
      data: updatePersonDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.person.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });
  }
}
