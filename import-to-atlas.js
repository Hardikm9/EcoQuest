const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

async function importToAtlas() {
  console.log('Starting import to MongoDB Atlas...');
  
  // Your MongoDB Atlas connection string
  const atlasUri = 'mongodb+srv://AbhayCodeSphere:Abhay9305755915@cluster0.3dvbusw.mongodb.net/EcolearnDatabase';
  const client = new MongoClient(atlasUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db();
    const backupDir = path.join(process.cwd(), 'mongodb-backup');
    
    // Read all backup files
    const files = await fs.readdir(backupDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const collectionName = file.replace('.json', '');
        console.log(`Importing to collection: ${collectionName}`);
        
        const filePath = path.join(backupDir, file);
        const data = await fs.readFile(filePath, 'utf8');
        const documents = JSON.parse(data);
        
        if (documents.length > 0) {
          // Clear existing data (optional)
          await db.collection(collectionName).deleteMany({});
          
          // Insert the documents
          await db.collection(collectionName).insertMany(documents);
          console.log(`✓ Imported ${documents.length} documents to ${collectionName}`);
        } else {
          console.log(`No documents to import in ${collectionName}`);
        }
      }
    }
    
    console.log('✅ Import to Atlas completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await client.close();
  }
}

importToAtlas();