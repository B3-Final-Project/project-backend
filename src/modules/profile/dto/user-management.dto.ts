export class UserManagementDto {
  userId: string;
  profileId: number;
  name: string;
  surname: string;
  reportCount: number;
  isBanned?: boolean;
  createdAt?: Date;
}

export class UserManagementResponseDto {
  profiles: UserManagementDto[];
  totalCount: number;
}
