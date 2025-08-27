#!/usr/bin/env node

/**
 * Database setup script for Startup Value Simulator
 * 
 * This script checks if the required database tables exist and creates them if they don't.
 * Run this after setting up your Supabase project and environment variables.
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkDatabaseSetup() {
  console.log('🔍 Checking database setup...')
  
  try {
    // Test connection
    const { error: testError } = await supabase
      .from('scenarios')
      .select('id')
      .limit(1)

    if (testError) {
      if (testError.message.includes('relation "scenarios" does not exist')) {
        console.log('⚠️  Database tables not found. Please run the setup SQL in your Supabase dashboard.')
        console.log('\n📋 Steps to set up the database:')
        console.log('1. Go to your Supabase dashboard')
        console.log('2. Navigate to the SQL Editor')
        console.log('3. Copy and paste the SQL from database/setup.sql')
        console.log('4. Run the SQL to create tables and policies')
        console.log('5. Run this script again to verify setup')
        return false
      } else {
        console.error('❌ Database connection error:', testError.message)
        return false
      }
    }

    // Check if shared_scenarios table exists
    const { error: sharedError } = await supabase
      .from('shared_scenarios')
      .select('id')
      .limit(1)

    if (sharedError) {
      if (sharedError.message.includes('relation "shared_scenarios" does not exist')) {
        console.log('⚠️  shared_scenarios table not found. Please update your database schema.')
        return false
      } else {
        console.error('❌ shared_scenarios table error:', sharedError.message)
        return false
      }
    }

    console.log('✅ Database setup is complete!')
    console.log('✅ scenarios table: OK')
    console.log('✅ shared_scenarios table: OK')
    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Startup Value Simulator - Database Setup Check\n')
  
  const isSetup = await checkDatabaseSetup()
  
  if (isSetup) {
    console.log('\n🎉 Your database is ready to use!')
    console.log('You can now start the application with: npm run dev')
  } else {
    console.log('\n📖 For detailed setup instructions, see: SUPABASE_SETUP.md')
    process.exit(1)
  }
}

main().catch(console.error)
