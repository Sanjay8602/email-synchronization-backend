// Conservative database cleanup script
// This script only removes sync status records to free up space

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-connection-string';

async function conservativeCleanup() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Only clean up sync status records (safest option)
    console.log('Cleaning up old sync status records...');
    
    const syncStatusCollection = db.collection('syncstatuses');
    const accounts = await syncStatusCollection.distinct('accountId');
    
    let totalRemoved = 0;
    
    for (const accountId of accounts) {
      // Keep only the 5 most recent sync status records per account
      const oldRecords = await syncStatusCollection
        .find({ accountId })
        .sort({ updatedAt: -1 })
        .skip(5)
        .toArray();
      
      if (oldRecords.length > 0) {
        const result = await syncStatusCollection.deleteMany({
          _id: { $in: oldRecords.map(r => r._id) }
        });
        totalRemoved += result.deletedCount;
        console.log(`Removed ${result.deletedCount} old sync status records for account ${accountId}`);
      }
    }
    
    console.log(`Total records removed: ${totalRemoved}`);
    
    // Check current database size
    const stats = await db.stats();
    console.log(`Current database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await client.close();
  }
}

conservativeCleanup().catch(console.error);

