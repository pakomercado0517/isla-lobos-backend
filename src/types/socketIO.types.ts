import { NotificacionDashboardDTO } from './dashboard-notification.types';

export interface ServerToClientEvents {
  nueva_notificacion: (notificacion: NotificacionDashboardDTO) => void;
  actualizacionEstado: (datos: { id: string; status: 'conectado' | 'desconectado' | 'error' }) => void;
}

export interface ClientToServerEvents {
  solicitarDatos: (id: string, callback: (respuesta: { exito: boolean }) => void) => void;
  enviarMensaje: (mensaje: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  rol: string;
}
