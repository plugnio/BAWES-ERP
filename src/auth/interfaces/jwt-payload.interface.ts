export interface JwtPayload {
  sub: string; // Person ID
  email: string; // Primary email
  permissionBits: string; // Combined permission bitfield as string (BigInt serialized)
}
