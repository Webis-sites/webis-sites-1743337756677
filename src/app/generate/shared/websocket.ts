import { io, Socket } from 'socket.io-client';

/**
 * שירות WebSocket לתקשורת בזמן אמת עם השרת
 */
class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private projectSubscriptions: Map<string, Set<Function>> = new Map();

  // מונע יצירת מופע חדש ישירות
  private constructor() {}

  /**
   * קבלת מופע יחיד של השירות (Singleton)
   */
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * התחברות לשרת WebSocket
   */
  public connect(): void {
    if (this.socket) {
      return; // כבר מחובר
    }

    // השתמש בפורט 3005 מפורשות
    const url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3005';
    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      
      // מחדש רישום לכל הפרויקטים אחרי התחברות מחדש
      this.projectSubscriptions.forEach((_, projectId) => {
        this.socket?.emit('subscribe', projectId);
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  /**
   * ניתוק מהשרת
   */
  public disconnect(): void {
    if (!this.socket) {
      return;
    }
    
    this.socket.disconnect();
    this.socket = null;
    this.projectSubscriptions.clear();
  }

  /**
   * הרשמה לעדכוני סטטוס פרויקט
   * @param projectId מזהה הפרויקט
   * @param callback פונקציה שתופעל בקבלת עדכון
   */
  public subscribeToProjectStatus(projectId: string, callback: (status: any) => void): void {
    if (!this.socket) {
      this.connect();
    }

    // מוסיף את הקולבק למנויים של הפרויקט
    if (!this.projectSubscriptions.has(projectId)) {
      this.projectSubscriptions.set(projectId, new Set());
      this.socket?.emit('subscribe', projectId);
    }
    
    this.projectSubscriptions.get(projectId)?.add(callback);
    
    // הוספת מאזין לאירוע הפרויקט אם עוד לא הוגדר
    const eventName = `project:${projectId}`;
    if (!this.socket?.hasListeners(eventName)) {
      this.socket?.on(eventName, (status) => {
        const callbacks = this.projectSubscriptions.get(projectId);
        if (callbacks) {
          callbacks.forEach(callback => callback(status));
        }
      });
    }
  }

  /**
   * ביטול הרשמה לעדכוני סטטוס פרויקט
   * @param projectId מזהה הפרויקט
   * @param callback פונקציה ספציפית לביטול (אופציונלי)
   */
  public unsubscribeFromProjectStatus(projectId: string, callback?: Function): void {
    if (!this.socket || !this.projectSubscriptions.has(projectId)) {
      return;
    }

    const callbacks = this.projectSubscriptions.get(projectId);
    
    if (callback && callbacks) {
      // הסרת קולבק ספציפי אם נמסר
      callbacks.delete(callback);
      
      // אם אין עוד קולבקים, הסר את כל ההרשמה
      if (callbacks.size === 0) {
        this.socket.emit('unsubscribe', projectId);
        this.socket.off(`project:${projectId}`);
        this.projectSubscriptions.delete(projectId);
      }
    } else {
      // בטל את כל ההרשמות לפרויקט זה
      this.socket.emit('unsubscribe', projectId);
      this.socket.off(`project:${projectId}`);
      this.projectSubscriptions.delete(projectId);
    }
  }
}

export default WebSocketService; 