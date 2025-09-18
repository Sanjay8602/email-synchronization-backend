// Emergency database cleanup script to free up space
// This script removes old emails and sync records to get under quota

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('Please set MONGODB_URI in your .env file or environment variables.');
  process.exit(1);
}

async function emergencyCleanup() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get current database size
    const stats = await db.stats();
    console.log(`Current database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (stats.dataSize < 512 * 1024 * 1024) {
      console.log('Database is already under quota. No cleanup needed.');
      return;
    }
    
    console.log('\n=== Starting Emergency Cleanup ===');
    
    // 1. Remove emails older than 6 months
    console.log('Removing emails older than 6 months...');
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const oldEmailsResult = await db.collection('emails').deleteMany({
      date: { $lt: sixMonthsAgo }
    });
    console.log(`Removed ${oldEmailsResult.deletedCount} emails older than 6 months`);
    
    // Check size after first cleanup
    const stats1 = await db.stats();
    console.log(`Database size after 6-month cleanup: ${(stats1.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (stats1.dataSize < 512 * 1024 * 1024) {
      console.log('✅ Database is now under quota!');
      return;
    }
    
    // 2. Remove emails older than 3 months
    console.log('Removing emails older than 3 months...');
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const olderEmailsResult = await db.collection('emails').deleteMany({
      date: { $lt: threeMonthsAgo }
    });
    console.log(`Removed ${olderEmailsResult.deletedCount} emails older than 3 months`);
    
    // Check size after second cleanup
    const stats2 = await db.stats();
    console.log(`Database size after 3-month cleanup: ${(stats2.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (stats2.dataSize < 512 * 1024 * 1024) {
      console.log('✅ Database is now under quota!');
      return;
    }
    
    // 3. Remove all sync status records except the most recent 2 per account
    console.log('Removing old sync status records...');
    const syncStatusCollection = db.collection('syncstatuses');
    const accounts = await syncStatusCollection.distinct('accountId');
    
    let totalSyncRemoved = 0;
    for (const accountId of accounts) {
      const oldRecords = await syncStatusCollection
        .find({ accountId })
        .sort({ updatedAt: -1 })
        .skip(2)
        .toArray();
      
      if (oldRecords.length > 0) {
        const result = await syncStatusCollection.deleteMany({
          _id: { $in: oldRecords.map(r => r._id) }
        });
        totalSyncRemoved += result.deletedCount;
      }
    }
    console.log(`Removed ${totalSyncRemoved} old sync status records`);
    
    // 4. Remove duplicate emails
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
    
    // Final size check
    const finalStats = await db.stats();
    console.log(`\nFinal database size: ${(finalStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (finalStats.dataSize < 512 * 1024 * 1024) {
      console.log('✅ SUCCESS: Database is now under quota!');
    } else {
      console.log('❌ WARNING: Database is still over quota. Consider upgrading your MongoDB Atlas plan.');
    }
    
  } catch (error) {
    console.error('Error during emergency cleanup:', error);
  } finally {
    await client.close();
  }
}

// Run the emergency cleanup
emergencyCleanup().catch(console.error);
