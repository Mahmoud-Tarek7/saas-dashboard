const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('========================================');
  console.log('APPLYING MIGRATION 005');
  console.log('========================================\n');

  // Read migration file
  const migrationSQL = fs.readFileSync('migrations/005_phase4_stabilization.sql', 'utf8');
  
  console.log('Migration content:');
  console.log(migrationSQL);
  console.log('\n========================================\n');

  // Execute migration using Supabase REST API
  // Note: We need to use the service role key or execute via Supabase dashboard
  console.log('⚠️  IMPORTANT:');
  console.log('This migration must be applied manually via Supabase Dashboard.');
  console.log('\nSteps:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the SQL from migrations/005_phase4_stabilization.sql');
  console.log('4. Execute the migration');
  console.log('\nAlternatively, if you have service_role_key:');
  console.log('Use supabase-js with service role key to execute raw SQL.');
  
  // Try to verify constraint after manual application
  console.log('\n========================================');
  console.log('To verify after manual application:');
  console.log('Run: node verify_migration_005.js');
  console.log('========================================');
}

applyMigration().catch(console.error);
