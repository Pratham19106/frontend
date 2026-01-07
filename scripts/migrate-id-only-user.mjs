import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const uniqueId = process.argv[2];

if (!uniqueId) {
  console.error('Usage: node scripts/migrate-id-only-user.mjs <UNIQUE_ID>');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL (or VITE_SUPABASE_URL).');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const email = `${uniqueId.toLowerCase()}@nyaysutra.court`;
const base = `nyaysutra:${uniqueId}:id-login:v1`;
const hex = crypto.createHash('sha256').update(base).digest('hex');
const password = `ns_${hex.slice(0, 24)}`;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

async function findAuthUserByEmail(targetEmail) {
  const perPage = 1000;
  for (let page = 1; page < 100; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = data.users.find((u) => (u.email || '').toLowerCase() === targetEmail.toLowerCase());
    if (found) return found;

    if (data.users.length < perPage) return null;
  }
  return null;
}

async function main() {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id,email,unique_id,full_name')
    .or(`unique_id.eq.${uniqueId},email.eq.${email}`)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  let userId = profile?.user_id ?? null;

  if (!userId) {
    const authUser = await findAuthUserByEmail(email);
    if (!authUser) {
      console.error('Could not find user to migrate.');
      console.error('Tried profiles.unique_id / profiles.email lookup and auth user lookup by generated email:', email);
      process.exit(1);
    }
    userId = authUser.id;
  }

  const collision = await findAuthUserByEmail(email);
  if (collision && collision.id !== userId) {
    console.error('Cannot migrate: another auth user already has the generated email:', email);
    console.error('Existing user id:', collision.id);
    console.error('Target user id:', userId);
    process.exit(1);
  }

  const { data: updatedUser, error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
    email,
    password,
    email_confirm: true,
  });

  if (updateAuthError) {
    throw updateAuthError;
  }

  const { error: updateProfileError } = await supabase
    .from('profiles')
    .update({ unique_id: uniqueId, email })
    .eq('user_id', userId);

  if (updateProfileError) {
    throw updateProfileError;
  }

  console.log('Migration complete.');
  console.log('User id:', updatedUser.user.id);
  console.log('You can now sign in using Full Name + Unique ID (ID-only flow).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
