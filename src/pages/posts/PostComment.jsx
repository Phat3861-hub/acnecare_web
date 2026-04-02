import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { postService } from "../../services/PostService";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

import {
  Layout,
  Card,
  Button,
  Typography,
  Space,
  Avatar,
  Divider,
  Input,
  Image,
  Modal,
  message as antdMessage,
  Spin,
  Empty,
} from "antd";

import {
  updateCommentThunk,
  deleteCommentThunk,
} from "../../store/slice/PostSlice";

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Thêm hàm lấy cookie để lấy token
const getCookie = (name) => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  } catch (error) {
    return null;
  }
};

const PostComment = () => {
  const { id: postId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const stompClientRef = useRef(null);

  const { user } = useSelector((state) => state.user);

  let currentUserId = user?.id;
  let currentUserRole = user?.role;

  if (!currentUserId || !currentUserRole) {
    const userInfoStr = localStorage.getItem("userInfo");
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        currentUserId = currentUserId || userInfo.id;
        currentUserRole = currentUserRole || userInfo.role;
      } catch (err) {
        console.error("Lỗi parse userInfo:", err);
      }
    }
  }

  const getBaseRoute = () => {
    if (currentUserRole === "ADMIN") return "/admin";
    if (currentUserRole === "DOCTOR") return "/doctor";
    if (currentUserRole === "BRAND") return "/brand";
    return "";
  };
  const baseRoute = getBaseRoute();

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageError, setPageError] = useState("");

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const getImageUrl = (url) => {
    if (!url) return null;
    const baseUrl = import.meta.env.VITE_BACKEND_URL;
    if (url.startsWith("http")) {
      if (
        url.includes("203.145.47.214") ||
        url.includes("https://acnecare.io.vn/api/")
      ) {
        const parts = url.split("/api/");
        const path = "/api/" + parts[parts.length - 1];
        return `${baseUrl}${path}`;
      }
      return url;
    }
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    if (cleanPath.startsWith("/api/")) return `${baseUrl}${cleanPath}`;
    return `${baseUrl}/api${cleanPath}`;
  };

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        setIsLoading(true);
        const res = await postService.getPostById(postId);
        setPost(res.data?.result || res.result);
      } catch (error) {
        setPageError(
          "Lỗi tải chi tiết bài viết: " +
            (error.response?.data?.message || error.message),
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) fetchPostDetails();
  }, [postId]);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    if (!postId) return;

    // Lấy Token để xác thực qua WebSocket
    const currentToken = getCookie("accessToken");

    const client = new Client({
      webSocketFactory: () => new SockJS(`${backendUrl}/api/ws`),
      connectHeaders: currentToken
        ? { Authorization: `Bearer ${currentToken}` }
        : {}, // Quan trọng: Auth Header
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/posts/${postId}/comments`, (msg) => {
          const newComment = JSON.parse(msg.body);
          setPost((prev) => {
            if (!prev) return prev;
            if (prev.comments?.some((c) => c.id === newComment.id)) return prev;
            return {
              ...prev,
              comments: [newComment, ...(prev.comments || [])],
              commentsCount: (prev.commentsCount || 0) + 1,
            };
          });
        });

        client.subscribe(`/topic/posts/${postId}/comments/update`, (msg) => {
          const updatedComment = JSON.parse(msg.body);
          setPost((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              comments: prev.comments.map((c) =>
                c.id === updatedComment.id ? updatedComment : c,
              ),
            };
          });
        });

        client.subscribe(`/topic/posts/${postId}/comments/delete`, (msg) => {
          const deletedCommentId = msg.body;
          setPost((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              comments: prev.comments.filter((c) => c.id !== deletedCommentId),
              commentsCount: Math.max(0, (prev.commentsCount || 0) - 1),
            };
          });
        });

        client.subscribe(`/topic/posts/${postId}/likes`, (msg) => {
          const payload = JSON.parse(msg.body);

          setPost((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              likesCount: payload.likesCount,
            };
          });
        });
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => stompClientRef.current?.deactivate();
  }, [postId, backendUrl]);

  const formatDate = (dateString) => {
    if (!dateString) return "Không rõ thời gian";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getFullName = (firstName, lastName) => {
    if (!firstName && !lastName) return "Người dùng ẩn danh";
    return `${firstName || ""} ${lastName || ""}`.trim();
  };

  const handleDeleteComment = (commentId) => {
    Modal.confirm({
      title: (
        <Text strong className="text-lg">
          Xác nhận xóa
        </Text>
      ),
      content: "Bạn có chắc chắn muốn xóa bình luận này không?",
      okText: "Xóa bình luận",
      cancelText: "Hủy",
      okType: "danger",
      icon: null,
      centered: true,
      onOk: async () => {
        try {
          setIsProcessing(true);
          await dispatch(deleteCommentThunk({ postId, commentId })).unwrap();
          antdMessage.success("Đã xóa bình luận.");
        } catch (error) {
          antdMessage.error("Lỗi khi xóa bình luận: " + error);
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.commentContent);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) {
      antdMessage.warning("Nội dung không được để trống.");
      return;
    }
    if (editContent.length > 100) {
      antdMessage.warning("Bình luận không được vượt quá 100 ký tự.");
      return;
    }

    try {
      setIsProcessing(true);
      await dispatch(
        updateCommentThunk({
          postId,
          commentId,
          data: { commentContent: editContent.trim() },
        }),
      ).unwrap();
      setEditingCommentId(null);
      antdMessage.success("Cập nhật thành công.");
    } catch (error) {
      antdMessage.error("Lỗi khi cập nhật: " + error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (pageError || !post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center rounded-2xl shadow-sm border-slate-200 p-6">
          <Text type="danger" strong className="text-lg block mb-4">
            {pageError || "Không tìm thấy bài viết."}
          </Text>
          <Button
            onClick={() => navigate(`${baseRoute}/posts`)}
            className="bg-blue-600 text-white border-none font-bold px-6"
          >
            Quay lại bảng tin
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <Layout className="min-h-screen bg-slate-50 py-6 px-4">
      <Content className="max-w-3xl mx-auto w-full flex flex-col gap-6 relative">
        {isProcessing && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-50 rounded-2xl flex items-center justify-center">
            <Spin tip="Đang xử lý..." />
          </div>
        )}

        <div>
          <Button
            onClick={() => navigate(-1)}
            className="bg-white border-slate-200 text-slate-600 font-medium rounded-lg hover:text-blue-600 hover:border-blue-400"
          >
            Quay lại bảng tin
          </Button>
        </div>

        <Card
          className="rounded-2xl shadow-sm border-slate-200"
          bodyStyle={{ padding: "24px" }}
        >
          <Title level={4} className="m-0 text-slate-800">
            {post.postTitle}
          </Title>
          <div className="text-sm text-slate-500 mt-2 mb-4">
            Đăng bởi:{" "}
            <Text strong className="text-slate-700">
              {post.user?.name || post.user?.username || "Người dùng ẩn danh"}
            </Text>
            <span className="mx-2">•</span>
            {formatDate(post.createdAt)}
          </div>
          <Paragraph className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap">
            {post.postContent}
          </Paragraph>

          {post.postsImage?.length > 0 && (
            <div
              className={`mt-4 grid gap-2 rounded-xl overflow-hidden border border-slate-100 ${post.postsImage.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
            >
              <Image.PreviewGroup>
                {post.postsImage.map((img, index) => (
                  <Image
                    key={index}
                    src={getImageUrl(img.imageUrl)}
                    alt="Post media"
                    className="w-full h-64 object-cover"
                  />
                ))}
              </Image.PreviewGroup>
            </div>
          )}
          <Divider className="my-4" />
          <div className="flex justify-between items-center text-slate-600 text-sm font-medium">
            <div>
              <Text strong className="text-blue-600 text-base">
                {post.likesCount}
              </Text>{" "}
              Lượt thích
            </div>
            <div>
              <Text strong className="text-blue-600 text-base">
                {post.commentsCount}
              </Text>{" "}
              Bình luận
            </div>
          </div>
        </Card>

        <Card
          className="rounded-2xl shadow-sm border-slate-200"
          bodyStyle={{ padding: "24px" }}
        >
          <Title
            level={5}
            className="m-0 mb-6 text-blue-700 pb-3 border-b border-slate-100"
          >
            Tất cả bình luận ({post.comments?.length || 0})
          </Title>

          {post.comments && post.comments.length > 0 ? (
            <div className="flex flex-col gap-5">
              {post.comments.map((comment) => {
                const fullName = getFullName(
                  comment.firstName,
                  comment.lastName,
                );
                const commentOwnerId = comment.userId || comment.user?.id;
                const isOwner =
                  currentUserId && commentOwnerId === currentUserId;
                const isEditing = editingCommentId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className="flex gap-3 items-start bg-white"
                  >
                    <Avatar
                      src={
                        comment.avatarUrl
                          ? getImageUrl(comment.avatarUrl)
                          : undefined
                      }
                      className="bg-blue-100 text-blue-600 font-bold border-none shrink-0"
                      size={40}
                    >
                      {!comment.avatarUrl && fullName.charAt(0).toUpperCase()}
                    </Avatar>

                    <div className="flex-1 bg-slate-50 p-3.5 rounded-2xl rounded-tl-none border border-slate-100">
                      <div className="flex justify-between items-start mb-1.5">
                        <Text strong className="text-slate-800">
                          {fullName}
                        </Text>
                        <Space size={16} className="ml-2">
                          <Text className="text-xs text-slate-400">
                            {formatDate(comment.createAt || comment.createdAt)}
                          </Text>
                          {isOwner && !isEditing && (
                            <Space size={8}>
                              <Button
                                type="text"
                                size="small"
                                onClick={() => handleStartEdit(comment)}
                                className="text-blue-600 font-medium px-1 h-auto text-xs"
                              >
                                Sửa
                              </Button>
                              <Button
                                type="text"
                                size="small"
                                danger
                                onClick={() => handleDeleteComment(comment.id)}
                                className="font-medium px-1 h-auto text-xs"
                              >
                                Xóa
                              </Button>
                            </Space>
                          )}
                        </Space>
                      </div>

                      {isEditing ? (
                        <div className="mt-2">
                          <TextArea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            maxLength={100}
                            showCount
                            autoSize={{ minRows: 2, maxRows: 4 }}
                            className="rounded-lg text-sm bg-white"
                          />
                          <div className="flex justify-end gap-2 mt-3">
                            <Button
                              size="small"
                              onClick={handleCancelEdit}
                              className="text-slate-600 font-medium border-none bg-slate-200 hover:bg-slate-300 rounded"
                            >
                              Hủy bỏ
                            </Button>
                            <Button
                              size="small"
                              type="primary"
                              onClick={() => handleSaveEdit(comment.id)}
                              disabled={!editContent.trim()}
                              className="bg-blue-600 font-bold rounded"
                            >
                              Lưu thay đổi
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Paragraph className="m-0 text-slate-700 text-[14px]">
                          {comment.commentContent}
                        </Paragraph>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty
              description={
                <Text className="text-slate-400 font-medium">
                  Chưa có bình luận nào. Hãy là người đầu tiên thảo luận!
                </Text>
              }
              className="my-8"
            />
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default PostComment;
