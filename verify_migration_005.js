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

async function verify() {
  console.log('========================================');
  console.log('VERIFYING MIGRATION 005');
  console.log('========================================\n');

  // Test 1: Try to insert a subscription
  console.log('Test 1: Inserting test subscription...');
  const testStudentId = '00000000-0000-0000-0000-000000000001';
  const testMonth = '2099-12'; // Future month unlikely to exist
  
  const { data: insert1, error: error1 } = await supabase
    .from('subscriptions')
    .insert({
      student_id: testStudentId,
      month: testMonth,
      amount: 100,
      payment_method: 'cash'
    })
    .select();

  if (error1) {
    console.log('❌ First insert failed:', error1.message);
    console.log('   (This is OK if student_id foreign key constraint fails)');
  } else {
    console.log('✅ First insert succeeded');
    
    // Test 2: Try to insert duplicate
    console.log('\nTest 2: Attempting duplicate insert...');
    const { data: insert2, error: error2 } = await supabase
      .from('subscriptions')
      .insert({
        student_id: testStudentId,
        month: testMonth,
        amount: 200,
        payment_method: 'vodafone_cash'
      })
      .select();

    if (error2) {
      if (error2.code === '23505') {
        console.log('✅ Duplicate correctly rejected!');
        console.log('   Error:', error2.message);
        console.log('   Code:', error2.code);
        console.log('\n✅ UNIQUE CONSTRAINT IS WORKING!');
      } else {
        console.log('❌ Unexpected error:', error2.message);
      }
    } else {
      console.log('❌ Duplicate insert succeeded - CONSTRAINT NOT WORKING!');
    }

    // Clean up test data
    console.log('\nCleaning up test data...');
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('student_id', testStudentId)
      .eq('month', testMonth);
    
    if (deleteError) {
      console.log('⚠️  Could not clean up:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }
  }

  console.log('\n========================================');
  console.log('VERIFICATION COMPLETE');
  console.log('========================================');
}

verify().catch(console.error);
