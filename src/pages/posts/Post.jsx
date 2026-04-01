import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

// Import Ant Design components
import {
  Layout,
  Card,
  Button,
  Input,
  Avatar,
  Typography,
  Space,
  Divider,
  Modal,
  Image,
  Empty,
  message as antdMessage,
  Spin,
} from "antd";

import {
  fetchAllPosts,
  deletePostThunk,
  toggleLikeThunk,
  createCommentThunk,
  deletePostRealtime,
  updatePostRealtime,
  updateLikesRealtime,
  updateCommentsCountRealtime,
  addImagesRealtime,
  removeImageRealtime,
  toggleLikeLocal,
} from "../../store/slice/PostSlice";

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const getCookie = (name) => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  } catch (error) {
    console.error("🚨 [Lỗi lấy Cookie]:", error);
    return null;
  }
};

const Post = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const stompClientRef = useRef(null);

  // Redux state
  const { user } = useSelector((state) => state.user);
  const {
    posts,
    isLoading,
    message: reduxMessage,
  } = useSelector((state) => state.post);

  // Local state
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  // ĐÃ THÊM: Hàm xử lý URL ảnh chuẩn xác cho môi trường thực tế
  const getImageUrl = (url) => {
    if (!url) return null;
    const baseUrl = import.meta.env.VITE_BACKEND_URL;

    // 1. Chuyển đổi IP cũ thành HTTPS mới
    if (url.includes("203.145.47.214:5173")) {
      return url.replace("http://203.145.47.214:5173", baseUrl);
    }

    // 2. Trả về nguyên bản nếu là link ngoài đã chuẩn HTTP/HTTPS
    if (url.startsWith("http")) return url;

    // 3. Xử lý đường dẫn tương đối, chống lỗi nối trùng chữ /api/api
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    if (cleanUrl.startsWith("/api/")) {
      return `${baseUrl}${cleanUrl}`;
    }

    return `${baseUrl}/api${cleanUrl}`;
  };

  // ==========================================
  // 🐞 DEBUG: BẮT LỖI LẤY ID NGƯỜI DÙNG
  // ==========================================
  let currentUserId = null;
  try {
    try {
      const localUser = JSON.parse(localStorage.getItem("userInfo")); // Đổi "userInfo" thành key của bạn
      currentUserId = user?.id || localUser?.id;
    } catch (e) {
      currentUserId = null;
    }
    console.log("🛠 [Debug System] Giá trị user?.id từ Redux:", user?.id);
    console.log(
      "🛠 [Debug System] Giá trị từ localStorage('userId'):",
      localStorage.getItem("userId"),
    );
    console.log(
      "🛠 [Debug System] currentUserId chốt lại đang dùng là:",
      currentUserId,
      "| Kiểu dữ liệu:",
      typeof currentUserId,
    );
  } catch (error) {
    console.error("🚨 [Lỗi] Không thể lấy currentUserId:", error);
  }

  // 1. FETCH DATA
  const handleGetAllPosts = async () => {
    try {
      await dispatch(fetchAllPosts()).unwrap();
    } catch (error) {
      antdMessage.error("Không thể tải bài viết: " + error);
    }
  };

  useEffect(() => {
    handleGetAllPosts();
  }, []);

  const postIdsString = posts.map((p) => p.id).join(",");
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:9090";

  // 2. WEBSOCKET
  useEffect(() => {
    if (!postIdsString) return;

    try {
      const currentToken = getCookie("accessToken");
      if (!currentToken) {
        console.warn(
          "⚠️ [Cảnh báo WS] Không tìm thấy accessToken trong Cookie!",
        );
      }

      const client = new Client({
        webSocketFactory: () => new SockJS(`${backendUrl}/api/ws`),
        connectHeaders: currentToken
          ? { Authorization: `Bearer ${currentToken}` }
          : {},
        reconnectDelay: 5000,
        onConnect: () => {
          console.log("✅ [WebSocket] Đã kết nối thành công!");
          client.subscribe("/topic/posts/delete", (msg) =>
            dispatch(deletePostRealtime(msg.body)),
          );
          client.subscribe("/topic/posts/update", (msg) =>
            dispatch(updatePostRealtime(JSON.parse(msg.body))),
          );
          postIdsString.split(",").forEach((postId) => {
            client.subscribe(`/topic/posts/${postId}/likes`, (msg) => {
              dispatch(
                updateLikesRealtime({
                  postId,
                  isActionLike: JSON.parse(msg.body),
                }),
              );
            });
            client.subscribe(`/topic/posts/${postId}/comments`, () => {
              dispatch(updateCommentsCountRealtime({ postId, type: "add" }));
            });
            client.subscribe(`/topic/posts/${postId}/comments/delete`, () => {
              dispatch(updateCommentsCountRealtime({ postId, type: "delete" }));
            });
            client.subscribe(`/topic/posts/${postId}/images/upload`, (msg) => {
              dispatch(
                addImagesRealtime({ postId, newImages: JSON.parse(msg.body) }),
              );
            });
            client.subscribe(`/topic/posts/${postId}/images/delete`, (msg) => {
              dispatch(removeImageRealtime({ postId, imageId: msg.body }));
            });
          });
        },
        onStompError: (frame) => {
          console.error("🚨 [Lỗi WebSocket STOMP]:", frame);
        },
      });
      client.activate();
      stompClientRef.current = client;
    } catch (error) {
      console.error("🚨 [Lỗi Khởi tạo WebSocket]:", error);
    }

    return () => stompClientRef.current?.deactivate();
  }, [postIdsString, dispatch, backendUrl]);

  // 3. HANDLERS (Giữ nguyên không đổi)
  const handleToggleLike = async (postId, currentIsLiked) => {
    dispatch(toggleLikeLocal({ postId, isLiked: !currentIsLiked }));
    try {
      await dispatch(toggleLikeThunk(postId)).unwrap();
    } catch (error) {
      dispatch(toggleLikeLocal({ postId, isLiked: currentIsLiked }));
      antdMessage.error("Lỗi tương tác");
    }
  };

  const handleCommentSubmit = async (postId) => {
    if (!commentText.trim()) return;
    setIsCommenting(true);
    try {
      await dispatch(
        createCommentThunk({
          postId,
          data: { commentContent: commentText.trim() },
        }),
      ).unwrap();
      setCommentText("");
      setActiveCommentPostId(null);
      antdMessage.success("Đã đăng bình luận");
    } catch (error) {
      antdMessage.error("Lỗi bình luận");
    } finally {
      setIsCommenting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await dispatch(
        deletePostThunk({ userId: currentUserId, postId: postToDelete }),
      ).unwrap();
      antdMessage.success("Đã xóa bài viết");
    } catch (error) {
      antdMessage.error("Lỗi khi xóa");
    } finally {
      setIsDeleteModalOpen(false);
      setPostToDelete(null);
    }
  };

  return (
    <Layout className="min-h-screen bg-slate-50">
      <Header className="bg-white border-b px-4 sticky top-0 z-50 flex items-center justify-center h-16 shadow-sm">
        <div className="max-w-2xl w-full flex justify-between items-center">
          <Title level={4} className="m-0 text-blue-600 tracking-tight">
            CỘNG ĐỒNG
          </Title>
          <Space>
            <Button type="text" onClick={handleGetAllPosts} loading={isLoading}>
              Làm mới
            </Button>
            <Button
              type="primary"
              className="bg-blue-600 hover:bg-blue-700 font-bold px-6"
              onClick={() => navigate("/createpost")}
            >
              Tạo bài viết
            </Button>
          </Space>
        </div>
      </Header>

      <Content className="p-4 flex flex-col items-center">
        <div className="max-w-2xl w-full">
          {reduxMessage && !isLoading && (
            <Card className="mb-4 bg-blue-50 border-blue-100 py-0 text-center">
              <Text strong className="text-blue-700">
                {reduxMessage}
              </Text>
            </Card>
          )}

          <Spin
            spinning={isLoading && posts.length === 0}
            tip="Đang tải dữ liệu..."
          >
            <div className="space-y-6">
              {posts.length > 0
                ? posts.map((post) => {
                    // ==========================================
                    // 🐞 DEBUG: KIỂM TRA TỪNG BÀI VIẾT
                    // ==========================================
                    let isOwner = false;
                    try {
                      console.log(
                        `\n🔍 [Debug] Đang kiểm tra bài viết ID: ${post.id}`,
                      );
                      console.log(
                        `   👉 ID người đăng bài này (post.user?.id):`,
                        post.user?.id,
                        "| Kiểu:",
                        typeof post.user?.id,
                      );
                      console.log(
                        `   👉 ID của bạn (currentUserId):`,
                        currentUserId,
                        "| Kiểu:",
                        typeof currentUserId,
                      );

                      isOwner = Boolean(
                        currentUserId &&
                        post.user?.id &&
                        String(currentUserId) === String(post.user?.id),
                      );

                      console.log(`   ✅ Kết quả isOwner:`, isOwner);
                    } catch (error) {
                      console.error(
                        `🚨 [Lỗi] Quá trình kiểm tra Owner bị lỗi ở bài viết ${post.id}:`,
                        error,
                      );
                    }

                    const hasLiked = post.liked || post.isLiked;

                    return (
                      <Card
                        key={post.id}
                        className="shadow-sm border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                        bodyStyle={{ padding: "16px" }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <Space align="center" size={12}>
                            <Avatar
                              size={44}
                              className="bg-blue-100 text-blue-700 font-bold border-none"
                            >
                              {post.user?.name?.charAt(0).toUpperCase() || "U"}
                            </Avatar>
                            <div className="flex flex-col">
                              <Text
                                strong
                                className="text-slate-800 text-base leading-tight"
                              >
                                {post.user?.name || "Người dùng"}
                              </Text>
                              <Text type="secondary" className="text-xs">
                                {post.createdAt
                                  ? new Date(post.createdAt).toLocaleString(
                                      "vi-VN",
                                    )
                                  : "Vừa xong"}
                              </Text>
                            </div>
                          </Space>

                          {isOwner && (
                            <Space>
                              <Button
                                type="link"
                                size="small"
                                onClick={() => navigate(`/editpost/${post.id}`)}
                              >
                                Sửa
                              </Button>
                              <Button
                                type="link"
                                danger
                                size="small"
                                onClick={() => {
                                  setPostToDelete(post.id);
                                  setIsDeleteModalOpen(true);
                                }}
                              >
                                Xóa
                              </Button>
                            </Space>
                          )}
                        </div>

                        {/* Các phần render khác giữ nguyên */}
                        <div className="mb-4">
                          <Title
                            level={5}
                            className="mt-0 mb-1 font-bold text-slate-800"
                          >
                            {post.postTitle}
                          </Title>
                          <Paragraph className="text-slate-600 text-[15px] leading-relaxed mb-0">
                            {post.postContent}
                          </Paragraph>
                        </div>

                        {post.postsImage?.length > 0 && (
                          <div
                            className={`grid gap-1 mb-4 rounded-lg overflow-hidden border border-slate-100 ${post.postsImage.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                          >
                            <Image.PreviewGroup>
                              {post.postsImage.map((img, idx) => (
                                <Image
                                  key={idx}
                                  // ĐÃ SỬA: Bọc hàm getImageUrl
                                  src={getImageUrl(img.imageUrl)}
                                  className="w-full h-64 object-cover"
                                  alt="Post visual"
                                />
                              ))}
                            </Image.PreviewGroup>
                          </div>
                        )}

                        <Divider className="my-3" />

                        <div className="flex justify-between items-center">
                          <Space size={24}>
                            <Text
                              strong
                              className={`cursor-pointer transition-colors text-sm px-2 py-1 rounded-md ${hasLiked ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:text-blue-600 hover:bg-slate-50"}`}
                              onClick={() =>
                                handleToggleLike(post.id, hasLiked)
                              }
                            >
                              {post.likesCount}{" "}
                              {hasLiked ? "Đã thích" : "Thích"}
                            </Text>
                            <Text
                              strong
                              className="cursor-pointer text-slate-500 hover:text-blue-600 hover:bg-slate-50 px-2 py-1 rounded-md text-sm transition-colors"
                              onClick={() =>
                                setActiveCommentPostId(
                                  activeCommentPostId === post.id
                                    ? null
                                    : post.id,
                                )
                              }
                            >
                              Bình luận
                            </Text>
                          </Space>
                          <Button
                            type="text"
                            size="small"
                            onClick={() => navigate(`/posts/${post.id}`)}
                            className="text-slate-400"
                          >
                            {post.commentsCount} phản hồi
                          </Button>
                        </div>

                        {activeCommentPostId === post.id && (
                          <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
                            <Input
                              placeholder="Viết cảm nghĩ của bạn..."
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onPressEnter={() => handleCommentSubmit(post.id)}
                              className="rounded-full bg-slate-100 border-none focus:bg-white"
                            />
                            <Button
                              type="primary"
                              shape="round"
                              loading={isCommenting}
                              onClick={() => handleCommentSubmit(post.id)}
                              className="bg-blue-600"
                            >
                              Gửi
                            </Button>
                          </div>
                        )}
                      </Card>
                    );
                  })
                : !isLoading && (
                    <Empty
                      description="Hiện chưa có bài viết nào"
                      className="bg-white p-12 rounded-xl border border-dashed"
                    />
                  )}
            </div>
          </Spin>
        </div>
      </Content>

      <Modal
        title={
          <Text strong className="text-lg">
            Xác nhận xóa bài viết
          </Text>
        }
        open={isDeleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Xóa bài"
        cancelText="Hủy"
        okButtonProps={{
          danger: true,
          type: "primary",
          className: "font-bold",
        }}
        cancelButtonProps={{ type: "text" }}
        centered
        width={350}
      >
        <Text type="secondary">
          Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể
          hoàn tác.
        </Text>
      </Modal>
    </Layout>
  );
};

export default Post;
