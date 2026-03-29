import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchChatRooms,
  fetchMessages,
  setActiveRoom,
  receiveNewMessage,
} from "../../store/slice/ChatSlice";
import { chatService } from "../../services/ChatService";
import {
  Layout,
  List,
  Avatar,
  Input,
  Button,
  Upload,
  Spin,
  Typography,
  message as antMessage,
  Tooltip,
} from "antd";
import {
  SendOutlined,
  PictureOutlined,
  UserOutlined,
  CustomerServiceOutlined,
} from "@ant-design/icons";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import dayjs from "dayjs";

const { Sider, Content } = Layout;
const { Text } = Typography;

const ChatPage = () => {
  const dispatch = useDispatch();
  const currentUser = JSON.parse(localStorage.getItem("userInfo"));
  const { rooms, messages, activeRoom, loadingRooms, loadingMessages } =
    useSelector((state) => state.chat);

  const [inputText, setInputText] = useState("");
  const [isConnectingAdmin, setIsConnectingAdmin] = useState(false);
  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);

  // 1. Tải danh sách phòng
  useEffect(() => {
    if (currentUser?.id) {
      dispatch(fetchChatRooms(currentUser.id));
    }
  }, [dispatch, currentUser?.id]);

  // 2. Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Kết nối WebSocket khi chọn phòng
  useEffect(() => {
    if (activeRoom) {
      dispatch(fetchMessages(activeRoom.roomId));

      const socket = new SockJS("http://localhost:8080/api/ws");
      const client = new Client({
        webSocketFactory: () => socket,
        onConnect: () => {
          console.log("Đã kết nối WebSocket!");
          client.subscribe(`/topic/room/${activeRoom.roomId}`, (msg) => {
            const newMsg = JSON.parse(msg.body);
            dispatch(receiveNewMessage(newMsg));
          });
        },
      });

      client.activate();
      stompClient.current = client;

      return () => {
        if (stompClient.current) stompClient.current.deactivate();
      };
    }
  }, [activeRoom, dispatch]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeRoom) return;

    // 🚨 THÊM ĐOẠN NÀY LÊN ĐẦU: Kiểm tra xem đã kết nối chưa
    if (!stompClient.current || !stompClient.current.connected) {
      antMessage.error("Mất kết nối máy chủ chat! Vui lòng F5 tải lại trang.");
      return;
    }

    const chatMessage = {
      roomId: activeRoom.roomId,
      senderId: currentUser.id,
      content: inputText,
      type: "TEXT",
    };

    stompClient.current.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(chatMessage),
    });

    setInputText("");
  };

  // --- HÀM GỬI ẢNH (Dùng API REST) ---
  const handleImageUpload = async (options) => {
    const { file, onSuccess, onError } = options;

    if (!activeRoom) {
      antMessage.warning("Vui lòng chọn phòng chat trước!");
      onError("No room selected");
      return;
    }

    const formData = new FormData();
    formData.append("roomId", activeRoom.roomId);
    formData.append("senderId", currentUser.id);
    formData.append("file", file);

    try {
      // Gọi API Upload ảnh (API này chạy xong, Backend sẽ tự bắn WebSocket về để render)
      await chatService.sendImage(formData);
      onSuccess("ok");
    } catch (e) {
      antMessage.error("Lỗi gửi ảnh!");
      onError(e);
    }
  };

  // --- HÀM KẾT NỐI VỚI ADMIN ---
  const handleChatWithAdmin = async () => {
    // 🚨 QUAN TRỌNG: Bạn copy ID của tài khoản ADMIN trong Database và dán vào đây nhé!
    const ADMIN_ID = "3159d202-190a-44e9-bb64-15b5a1c219f0";

    if (currentUser.id === ADMIN_ID) {
      return antMessage.warning("Bạn đang là Admin rồi!");
    }

    setIsConnectingAdmin(true);
    try {
      // Gọi API tạo phòng (Nếu phòng đã có, Backend của bạn sẽ tự động trả về phòng cũ)
      const res = await chatService.createChatRoom(currentUser.id, ADMIN_ID);

      // Refresh lại danh sách phòng
      dispatch(fetchChatRooms(currentUser.id));

      // Focus thẳng vào phòng vừa tạo
      dispatch(setActiveRoom(res.data.result));
      antMessage.success("Đã kết nối với bộ phận Hỗ trợ!");
    } catch (error) {
      antMessage.error(
        "Không thể kết nối với Admin lúc này. Vui lòng kiểm tra lại ADMIN_ID.",
      );
    } finally {
      setIsConnectingAdmin(false);
    }
  };

  return (
    <Layout className="h-[85vh] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden m-6">
      {/* CỘT TRÁI: DANH SÁCH PHÒNG */}
      <Sider
        width={320}
        theme="light"
        className="border-r border-gray-200 flex flex-col"
      >
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <Text strong className="text-lg text-gray-700">
            Tin nhắn
          </Text>

          {/* NÚT CHAT VỚI ADMIN */}
          <Tooltip title="Liên hệ Hỗ trợ viên / Admin">
            <Button
              type="primary"
              icon={<CustomerServiceOutlined />}
              size="small"
              className="bg-blue-600 rounded-full font-medium shadow-sm"
              onClick={handleChatWithAdmin}
              loading={isConnectingAdmin}
            >
              Hỗ trợ
            </Button>
          </Tooltip>
        </div>

        {loadingRooms ? (
          <div className="p-10 text-center">
            <Spin />
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={rooms}
            className="flex-1 overflow-y-auto custom-scrollbar"
            renderItem={(room) => (
              <List.Item
                className={`p-4 cursor-pointer transition-colors border-b border-gray-50 ${activeRoom?.roomId === room.roomId ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-gray-50 border-l-4 border-l-transparent"}`}
                onClick={() => dispatch(setActiveRoom(room))}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      icon={<UserOutlined />}
                      size="large"
                      className={
                        activeRoom?.roomId === room.roomId
                          ? "bg-blue-500"
                          : "bg-gray-300"
                      }
                    />
                  }
                  title={
                    <Text strong className="text-gray-800">
                      Phòng #{room.roomId.slice(0, 6)}
                    </Text>
                  }
                  description={
                    <Text type="secondary" className="text-xs">
                      {dayjs(room.updatedAt).format("HH:mm DD/MM")}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Sider>

      {/* CỘT PHẢI: KHU VỰC CHAT */}
      <Content className="flex flex-col bg-white">
        {activeRoom ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <Avatar icon={<UserOutlined />} className="bg-blue-500" />
              <div>
                <div className="font-bold text-gray-800 leading-tight">
                  Phòng chat #{activeRoom.roomId.slice(0, 6)}
                </div>
                <div className="text-xs text-green-500 font-medium">
                  Đang kết nối...
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#f0f2f5] custom-scrollbar flex flex-col gap-4">
              {loadingMessages ? (
                <div className="text-center py-10">
                  <Spin description="Đang tải tin nhắn..." />
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div
                      className={`flex ${isMe ? "justify-end" : "justify-start"} mb-4`}
                    >
                      <div
                        className={`relative max-w-[70%] shadow-sm ${
                          isMe
                            ? "bg-blue-600 rounded-2xl rounded-br-sm text-white"
                            : "bg-white border border-gray-200 rounded-2xl rounded-bl-sm text-gray-800"
                        } p-1`}
                      >
                        {" "}
                        {/* Giảm padding xuống p-1 để ảnh sát viền đẹp hơn */}
                        {msg.type === "IMAGES" ? (
                          <div className="overflow-hidden rounded-xl">
                            <img
                              src={`http://localhost:8080/api${msg.messageContent}`}
                              alt="sent-img"
                              className="block max-w-[300px] max-h-[400px] w-full h-auto object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() =>
                                window.open(
                                  `http://localhost:8080/api${msg.messageContent}`,
                                  "_blank",
                                )
                              } // Bấm vào để xem ảnh gốc
                            />
                          </div>
                        ) : (
                          <div
                            className="p-2 px-3"
                            style={{ wordBreak: "break-word" }}
                          >
                            {msg.messageContent}
                          </div>
                        )}
                        {/* Thời gian tin nhắn */}
                        <div
                          className={`text-[10px] mt-1 px-2 pb-1 text-right ${isMe ? "text-blue-200" : "text-gray-400"}`}
                        >
                          {dayjs(msg.createAt).format("HH:mm")}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-3">
              <Upload
                customRequest={handleImageUpload} // Dùng customRequest thay vì beforeUpload
                showUploadList={false}
                accept="image/*"
              >
                <Button
                  type="text"
                  icon={
                    <PictureOutlined className="text-2xl text-gray-400 hover:text-blue-600 transition-colors" />
                  }
                />
              </Upload>
              <Input
                size="large"
                placeholder="Nhập tin nhắn..."
                className="rounded-full bg-gray-100 border-none px-5"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPressEnter={handleSendMessage}
              />

              <Button
                type="primary"
                shape="circle"
                size="large"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                className="bg-blue-600 shadow-md"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 flex-col">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <SendOutlined className="text-4xl text-blue-500" />
            </div>
            <Text className="text-xl font-bold text-gray-600">
              Ứng dụng nhắn tin acneCare
            </Text>
            <Text type="secondary" className="mt-2">
              Chọn một cuộc trò chuyện ở cột bên trái hoặc bấm "Hỗ trợ" để bắt
              đầu.
            </Text>
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default ChatPage;
