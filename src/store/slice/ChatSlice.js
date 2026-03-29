import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { chatService } from "../../services/ChatService";

export const fetchChatRooms = createAsyncThunk(
  "chat/fetchRooms",
  async (userId, thunkAPI) => {
    try {
      const res = await chatService.getUserChatRooms(userId);
      return res.data.result;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data);
    }
  },
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (roomId, thunkAPI) => {
    try {
      const res = await chatService.getMessagesByRoom(roomId);
      return res.data.result.content; // Mảng tin nhắn
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data);
    }
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    rooms: [],
    messages: [],
    activeRoom: null,
    loadingRooms: false,
    loadingMessages: false,
  },
  reducers: {
    setActiveRoom: (state, action) => {
      state.activeRoom = action.payload;
    },
    // Hàm này để Redux nhận tin nhắn mới từ WebSocket và gắn vào list hiện tại
    receiveNewMessage: (state, action) => {
      if (
        state.activeRoom &&
        state.activeRoom.roomId === action.payload.roomId
      ) {
        state.messages.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatRooms.pending, (state) => {
        state.loadingRooms = true;
      })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.loadingRooms = false;
        state.rooms = action.payload;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.loadingMessages = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;
        state.messages = action.payload.reverse(); // Đảo ngược để tin cũ ở trên, mới ở dưới
      });
  },
});

export const { setActiveRoom, receiveNewMessage } = chatSlice.actions;
export default chatSlice.reducer;
