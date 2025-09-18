const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('Please set MONGODB_URI in your .env file or environment variables.');
  process.exit(1);
}

// Define the Email schema (simplified)
const emailSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, required: true },
  messageId: { type: String, required: true },
  subject: { type: String, required: true },
  from: { type: String, required: true },
  fromName: { type: String, required: true },
  fromEmail: { type: String, required: true },
  to: [{ type: String }],
  date: { type: Date, required: true },
  folder: { type: String, required: true },
  uid: { type: Number, required: true },
  size: { type: Number, required: true },
  content: { type: String, required: true },
  searchableContent: { type: String }
}, { timestamps: true });

const Email = mongoose.model('Email', emailSchema);

async function checkEmails() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas!');
    
    // Count total emails
    const totalEmails = await Email.countDocuments();
    console.log(`📧 Total emails in database: ${totalEmails}`);
    
    if (totalEmails > 0) {
      // Get sample emails
      const sampleEmails = await Email.find()
        .limit(5)
        .select('subject fromEmail date folder accountId')
        .lean();
      
      console.log('📋 Sample emails:');
      sampleEmails.forEach((email, index) => {
        console.log(`${index + 1}. Subject: ${email.subject}`);
        console.log(`   From: ${email.fromEmail}`);
        console.log(`   Date: ${email.date}`);
        console.log(`   Folder: ${email.folder}`);
        console.log(`   Account ID: ${email.accountId}`);
        console.log('---');
      });
      
      // Check for specific account
      const accountId = '68c1c9bb1643fdbb74aa35e0';
      const accountEmails = await Email.countDocuments({ accountId });
      console.log(`📊 Emails for account ${accountId}: ${accountEmails}`);
    } else {
      console.log('❌ No emails found in database!');
    }
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkEmails();

