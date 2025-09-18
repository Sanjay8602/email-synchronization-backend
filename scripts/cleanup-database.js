// Database cleanup script to reduce storage usage
// Run this with: node cleanup-database.js

const { MongoClient } = require('mongodb');

// Replace with your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-connection-string';

async function cleanupDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get collection sizes before cleanup
    const collections = await db.listCollections().toArray();
    console.log('\n=== Collection Sizes Before Cleanup ===');
    
    for (const collection of collections) {
      const stats = await db.collection(collection.name).stats();
      console.log(`${collection.name}: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // Cleanup strategies
    console.log('\n=== Starting Cleanup ===');
    
    // 1. Remove old sync status records (keep only last 10 per account)
    console.log('Cleaning up old sync status records...');
    const syncStatusCollection = db.collection('syncstatuses');
    const accounts = await syncStatusCollection.distinct('accountId');
    
    for (const accountId of accounts) {
      const oldRecords = await syncStatusCollection
        .find({ accountId })
        .sort({ updatedAt: -1 })
        .skip(10)
        .toArray();
      
      if (oldRecords.length > 0) {
        const result = await syncStatusCollection.deleteMany({
          _id: { $in: oldRecords.map(r => r._id) }
        });
        console.log(`Removed ${result.deletedCount} old sync status records for account ${accountId}`);
      }
    }
    
    // 2. Remove emails older than 1 year (optional - be careful!)
    console.log('Cleaning up emails older than 1 year...');
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const oldEmailsResult = await db.collection('emails').deleteMany({
      date: { $lt: oneYearAgo }
    });
    console.log(`Removed ${oldEmailsResult.deletedCount} emails older than 1 year`);
    
    // 3. Remove duplicate emails (same messageId and accountId)
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
    
    // 4. Optimize indexes
    console.log('Optimizing indexes...');
    await db.collection('emails').createIndex({ accountId: 1, date: -1 });
    await db.collection('emails').createIndex({ messageId: 1, accountId: 1 }, { unique: true });
    await db.collection('syncstatuses').createIndex({ accountId: 1, updatedAt: -1 });
    
    // Get collection sizes after cleanup
    console.log('\n=== Collection Sizes After Cleanup ===');
    for (const collection of collections) {
      const stats = await db.collection(collection.name).stats();
      console.log(`${collection.name}: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }
    
    console.log('\n=== Cleanup Complete ===');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await client.close();
  }
}

// Run the cleanup
cleanupDatabase().catch(console.error);

