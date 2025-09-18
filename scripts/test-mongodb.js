// MongoDB Connection Test Script
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://sutsun0606_db_user:yJbYCOiSkJAOMaQr@cluster0.rlb8mes.mongodb.net/lucid-growth?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('🌐 Host:', mongoose.connection.host);
    
    // Test creating a simple collection
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({ 
      message: 'Connection test successful', 
      timestamp: new Date() 
    });
    
    console.log('✅ Test document inserted successfully!');
    
    // Clean up test document
    await testCollection.deleteOne({ message: 'Connection test successful' });
    console.log('🧹 Test document cleaned up');
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
