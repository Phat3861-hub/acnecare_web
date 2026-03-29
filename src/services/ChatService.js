import { http } from "../api/config";

export const chatService = {
  getUserChatRooms: (senderId) => http.post("/chatroom/user", { senderId }),

  getMessagesByRoom: (roomId, page = 0, size = 50) =>
    http.post("/messages/rooms", { roomId, page, size }),

  createChatRoom: (senderId, receiverId) =>
    http.post("/chatroom", { senderId, receiverId }),

  sendImage: (formData) =>
    http.post("/messages/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
