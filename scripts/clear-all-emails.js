// Clear all emails script - removes all emails to start completely fresh
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('Please set MONGODB_URI in your .env file or environment variables.');
  process.exit(1);
}

async function clearAllEmails() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    console.log('\n=== Clearing All Emails ===');
    
    // Get current email count
    const emailCount = await db.collection('emails').countDocuments();
    console.log(`Current email count: ${emailCount}`);
    
    if (emailCount === 0) {
      console.log('No emails to clear. Database is already empty.');
      return;
    }
    
    // Clear all emails
    console.log('Clearing all emails...');
    const emailsResult = await db.collection('emails').deleteMany({});
    console.log(`Removed ${emailsResult.deletedCount} emails`);
    
    // Clear all sync status records
    console.log('Clearing all sync status records...');
    const syncStatusResult = await db.collection('syncstatuses').deleteMany({});
    console.log(`Removed ${syncStatusResult.deletedCount} sync status records`);
    
    // Reset email account sync status
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
    
    console.log('\n✅ All emails and sync status cleared!');
    console.log('You can now start a completely fresh sync from the beginning.');
    
  } catch (error) {
    console.error('Error during email clearing:', error);
  } finally {
    await client.close();
  }
}

// Run the clear
clearAllEmails().catch(console.error);
