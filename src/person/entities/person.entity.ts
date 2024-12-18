export class Person {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  nameEn?: string;
  nameAr?: string;
  passwordHash?: string;
  lastLoginAt?: Date;
  accountStatus: string;
  passwordResetToken?: string;
  passwordResetTokenExpiresAt?: Date;
  isDeleted: boolean;
}
