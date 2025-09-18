// Reset sync status script - clears all sync progress to start fresh
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('Please set MONGODB_URI in your .env file or environment variables.');
  process.exit(1);
}

async function resetSyncStatus() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    console.log('\n=== Resetting Sync Status ===');
    
    // 1. Clear all sync status records
    console.log('Clearing all sync status records...');
    const syncStatusResult = await db.collection('syncstatuses').deleteMany({});
    console.log(`Removed ${syncStatusResult.deletedCount} sync status records`);
    
    // 2. Reset email account sync status
    console.log('Resetting email account sync status...');
    const emailAccountsResult = await db.collection('emailaccounts').updateMany(
      {},
      {
        $unset: {
          lastSyncDate: "",
          lastUid: "",
          isSyncing: "",
          syncStatus: "",
          lastError: ""
        }
      }
    );
    console.log(`Updated ${emailAccountsResult.modifiedCount} email accounts`);
    
    // 3. Optional: Clear all emails to start completely fresh
    console.log('\nDo you want to clear ALL emails to start completely fresh?');
    console.log('This will remove all existing emails and start sync from scratch.');
    console.log('Current email count:', await db.collection('emails').countDocuments());
    
    // For now, let's just clear the sync status without removing emails
    // Uncomment the next section if you want to remove all emails
    
    /*
    console.log('Clearing all emails...');
    const emailsResult = await db.collection('emails').deleteMany({});
    console.log(`Removed ${emailsResult.deletedCount} emails`);
    */
    
    console.log('\n✅ Sync status reset complete!');
    console.log('You can now start a fresh sync from the beginning.');
    
  } catch (error) {
    console.error('Error during sync reset:', error);
  } finally {
    await client.close();
  }
}

// Run the reset
resetSyncStatus().catch(console.error);
