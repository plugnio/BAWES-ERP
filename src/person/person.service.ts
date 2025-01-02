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

    return person;
  }

  async update(id: string, updatePersonDto: UpdatePersonDto) {
    return this.prisma.$transaction(async (tx) => {
      const person = await tx.person.findUnique({
        where: { id },
      });

      if (!person || person.isDeleted) {
        return null;
      }

      return tx.person.update({
        where: { id },
        data: updatePersonDto,
      });
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const person = await tx.person.findUnique({
        where: { id },
      });

      if (!person || person.isDeleted) {
        return null;
      }

      return tx.person.update({
        where: { id },
        data: {
          isDeleted: true,
        },
      });
    });
  }
}
