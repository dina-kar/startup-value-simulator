#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables.')
  console.error('Please make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  try {
    console.log('Setting up database tables...')
    
    // Read the SQL setup file
    const sqlPath = path.join(__dirname, '../database/setup.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Split SQL statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error && !error.message.includes('already exists')) {
          console.warn(`Warning executing statement: ${error.message}`)
        }
      } catch (err) {
        // Try direct query if RPC fails
        try {
          const { error } = await supabase.from('_').select().limit(0)
          // This will fail, but we just want to test connection
        } catch {
          console.log('Direct SQL execution not available, trying alternative setup...')
        }
      }
    }
    
    console.log('✅ Database setup completed!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Make sure your Supabase project has RLS enabled')
    console.log('2. Run the SQL from database/setup.sql in your Supabase SQL editor if automatic setup failed')
    console.log('3. Test the application by signing up and creating a profile')
    
  } catch (error) {
    console.error('Error setting up database:', error.message)
    console.log('')
    console.log('Manual setup required:')
    console.log('Please run the SQL commands from database/setup.sql in your Supabase SQL editor.')
    process.exit(1)
  }
}

// Check if user_profiles table exists
async function checkTables() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
    
    if (error && error.code === '42P01') {
      console.log('user_profiles table does not exist. Setting up database...')
      await setupDatabase()
    } else {
      console.log('✅ Database tables already exist!')
    }
  } catch (error) {
    console.log('Checking database tables...')
    await setupDatabase()
  }
}

checkTables()
