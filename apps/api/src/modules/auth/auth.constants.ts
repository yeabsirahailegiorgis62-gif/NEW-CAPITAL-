// JWT: Signing secret for access tokens. Prefer JWT_SECRET from environment variables.
export const JWT_SECRET =
  process.env.JWT_SECRET || 'capital_fleet_super_secure_jwt_secret_change_in_production_2026';
