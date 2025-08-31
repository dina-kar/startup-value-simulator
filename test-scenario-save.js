#!/usr/bin/env node
/**
 * Test script to verify scenario saving functionality
 * This script tests the database connection and scenario save/load operations
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test scenario data
const testScenario = {
  id: crypto.randomUUID(), // Use proper UUID
  name: 'Test Scenario - ' + new Date().toISOString(),
  founders: [],
  rounds: [],
  esop: {
    poolSize: 20,
    isPreMoney: false,
    currentSize: 20,
    allocated: 0,
    available: 20
  },
  exitValue: 100000000,
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date()
}

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('scenarios').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return false
    }
    
    console.log('✅ Database connection successful')
    console.log(`📊 Current scenarios count: ${data?.length || 0}`)
    return true
  } catch (error) {
    console.error('❌ Database connection error:', error.message)
    return false
  }
}

async function testScenarioSave() {
  console.log('💾 Testing scenario save without authentication...')
  
  try {
    const scenarioData = {
      id: testScenario.id,
      name: testScenario.name,
      user_id: null, // No user authentication for this test
      data: testScenario,
      is_public: true, // Make it public so RLS allows access
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('scenarios')
      .insert([scenarioData])
      .select()
      .single()

    if (error) {
      console.error('❌ Scenario save failed:', error.message)
      console.error('Error details:', error)
      return false
    }

    console.log('✅ Scenario saved successfully!')
    console.log('📄 Saved scenario ID:', data.id)
    return true
  } catch (error) {
    console.error('❌ Scenario save error:', error.message)
    return false
  }
}

async function testScenarioLoad() {
  console.log('📖 Testing scenario load...')
  
  try {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', testScenario.id)
      .single()

    if (error) {
      console.error('❌ Scenario load failed:', error.message)
      return false
    }

    if (!data) {
      console.error('❌ No scenario data found')
      return false
    }

    console.log('✅ Scenario loaded successfully!')
    console.log('📄 Loaded scenario name:', data.name)
    console.log('🗃️ Scenario data structure valid:', !!data.data)
    return true
  } catch (error) {
    console.error('❌ Scenario load error:', error.message)
    return false
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...')
  
  try {
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', testScenario.id)

    if (error) {
      console.warn('⚠️ Cleanup warning:', error.message)
    } else {
      console.log('✅ Test data cleaned up')
    }
  } catch (error) {
    console.warn('⚠️ Cleanup error:', error.message)
  }
}

async function runTests() {
  console.log('🚀 Starting Supabase scenario save tests...\n')

  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Scenario Save', fn: testScenarioSave },
    { name: 'Scenario Load', fn: testScenarioLoad }
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`)
    const result = await test.fn()
    if (result) {
      passed++
    } else {
      failed++
    }
  }

  // Cleanup
  await cleanupTestData()

  console.log('\n' + '='.repeat(50))
  console.log('📊 Test Results:')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Scenario saving should work correctly.')
  } else {
    console.log('\n⚠️ Some tests failed. Please check the database setup and configuration.')
  }

  process.exit(failed === 0 ? 0 : 1)
}

runTests().catch(error => {
  console.error('💥 Test runner error:', error)
  process.exit(1)
})
