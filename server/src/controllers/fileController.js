const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// This will be initialized when the DB connection is open
let gfs;
mongoose.connection.once('open', () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
});

async function getFile(req, res) {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const readStream = gfs.openDownloadStream(fileId);

    readStream.on('error', () => {
      return res.status(404).json({ error: { message: 'File not found' } });
    });

    readStream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to retrieve file' } });
  }
}

module.exports = { getFile };