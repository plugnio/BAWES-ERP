export interface JwtPayload {
  sub: string;          // Person ID
  email: string;        // Primary email
  permissions: string[]; // Array of permissions in format "ACTION:RESOURCE"
} 