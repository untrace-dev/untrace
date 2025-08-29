import { config } from 'dotenv';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { cleanupTestData } from '../test-utils/cleanup';
import { getTestDatabase } from '../test-utils/database';

// Load environment variables
config({ path: '../../.env.local' });

// Global test state
export let testDb: Awaited<ReturnType<typeof getTestDatabase>>;

// Setup before all tests
beforeAll(async () => {
  console.log('🚀 Starting integration test setup...');

  // Initialize test database
  testDb = await getTestDatabase();
  console.log('✅ Test database initialized');

  // Set global test environment variables
  process.env.DATABASE_URL = testDb.connectionString;
  process.env.POSTGRES_URL = testDb.connectionString;
  process.env.SUPABASE_URL = testDb.supabaseUrl;
  process.env.SUPABASE_ANON_KEY = testDb.supabaseAnonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = testDb.supabaseServiceRoleKey;

  console.log('✅ Integration test setup complete');
});

// Cleanup after all tests
afterAll(async () => {
  console.log('🧹 Starting integration test cleanup...');

  // Cleanup database
  if (testDb) {
    await testDb.cleanup();
    console.log('✅ Test database cleaned up');
  }

  console.log('✅ Integration test cleanup complete');
});

// Clean test data before each test
beforeEach(async () => {
  if (testDb) {
    await cleanupTestData(testDb.db);
  }
});
