// Fields of a User that are safe to embed in API responses about *other* users.
// Never include a relation with `user: true`: that returns password_hash,
// two_factor_secret, email and every other column.
export const publicUserSelect = {
  id: true,
  username: true,
  display_name: true,
  avatar_url: true,
  is_verified: true,
} as const;
