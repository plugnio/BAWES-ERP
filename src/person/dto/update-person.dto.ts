import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePersonDto } from './create-person.dto';

export class UpdatePersonDto extends PartialType(
  OmitType(CreatePersonDto, ['passwordHash'] as const),
) {}
