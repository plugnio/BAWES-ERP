import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PersonService } from './person.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { Person } from './entities/person.entity';

@ApiTags('persons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('persons')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  @RequirePermission('persons.create')
  @ApiOperation({ summary: 'Create a new person' })
  @ApiResponse({ status: 201, type: Person })
  create(@Body() createPersonDto: CreatePersonDto) {
    return this.personService.create(createPersonDto);
  }

  @Get()
  @RequirePermission('persons.read')
  @ApiOperation({ summary: 'Get all persons' })
  @ApiResponse({ status: 200, type: [Person] })
  findAll() {
    return this.personService.findAll();
  }

  @Get(':id')
  @RequirePermission('persons.read')
  @ApiOperation({ summary: 'Get a person by id' })
  @ApiResponse({ status: 200, type: Person })
  @ApiResponse({ status: 404, description: 'Person not found' })
  findOne(@Param('id') id: string) {
    return this.personService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('persons.update')
  @ApiOperation({ summary: 'Update a person' })
  @ApiResponse({ status: 200, type: Person })
  @ApiResponse({ status: 404, description: 'Person not found' })
  update(@Param('id') id: string, @Body() updatePersonDto: UpdatePersonDto) {
    return this.personService.update(id, updatePersonDto);
  }

  @Delete(':id')
  @RequirePermission('persons.delete')
  @ApiOperation({ summary: 'Soft delete a person' })
  @ApiResponse({ status: 200, type: Person })
  @ApiResponse({ status: 404, description: 'Person not found' })
  remove(@Param('id') id: string) {
    return this.personService.remove(id);
  }
}
