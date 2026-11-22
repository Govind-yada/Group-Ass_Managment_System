const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { initDatabase } = require('./db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('🚀 Initializing Joineazy Backend Server...');
    await initDatabase();

    const server = app.listen(PORT, () => {
      console.log(` Joineazy API server listening on http://localhost:${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    const shutdown = async () => {
      console.log('\n🛑 Gracefully shutting down server...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
