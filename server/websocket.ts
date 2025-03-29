import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// טעינת משתני סביבה
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  console.log('Loading environment from .env.local');
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log('Loading environment from .env');
  dotenv.config({ path: envPath });
} else {
  console.warn('No .env or .env.local file found');
  dotenv.config();
}

// הדפס את המפתח (חלקית, מטעמי אבטחה)
const apiKey = process.env.ANTHROPIC_API_KEY;
if (apiKey) {
  console.log(`ANTHROPIC_API_KEY is set: ${apiKey.substring(0, 10)}...`);
} else {
  console.warn('ANTHROPIC_API_KEY is not set!');
}

// הוספת הצהרה גלובלית עבור TypeScript
declare global {
  var emitProjectStatus: (projectId: string, status: any) => void;
}

// הגדרת פורט קבוע 3005
const PORT = 3005;

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: './src' });
const handle = app.getRequestHandler();

// ניהול החיבורים הפעילים
const activeConnections: Map<string, any> = new Map();

app.prepare().then(() => {
  // יצירת שרת HTTP
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // הגדרת שרת WebSocket
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // טיפול בהתחברות חדשה
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    activeConnections.set(socket.id, socket);

    // התנתקות
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      activeConnections.delete(socket.id);
    });

    // הרשמה לעדכוני סטטוס פרויקט
    socket.on('subscribe', (projectId: string) => {
      console.log(`Client ${socket.id} subscribed to project: ${projectId}`);
      socket.join(`project:${projectId}`);
    });

    // ביטול הרשמה לעדכוני סטטוס פרויקט
    socket.on('unsubscribe', (projectId: string) => {
      console.log(`Client ${socket.id} unsubscribed from project: ${projectId}`);
      socket.leave(`project:${projectId}`);
    });
  });

  // פונקציה להפצת עדכוני סטטוס פרויקט
  global.emitProjectStatus = (projectId: string, status: any) => {
    io.to(`project:${projectId}`).emit(`project:${projectId}`, status);
    console.log(`Status update for project ${projectId}: ${JSON.stringify(status).substring(0, 100)}...`);
  };

  // הפעלת השרת
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });

  // טיפול בסגירת השרת
  const cleanup = () => {
    console.log('Closing server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  // התחברות לאירועי סגירה
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}); 