import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import conversationRoutes from './routes/conversations';
import messageRoutes from './routes/messages';
import botRoutes from './routes/bots';
import groupRoutes from './routes/groups';
import tagRoutes from './routes/tags';
import modelRoutes from './routes/models';

// Load environment variables
dotenv.config();

// Initialize database schema
import './db/schema';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mount routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/conversations', conversationRoutes);
apiRouter.use('/conversations', messageRoutes); // Nested routes for messages
apiRouter.use('/bots', botRoutes);
apiRouter.use('/group-conversations', groupRoutes);
apiRouter.use('/tags', tagRoutes);
apiRouter.use('/models', modelRoutes);

app.use('/api', apiRouter);

// Serve static files from frontend (only in production)
if (process.env.NODE_ENV === 'production') {
  // Use process.cwd() to get the current working directory
  const frontendDist = path.join(process.cwd(), 'front', 'dist');
  app.use(express.static(frontendDist));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

export default app;
