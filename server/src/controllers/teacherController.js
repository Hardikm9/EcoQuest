const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const multer = require('multer');
const Teacher = require('../models/Teacher');

function getBucket(bucketName = 'files') {
  const db = mongoose.connection.db;
  return new GridFSBucket(db, { bucketName });
}

async function getMyProfile(req, res) {
  try {
    const teacher = await Teacher.findOne({ user: req.user.id });
    return res.json({ data: teacher });
  } catch (e) {
    return res.status(500).json({ error: { message: 'Failed to fetch profile' } });
  }
}

const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

async function uploadResume(req, res) {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ error: { message: 'Resume file is required' } });
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) return res.status(404).json({ error: { message: 'Teacher profile not found' } });
    
    const bucket = getBucket('teacher_resumes');
    const filename = `${req.user.id}_resume_${Date.now()}.pdf`;
    
    const uploadStream = bucket.openUploadStream(filename, { 
      metadata: { contentType: 'application/pdf' } 
    });
    
    uploadStream.on('finish', async () => {
      const fileId = uploadStream.id;
      teacher.resumeFileId = fileId;
      teacher.resumeUrl = undefined; // Clear S3 URL if exists
      await teacher.save();
      res.json({ data: { fileId, url: `/api/teachers/resume/${teacher._id}` } });
    });
    
    uploadStream.on('error', (error) => {
      res.status(500).json({ error: { message: 'Resume upload failed' } });
    });
    
    uploadStream.end(req.file.buffer);
  } catch (e) {
    return res.status(500).json({ error: { message: 'Resume upload failed' } });
  }
}

async function getResume(req, res) {
  try {
    const { teacherId } = req.params;
    const teacher = await Teacher.findById(teacherId);
    if (!teacher || !teacher.resumeFileId) return res.status(404).json({ error: { message: 'Resume not found' } });
    
    const bucket = getBucket('teacher_resumes');
    res.setHeader('Content-Type', 'application/pdf');
    bucket.openDownloadStream(teacher.resumeFileId).pipe(res);
  } catch (e) {
    return res.status(500).json({ error: { message: 'Failed to load resume' } });
  }
}

async function updateProfile(req, res) {
  try {
    const { details, qualification, contact } = req.body;
    const teacher = await Teacher.findOneAndUpdate(
      { user: req.user.id },
      { $set: { details, qualification, contact } },
      { new: true, upsert: true }
    );
    return res.json({ data: teacher });
  } catch (e) {
    return res.status(500).json({ error: { message: 'Failed to update profile' } });
  }
}

async function uploadFile(req, res) {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ error: { message: 'File is required' } });
    
    const folder = req.body.folder || 'uploads';
    const bucket = getBucket('files');
    const ext = (req.file.originalname || '').split('.').pop() || 'bin';
    const filename = `${folder}/${req.user.id}_${Date.now()}.${ext}`;
    
    const uploadStream = bucket.openUploadStream(filename, { 
      metadata: { 
        contentType: req.file.mimetype,
        originalName: req.file.originalname,
        uploadedBy: req.user.id
      } 
    });
    
    uploadStream.on('finish', () => {
      const fileId = uploadStream.id;
      res.json({ 
        data: { 
          fileId, 
          url: `/api/files/${fileId}`,
          filename: uploadStream.filename
        } 
      });
    });
    
    uploadStream.on('error', (error) => {
      res.status(500).json({ error: { message: 'File upload failed' } });
    });
    
    uploadStream.end(req.file.buffer);
  } catch (e) {
    return res.status(500).json({ error: { message: 'File upload failed' } });
  }
}

async function getFile(req, res) {
  try {
    const { fileId } = req.params;
    const bucket = getBucket('files');
    
    const downloadStream = bucket.openDownloadStream(fileId);
    
    downloadStream.on('error', (error) => {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: { message: 'File not found' } });
      }
      return res.status(500).json({ error: { message: 'Failed to load file' } });
    });
    
    downloadStream.pipe(res);
  } catch (e) {
    return res.status(500).json({ error: { message: 'Failed to load file' } });
  }
}
// This function should be in your teacherController.js or courseController.js
// It replaces the old addMaterial function.
async function addMaterial(req, res) {
  try {
    // The 'upload' middleware adds the 'file' object to the request
    if (!req.file) {
      return res.status(400).json({ error: { message: 'File upload is required.' } });
    }

    const { type, title, description } = req.body;
    const { id: fileId, filename, contentType } = req.file;
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ error: { message: 'Course not found' } });
    if (String(course.teacher) !== req.user.id) return res.status(403).json({ error: { message: 'Forbidden' } });

    course.materials.push({ type, title, description, fileId, filename, contentType });
    await course.save();
    res.status(201).json({ data: course.materials[course.materials.length - 1] });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to add material' } });
  }
}

// Ensure you export this function
module.exports.addMaterial = addMaterial;
module.exports = { uploadResume, getResume, updateProfile, getMyProfile, upload, uploadFile, getFile };


