// backend/routes/wsChatRoutes.js
const Chat = require("../models/Chat");
const { escapeHtml } = require("../utils/sanitize");

async function wsChatRoutes(fastify, options) {
  const db = fastify.knex || options.db;
  const chatModel = new Chat(db);
  
  fastify.log.info(`[WS-Chat] ✓ Registering WebSocket chat route, db available:`, !!db);

  // userId -> Set of sockets
  const clients = new Map();

  const addClient = (userId, socket) => {
    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId).add(socket);
    fastify.log.info(`[WS-Chat] ✓ Client added: userId=${userId}, totalConnections=${clients.size}`);
  };

  const removeClient = (userId, socket) => {
    const set = clients.get(userId);
    if (!set) return;
    set.delete(socket);
    if (set.size === 0) clients.delete(userId);
    fastify.log.info(`[WS-Chat] ✓ Client removed: userId=${userId}, totalConnections=${clients.size}`);
  };

  const sendJSON = (socket, obj) => {
    try {
      socket.send(JSON.stringify(obj));
    } catch (err) {
      fastify.log.error(`[WS-Chat] ✗ Failed to send message:`, err.message);
    }
  };

  const sendToUser = (userId, obj) => {
    const set = clients.get(userId);
    if (!set) {
      fastify.log.warn(`[WS-Chat] User ${userId} not connected`);
      return;
    }
    fastify.log.info(`[WS-Chat] Broadcasting to user ${userId} (${set.size} connections)`);
    for (const sock of set) sendJSON(sock, obj);
  };

  fastify.get("/ws/chat", { websocket: true }, (socket, request) => {
    fastify.log.info("[WS-Chat] ✓ WebSocket endpoint registered and handler called");
    let authedUserId = null;

    fastify.log.info("[WS-Chat] ✓ New WebSocket connection established");

    // If client never auths, close after 5 seconds
    const authTimeout = setTimeout(() => {
      if (!authedUserId) {
        fastify.log.warn("[WS-Chat] ✗ Auth timeout - closing connection");
        sendJSON(socket, {
          type: "ERROR",
          payload: { message: "AUTH required" },
        });
        socket.close();
      }
    }, 5000);

    socket.on("message", async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch (err) {
        fastify.log.error("[WS-Chat] Failed to parse JSON:", err.message, "Raw:", raw.toString());
        sendJSON(socket, { type: "ERROR", payload: { message: "Invalid JSON" } });
        return;
      }

      // -------------------------
      // 1) AUTH (must happen first)
      // -------------------------
      if (!authedUserId) {
        if (msg.type !== "AUTH") {
          fastify.log.warn(`[WS-Chat] ✗ Expected AUTH but got ${msg.type}`);
          sendJSON(socket, { type: "ERROR", payload: { message: "Send AUTH first" } });
          return;
        }

        const token = msg.payload?.token;
        if (!token || typeof token !== "string") {
          fastify.log.error("[WS-Chat] ✗ AUTH message missing token");
          sendJSON(socket, { type: "ERROR", payload: { message: "token required" } });
          return;
        }

        try {
          const payload = await fastify.jwt.verify(token);

          // ✅ IMPORTANT: pick the right id field
          const userId = payload.id ?? payload.userId ?? payload.sub;
          if (!userId) throw new Error("Token payload missing user id");

          authedUserId = Number(userId);
          clearTimeout(authTimeout);

          addClient(authedUserId, socket);

          sendJSON(socket, { type: "AUTH_OK", payload: { userId: authedUserId } });
          fastify.log.info(`[WS-Chat] ✓ Authentication successful for userId: ${authedUserId}`);
        } catch (e) {
          fastify.log.error("[WS-Chat] ✗ JWT verification failed:", e.message);
          sendJSON(socket, { type: "ERROR", payload: { message: "Invalid token" } });
          socket.close();
        }

        return;
      }

      // -------------------------
      // 2) CHAT_SEND or CREATE_CHAT after auth
      // -------------------------
      if (msg.type === "CREATE_CHAT") {
        const user2Id = Number(msg.payload?.user2Id);

        if (!Number.isInteger(user2Id) || user2Id < 1 || user2Id === authedUserId) {
          fastify.log.error("[WS-Chat] CREATE_CHAT validation failed:", { user2Id, authedUserId });
          sendJSON(socket, { type: "ERROR", payload: { message: "user2Id required and must be a valid user different from yourself" } });
          return;
        }

        try {
          const chatId = await chatModel.createChatBetweenUsers(authedUserId, user2Id);
          fastify.log.info(`[WS-Chat] ✓ Chat created: id=${chatId}`);
          sendJSON(socket, { type: "CHAT_CREATED", payload: { chatId } });
        } catch (e) {
          // Chat might already exist
          if (e.message && e.message.includes("already exists")) {
            try {
              // Try to get existing chat
              const existingChatId = await chatModel.getChatBetweenUsers(authedUserId, user2Id);
              fastify.log.info(`[WS-Chat] Chat already exists: id=${existingChatId}`);
              sendJSON(socket, { type: "CHAT_CREATED", payload: { chatId: existingChatId } });
            } catch (getErr) {
              fastify.log.error(`[WS-Chat] Failed to retrieve existing chat: ${getErr.message}`);
              sendJSON(socket, { type: "ERROR", payload: { message: "Chat already exists but could not be retrieved" } });
            }
          } else {
            fastify.log.error(`[WS-Chat] Failed to create chat: ${e.message}`, e);
            sendJSON(socket, { type: "ERROR", payload: { message: e.message || "Failed to create chat" } });
          }
        }
        return;
      }

      if (msg.type !== "CHAT_SEND") {
        fastify.log.warn(`[WS-Chat] Expected CHAT_SEND but got ${msg.type}`);
        sendJSON(socket, { type: "ERROR", payload: { message: `Unknown type: ${msg.type}` } });
        return;
      }

      const chatId = Number(msg.payload?.chatId);
      const content = msg.payload?.content;

      if (!Number.isInteger(chatId) || chatId < 1 || typeof content !== "string" || !content.trim()) {
        fastify.log.error("[WS-Chat] ✗ CHAT_SEND validation failed:", { chatId, hasContent: !!content });
        sendJSON(socket, { type: "ERROR", payload: { message: "chatId + content required" } });
        return;
      }

      const trimmedContent = content.trim();
      if (trimmedContent.length > 5000) {
        sendJSON(socket, { type: "ERROR", payload: { message: "Message too long (max 5000 characters)" } });
        return;
      }

      const sanitizedContent = escapeHtml(trimmedContent);

      try {
        const { message, receiverUserId } = await chatModel.createMessage(
          authedUserId,
          chatId,
          sanitizedContent
        );

        fastify.log.info(`[WS-Chat] ✓ Message created: id=${message.id}, chatId=${chatId}`);

        // Add is_own_message flag based on sender_id for sender
        const senderMessage = { ...message, is_own_message: message.sender_id === authedUserId };
        // Add is_own_message flag based on sender_id for receiver
        const receiverMessage = { ...message, is_own_message: message.sender_id === receiverUserId };

        // push to sender + receiver
        sendToUser(authedUserId, { type: "CHAT_NEW", payload: { chatId, message: senderMessage } });
        sendToUser(receiverUserId, { type: "CHAT_NEW", payload: { chatId, message: receiverMessage } });
      } catch (e) {
        fastify.log.error(`[WS-Chat] ✗ Failed to create message: ${e.message}`, e);
        sendJSON(socket, { type: "ERROR", payload: { message: e.message || "Failed to send message" } });
      }
    });

    socket.on("close", () => {
      clearTimeout(authTimeout);
      if (authedUserId) {
        fastify.log.info(`[WS-Chat] ✓ Connection closed for userId=${authedUserId}`);
        removeClient(authedUserId, socket);
      } else {
        fastify.log.warn("[WS-Chat] Connection closed before authentication");
      }
    });

    socket.on("error", (err) => {
      fastify.log.error(`[WS-Chat] ✗ Socket error for userId=${authedUserId}:`, err.message);
    });
  });
}

module.exports = wsChatRoutes;
