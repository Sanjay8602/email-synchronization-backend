// Force cleanup script - removes most data to get under quota
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('Please set MONGODB_URI in your .env file or environment variables.');
  process.exit(1);
}

async function forceCleanup() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get current database size
    const stats = await db.stats();
    console.log(`Current database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n=== Starting Force Cleanup ===');
    
    // 1. Remove ALL emails older than 1 month
    console.log('Removing emails older than 1 month...');
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const oldEmailsResult = await db.collection('emails').deleteMany({
      date: { $lt: oneMonthAgo }
    });
    console.log(`Removed ${oldEmailsResult.deletedCount} emails older than 1 month`);
    
    // 2. Remove ALL sync status records except the most recent 1 per account
    console.log('Removing old sync status records...');
    const syncStatusCollection = db.collection('syncstatuses');
    const accounts = await syncStatusCollection.distinct('accountId');
    
    let totalSyncRemoved = 0;
    for (const accountId of accounts) {
      const oldRecords = await syncStatusCollection
        .find({ accountId })
        .sort({ updatedAt: -1 })
        .skip(1)
        .toArray();
      
      if (oldRecords.length > 0) {
        const result = await syncStatusCollection.deleteMany({
          _id: { $in: oldRecords.map(r => r._id) }
        });
        totalSyncRemoved += result.deletedCount;
      }
    }
    console.log(`Removed ${totalSyncRemoved} old sync status records`);
    
    // 3. Remove duplicate emails
    console.log('Removing duplicate emails...');
    const duplicateEmails = await db.collection('emails').aggregate([
      {
        $group: {
          _id: { messageId: '$messageId', accountId: '$accountId' },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();
    
    let duplicatesRemoved = 0;
    for (const duplicate of duplicateEmails) {
      const idsToRemove = duplicate.ids.slice(1); // Keep the first one
      const result = await db.collection('emails').deleteMany({
        _id: { $in: idsToRemove }
      });
      duplicatesRemoved += result.deletedCount;
    }
    console.log(`Removed ${duplicatesRemoved} duplicate emails`);
    
    // 4. If still over quota, remove ALL emails except last 100 per account
    const stats2 = await db.stats();
    console.log(`Database size after cleanup: ${(stats2.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (stats2.dataSize >= 512 * 1024 * 1024) {
      console.log('Still over quota, removing all but last 100 emails per account...');
      
      for (const accountId of accounts) {
        const emailsToKeep = await db.collection('emails')
          .find({ accountId })
          .sort({ date: -1 })
          .limit(100)
          .toArray();
        
        const emailsToDelete = await db.collection('emails')
          .find({ 
            accountId,
            _id: { $nin: emailsToKeep.map(e => e._id) }
          })
          .toArray();
        
        if (emailsToDelete.length > 0) {
          const result = await db.collection('emails').deleteMany({
            _id: { $in: emailsToDelete.map(e => e._id) }
          });
          console.log(`Removed ${result.deletedCount} emails for account ${accountId}`);
        }
      }
    }
    
    // Final size check
    const finalStats = await db.stats();
    console.log(`\nFinal database size: ${(finalStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (finalStats.dataSize < 512 * 1024 * 1024) {
      console.log('✅ SUCCESS: Database is now under quota!');
    } else {
      console.log('❌ WARNING: Database is still over quota. Consider upgrading your MongoDB Atlas plan.');
    }
    
  } catch (error) {
    console.error('Error during force cleanup:', error);
  } finally {
    await client.close();
  }
}

// Run the force cleanup
forceCleanup().catch(console.error);
