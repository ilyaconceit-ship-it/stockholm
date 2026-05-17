-- Add discord fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_avatar TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_discriminator TEXT;

-- Create function to handle Discord OAuth callback
CREATE OR REPLACE FUNCTION handle_discord_auth()
RETURNS TRIGGER AS $$
DECLARE
  discord_data JSONB;
  has_role BOOLEAN := FALSE;
  guild_id TEXT := '935695524831567972';
  required_role_id TEXT := '993885878491549848';
BEGIN
  -- Get Discord user data from auth metadata
  discord_data := NEW.raw_user_meta_data;

  -- Update or insert profile with Discord data
  INSERT INTO profiles (
    id,
    username,
    discord_id,
    discord_username,
    discord_avatar,
    discord_discriminator,
    status
  ) VALUES (
    NEW.id,
    COALESCE(discord_data->>'global_name', discord_data->>'username'),
    discord_data->>'provider_id',
    discord_data->>'username',
    discord_data->>'avatar',
    discord_data->>'discriminator',
    'pending'
  )
  ON CONFLICT (id) DO UPDATE SET
    username = COALESCE(discord_data->>'global_name', discord_data->>'username'),
    discord_id = discord_data->>'provider_id',
    discord_username = discord_data->>'username',
    discord_avatar = discord_data->>'avatar',
    discord_discriminator = discord_data->>'discriminator';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for Discord auth
DROP TRIGGER IF EXISTS on_discord_auth_created ON auth.users;
CREATE TRIGGER on_discord_auth_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data->>'provider' = 'discord')
  EXECUTE FUNCTION handle_discord_auth();
