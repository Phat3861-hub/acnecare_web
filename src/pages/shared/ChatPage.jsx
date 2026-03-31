import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchChatRooms,
  fetchMessages,
  setActiveRoom,
  receiveNewMessage,
} from "../../store/slice/ChatSlice";
import { chatService } from "../../services/ChatService";
import { userService } from "../../services/UserService";
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
  Badge,
} from "antd";
import {
  SendOutlined,
  PictureOutlined,
  UserOutlined,
  CustomerServiceOutlined,
  SearchOutlined,
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

  // STATE: Dùng để lưu thông tin (Tên, Avatar) của những người đang chat với mình
  const [chatPartners, setChatPartners] = useState({});

  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);

  const ADMIN_ID = "b290eedd-c923-4e1a-b286-61f6e8d727cb";

  const getOtherUserId = (room) => {
    if (!room) return null;

    if (room.userId && room.userId !== currentUser.id) return room.userId;
    if (room.otherUserId && room.otherUserId !== currentUser.id)
      return room.otherUserId;

    if (room.user_id && room.user_id !== currentUser.id) return room.user_id;
    if (room.other_user_id && room.other_user_id !== currentUser.id)
      return room.other_user_id;

    if (room.user?.id && room.user.id !== currentUser.id) return room.user.id;
    if (room.otherUser?.id && room.otherUser.id !== currentUser.id)
      return room.otherUser.id;

    return null;
  };

  // 1. Tải danh sách phòng & Reset Active Room
  useEffect(() => {
    dispatch(setActiveRoom(null));
    if (currentUser?.id) {
      dispatch(fetchChatRooms(currentUser.id));
    }
  }, [dispatch, currentUser?.id]);

  // 2. Tải thông tin User (Có cơ chế chống treo "Đang tải...")
  useEffect(() => {
    const fetchPartnersInfo = async () => {
      if (!rooms || rooms.length === 0) return;

      const newPartners = { ...chatPartners };
      let hasChanges = false;

      for (const room of rooms) {
        const partnerId = getOtherUserId(room);

        if (partnerId && partnerId !== ADMIN_ID && !newPartners[partnerId]) {
          try {
            const res = await userService.getUserById(partnerId);
            const userInfo = res.data?.result || res.data?.data || res.data;

            if (userInfo) {
              newPartners[partnerId] = userInfo;
            } else {
              newPartners[partnerId] = { error: true };
            }
            hasChanges = true;
          } catch (error) {
            console.error(
              "❌ Lỗi API lấy thông tin user ID:",
              partnerId,
              error,
            );
            newPartners[partnerId] = { error: true };
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        setChatPartners(newPartners);
      }
    };

    fetchPartnersInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms]);

  // 3. Xử lý hiển thị (Tự động fallback về "Phòng #" nếu lỗi)
  const getPartnerDisplayInfo = (room) => {
    const partnerId = getOtherUserId(room);

    if (!partnerId) {
      return {
        name: `Phòng #${room.roomId.slice(0, 5)}`,
        avatar: null,
        isAdmin: false,
      };
    }

    if (partnerId === ADMIN_ID) {
      return {
        name: "Hỗ trợ viên (AcneCare)",
        avatar: null,
        isAdmin: true,
      };
    }

    const partnerInfo = chatPartners[partnerId];
    if (partnerInfo) {
      if (partnerInfo.error) {
        return {
          name: `Phòng #${room.roomId.slice(0, 5)}`,
          avatar: null,
          isAdmin: false,
        };
      }

      const firstName = partnerInfo.firstName || partnerInfo.first_name || "";
      const lastName = partnerInfo.lastName || partnerInfo.last_name || "";
      const fullName = `${lastName} ${firstName}`.trim();

      return {
        name: fullName || "Người dùng ẩn danh",
        avatar: partnerInfo.avatarUrl || partnerInfo.avatar_url || null,
        isAdmin: false,
      };
    }

    return {
      name: `Đang tải...`,
      avatar: null,
      isAdmin: false,
    };
  };

  // 3. FIX BUG GIẬT TRANG
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [messages]);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  // 4. Kết nối WebSocket khi chọn phòng
  useEffect(() => {
    if (activeRoom) {
      dispatch(fetchMessages(activeRoom.roomId));

      const socket = new SockJS(`${backendUrl}/api/ws`);
      const client = new Client({
        webSocketFactory: () => socket,
        onConnect: () => {
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

    if (!stompClient.current || !stompClient.current.connected) {
      antMessage.error("Mất kết nối máy chủ! Đang thử kết nối lại...");
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

  const handleImageUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    if (!activeRoom) return antMessage.warning("Vui lòng chọn phòng chat!");

    const formData = new FormData();
    formData.append("roomId", activeRoom.roomId);
    formData.append("senderId", currentUser.id);
    formData.append("file", file);

    try {
      await chatService.sendImage(formData);
      onSuccess("ok");
    } catch (e) {
      antMessage.error("Lỗi gửi ảnh!");
      onError(e);
    }
  };

  const handleChatWithAdmin = async () => {
    if (currentUser.id === ADMIN_ID)
      return antMessage.warning("Bạn đang là Admin!");

    setIsConnectingAdmin(true);
    try {
      const res = await chatService.createChatRoom(currentUser.id, ADMIN_ID);
      dispatch(fetchChatRooms(currentUser.id));
      dispatch(setActiveRoom(res.data.result));
    } catch (error) {
      antMessage.error("Không thể kết nối với Hỗ trợ viên.");
    } finally {
      setIsConnectingAdmin(false);
    }
  };

  return (
    <Layout className="h-[88vh] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden m-4 lg:mx-10 lg:my-6 flex flex-row">
      <Sider
        width={350}
        theme="light"
        className="border-r border-gray-200 flex flex-col bg-white"
      >
        <div className="p-4 flex justify-between items-center">
          <Text
            strong
            className="text-2xl font-black text-gray-800 tracking-tight"
          >
            Đoạn chat
          </Text>
          <Tooltip title="Liên hệ CSKH">
            <Button
              type="primary"
              shape="circle"
              icon={<CustomerServiceOutlined />}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none shadow-none"
              onClick={handleChatWithAdmin}
              loading={isConnectingAdmin}
            />
          </Tooltip>
        </div>

        <div className="px-4 pb-3">
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Tìm kiếm trên Messenger..."
            className="rounded-full bg-[#f3f3f5] border-none hover:bg-[#e9e9eb] focus:bg-[#e9e9eb] py-2"
          />
        </div>

        {loadingRooms ? (
          <div className="p-10 text-center">
            <Spin />
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={rooms}
            className="flex-1 overflow-y-auto custom-scrollbar px-2"
            locale={{ emptyText: "Bạn chưa có cuộc trò chuyện nào" }}
            renderItem={(room) => {
              const isActive = activeRoom?.roomId === room.roomId;
              const partner = getPartnerDisplayInfo(room);

              return (
                <List.Item
                  className={`p-3 mb-1 cursor-pointer rounded-xl transition-all border-none ${
                    isActive ? "bg-[#e5f1ff]" : "hover:bg-gray-100"
                  }`}
                  onClick={() => dispatch(setActiveRoom(room))}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge dot color="green" offset={[-5, 35]}>
                        <Avatar
                          src={partner.avatar ? `${partner.avatar}` : null}
                          icon={
                            partner.avatar ? null : partner.isAdmin ? (
                              <CustomerServiceOutlined />
                            ) : (
                              <UserOutlined />
                            )
                          }
                          size={48}
                          className={
                            partner.isAdmin ? "bg-blue-600" : "bg-gray-300"
                          }
                        />
                      </Badge>
                    }
                    title={
                      <Text
                        strong
                        className={`text-[15px] ${isActive ? "text-blue-600" : "text-gray-800"}`}
                      >
                        {partner.name}
                      </Text>
                    }
                    description={
                      <div className="flex justify-between items-center w-full truncate pr-2">
                        <Text className="text-[13px] text-gray-500 truncate w-3/4">
                          Chạm để xem tin nhắn...
                        </Text>
                        <Text className="text-[11px] text-gray-400">
                          {dayjs(room.updatedAt).format("HH:mm")}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Sider>

      <Content className="flex flex-col bg-white w-full">
        {activeRoom ? (
          <>
            {/* HEADER PHÒNG CHAT ĐÃ XÓA ICON THỪA */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <Badge dot color="green" offset={[-3, 30]}>
                  <Avatar
                    src={
                      getPartnerDisplayInfo(activeRoom).avatar
                        ? `${getPartnerDisplayInfo(activeRoom).avatar}`
                        : null
                    }
                    icon={
                      getPartnerDisplayInfo(activeRoom).avatar ? null : (
                        <UserOutlined />
                      )
                    }
                    size={40}
                    className="bg-blue-500"
                  />
                </Badge>
                <div>
                  <div className="font-bold text-gray-800 text-[16px] leading-tight">
                    {getPartnerDisplayInfo(activeRoom).name}
                  </div>
                  <div className="text-[12px] text-gray-500 font-medium">
                    Đang hoạt động
                  </div>
                </div>
              </div>
            </div>

            {/* KHUNG HIỂN THỊ TIN NHẮN */}
            <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar flex flex-col gap-2">
              <div className="flex flex-col items-center justify-center my-6 text-gray-400">
                <Avatar
                  size={64}
                  src={
                    getPartnerDisplayInfo(activeRoom).avatar
                      ? `${getPartnerDisplayInfo(activeRoom).avatar}`
                      : null
                  }
                  icon={
                    getPartnerDisplayInfo(activeRoom).avatar ? null : (
                      <UserOutlined />
                    )
                  }
                  className="bg-gray-200 mb-2"
                />
                <span className="font-medium text-gray-600">
                  Bạn và {getPartnerDisplayInfo(activeRoom).name}
                </span>
              </div>

              {loadingMessages ? (
                <div className="text-center py-10">
                  <Spin description="Đang đồng bộ..." />
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUser.id;
                  const isConsecutive =
                    idx > 0 && messages[idx - 1].senderId === msg.senderId;
                  const partnerInfo = getPartnerDisplayInfo(activeRoom);

                  return (
                    <div
                      key={idx}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} ${isConsecutive ? "mt-0" : "mt-3"}`}
                    >
                      {!isMe && !isConsecutive && (
                        <Avatar
                          size="small"
                          src={
                            partnerInfo.avatar ? `${partnerInfo.avatar}` : null
                          }
                          icon={partnerInfo.avatar ? null : <UserOutlined />}
                          className="bg-gray-300 mr-2 self-end mb-1"
                        />
                      )}
                      {!isMe && isConsecutive && (
                        <div className="w-6 mr-2"></div>
                      )}

                      <div className={`relative max-w-[65%] group`}>
                        {msg.type === "IMAGES" ? (
                          <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                            <img
                              src={`${backendUrl}/api${msg.messageContent}`}
                              alt="sent-img"
                              className="block max-w-[280px] max-h-[350px] w-full h-auto object-cover cursor-pointer hover:opacity-90"
                              onClick={() =>
                                window.open(
                                  `${backendUrl}/api${msg.messageContent}`,
                                  "_blank",
                                )
                              }
                            />
                          </div>
                        ) : (
                          <div
                            className={`px-4 py-2 text-[15px] ${
                              isMe
                                ? "bg-[#0084ff] text-white rounded-2xl rounded-tr-sm"
                                : "bg-[#e4e6eb] text-black rounded-2xl rounded-tl-sm"
                            }`}
                            style={{ wordBreak: "break-word" }}
                          >
                            {msg.messageContent}
                          </div>
                        )}

                        <div
                          className={`text-[10px] mt-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity absolute ${isMe ? "right-1" : "left-1"}`}
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

            {/* THANH NHẬP TIN NHẮN (Đã xóa mặt cười) */}
            <div className="p-4 bg-white flex items-center gap-2 border-t border-gray-100">
              <Upload
                customRequest={handleImageUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button
                  type="text"
                  shape="circle"
                  icon={
                    <PictureOutlined className="text-[20px] text-blue-500" />
                  }
                />
              </Upload>

              <div className="flex-1 bg-[#f0f2f5] rounded-full flex items-center px-4 py-1.5">
                <Input
                  variant="borderless"
                  placeholder="Nhập tin nhắn..."
                  className="bg-transparent shadow-none"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onPressEnter={handleSendMessage}
                />
              </div>

              {inputText.trim() ? (
                <Button
                  type="text"
                  shape="circle"
                  onClick={handleSendMessage}
                  icon={<SendOutlined className="text-xl text-blue-600" />}
                />
              ) : (
                <Button
                  type="text"
                  shape="circle"
                  icon={<SendOutlined className="text-xl text-gray-400" />}
                  disabled
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white flex-col">
            <img
              src="https://cdn-icons-png.flaticon.com/512/1041/1041916.png"
              alt="chat-icon"
              className="w-32 h-32 mb-6 opacity-80"
            />
            <Text className="text-2xl font-bold text-gray-800 tracking-tight">
              Chào mừng đến với AcneCare Chat
            </Text>
            <Text type="secondary" className="mt-2 text-[15px]">
              Gửi và nhận tin nhắn trực tiếp với Bác sĩ và Hỗ trợ viên.
            </Text>
            <Button
              type="primary"
              size="large"
              className="mt-6 bg-blue-600 rounded-full px-8 font-semibold shadow-md"
              onClick={handleChatWithAdmin}
              loading={isConnectingAdmin}
            >
              Bắt đầu chat với CSKH
            </Button>
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default ChatPage;
