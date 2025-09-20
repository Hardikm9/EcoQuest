const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

async function backupDatabase() {
  console.log('Starting database backup...');
  
  // Connect to your local MongoDB
  const localUri = 'mongodb://localhost:27017/EcolearnDatabase';
  const client = new MongoClient(localUri);
  
  try {
    await client.connect();
    console.log('Connected to local MongoDB');
    
    const db = client.db();
    const collections = await db.listCollections().toArray();
    
    // Create backup directory
    const backupDir = path.join(process.cwd(), 'mongodb-backup');
    await fs.mkdir(backupDir, { recursive: true });
    console.log(`Created backup directory: ${backupDir}`);
    
    // Backup each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`Backing up collection: ${collectionName}`);
      
      const documents = await db.collection(collectionName).find().toArray();
      const data = JSON.stringify(documents, null, 2);
      
      await fs.writeFile(
        path.join(backupDir, `${collectionName}.json`), 
        data
      );
      
      console.log(`✓ Saved ${documents.length} documents from ${collectionName}`);
    }
    
    console.log('✅ Backup completed successfully!');
    console.log(`Backup files are in: ${backupDir}`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
  } finally {
    await client.close();
  }
}

backupDatabase();