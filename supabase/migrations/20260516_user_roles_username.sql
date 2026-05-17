-- Add username field to user_roles table
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS username TEXT;

-- Update existing records with usernames from profiles
UPDATE user_roles ur
SET username = p.username
FROM profiles p
WHERE ur.user_id = p.id;

-- Create function to auto-update username when role is added
CREATE OR REPLACE FUNCTION update_user_role_username()
RETURNS TRIGGER AS $$
BEGIN
  NEW.username := (SELECT username FROM profiles WHERE id = NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-fill username
DROP TRIGGER IF EXISTS set_user_role_username ON user_roles;
CREATE TRIGGER set_user_role_username
  BEFORE INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_role_username();
