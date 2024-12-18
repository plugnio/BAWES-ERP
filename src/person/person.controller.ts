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
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Person } from './entities/person.entity';

@ApiTags('persons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('persons')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  @RequirePermissions('persons.create')
  @ApiOperation({ summary: 'Create a new person' })
  @ApiResponse({ status: 201, type: Person })
  create(@Body() createPersonDto: CreatePersonDto) {
    return this.personService.create(createPersonDto);
  }

  @Get()
  @RequirePermissions('persons.read')
  @ApiOperation({ summary: 'Get all persons' })
  @ApiResponse({ status: 200, type: [Person] })
  findAll() {
    return this.personService.findAll();
  }

  @Get(':id')
  @RequirePermissions('persons.read')
  @ApiOperation({ summary: 'Get a person by id' })
  @ApiResponse({ status: 200, type: Person })
  @ApiResponse({ status: 404, description: 'Person not found' })
  findOne(@Param('id') id: string) {
    return this.personService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('persons.update')
  @ApiOperation({ summary: 'Update a person' })
  @ApiResponse({ status: 200, type: Person })
  @ApiResponse({ status: 404, description: 'Person not found' })
  update(@Param('id') id: string, @Body() updatePersonDto: UpdatePersonDto) {
    return this.personService.update(id, updatePersonDto);
  }

  @Delete(':id')
  @RequirePermissions('persons.delete')
  @ApiOperation({ summary: 'Soft delete a person' })
  @ApiResponse({ status: 200, type: Person })
  @ApiResponse({ status: 404, description: 'Person not found' })
  remove(@Param('id') id: string) {
    return this.personService.remove(id);
  }
}
