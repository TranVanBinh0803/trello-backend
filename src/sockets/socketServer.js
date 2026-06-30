import { Server } from "socket.io";
import { WHITELIST_DOMAINS } from "~/utils/constants";

let ioInstance = null;

const onlineUsers = new Map();
const socketUsers = new Map();

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const addOnlineUser = (socket, userId) => {
  const normalizedUserId = userId?.toString();
  if (!normalizedUserId) return;

  if (!onlineUsers.has(normalizedUserId)) {
    onlineUsers.set(normalizedUserId, new Set());
  }

  onlineUsers.get(normalizedUserId).add(socket.id);
  socketUsers.set(socket.id, normalizedUserId);
  socket.join(`user:${normalizedUserId}`);
};

const removeOnlineUser = (socket) => {
  const userId = socketUsers.get(socket.id);
  if (!userId) return null;

  const socketIds = onlineUsers.get(userId);
  socketIds?.delete(socket.id);
  socketUsers.delete(socket.id);

  if (socketIds?.size) {
    return null;
  }

  onlineUsers.delete(userId);
  return userId;
};

const isAllowedOrigin = (origin, callback) => {
  if (!origin || WHITELIST_DOMAINS.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`${origin} not allowed by Socket.IO CORS policy.`));
};

export const initializeSocketServer = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: isAllowedOrigin,
      credentials: true,
    },
  });

  ioInstance.on("connection", (socket) => {
    socket.on("user:online", ({ userId } = {}) => {
      addOnlineUser(socket, userId);
      ioInstance.emit("presence:changed", {
        onlineUserIds: getOnlineUserIds(),
      });
    });

    socket.on("board:join", ({ boardId } = {}) => {
      if (!boardId) return;
      socket.join(`board:${boardId}`);
      socket.emit("presence:changed", {
        onlineUserIds: getOnlineUserIds(),
      });
    });

    socket.on("board:leave", ({ boardId } = {}) => {
      if (!boardId) return;
      socket.leave(`board:${boardId}`);
    });

    socket.on("disconnect", () => {
      const offlineUserId = removeOnlineUser(socket);
      if (!offlineUserId) return;

      ioInstance.emit("presence:changed", {
        onlineUserIds: getOnlineUserIds(),
      });
    });
  });

  return ioInstance;
};

export const emitBoardEvent = (boardId, eventName, payload = {}) => {
  if (!ioInstance || !boardId) return;

  ioInstance.to(`board:${boardId}`).emit(eventName, {
    boardId: boardId.toString(),
    ...payload,
  });
};
