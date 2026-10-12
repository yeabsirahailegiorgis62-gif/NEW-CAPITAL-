import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'employee@capitalre.com',
    description: 'Corporate email or assigned employee ID (e.g. EMP-101)',
  })
  @IsNotEmpty({ message: 'Email or Employee ID is required' })
  @IsString()
  identifier: string;

  @ApiProperty({
    example: 'CapitalFleet2026!',
    description: 'Account password',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password: string;
}
