const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { loadEnv } = require('./config/env');
const { connectToDatabase } = require('./config/db');
const apiRouter = require('./routes');
const { initRealtime } = require('./services/realtime');

// Load environment variables once
loadEnv();

const app = express();

// Middlewares
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Root endpoint to prevent 404
app.get('/', (req, res) => {
  res.send('EcoQuest API is running. Use /api for endpoints.');
});

// Health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'EcoLearn API',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', apiRouter);

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details || undefined;
  res.status(status).json({ error: { message, details } });
});

// Use Render-assigned port or fallback to 5000
const PORT = process.env.PORT || 5000;

connectToDatabase()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`EcoLearn API listening on port ${PORT}`);
    });
    initRealtime(server);
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
