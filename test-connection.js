const { MongoClient } = require('mongodb');

async function testConnection() {
  const atlasUri = 'mongodb+srv://AbhayCodeSphere:Abhay9305755915@cluster0.3dvbusw.mongodb.net/EcolearnDatabase';
  const client = new MongoClient(atlasUri);
  
  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas');
    
    const db = client.db();
    const collections = await db.listCollections().toArray();
    
    console.log('Collections in your database:');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await client.close();
  }
}

testConnection();