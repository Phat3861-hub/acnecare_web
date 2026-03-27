import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { postService } from "../../services/PostService";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const PostComment = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const stompClientRef = useRef(null);

  // Lấy ID người dùng hiện tại để kiểm tra quyền Sửa/Xóa
  const { user } = useSelector((state) => state.user);
  let currentUserId = user?.id;

  // Lấy token dùng chung cho cả việc lấy User ID và cấu hình Socket
  const token = localStorage.getItem("accessToken");
  if (!currentUserId && token) {
    try {
      currentUserId = jwtDecode(token).sub;
    } catch (err) {}
  }

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  // States dành cho việc Sửa bình luận
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");

  // 1. TẢI DỮ LIỆU BÀI VIẾT BAN ĐẦU
  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        setIsLoading(true);
        const res = await postService.getPostById(postId);
        setPost(res.data?.result || res.result);
      } catch (error) {
        setMessage(
          "Lỗi tải chi tiết bài viết: " +
            (error.response?.data?.message || error.message),
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchPostDetails();
    }
  }, [postId]);

  // 2. THIẾT LẬP KẾT NỐI WEBSOCKET (REAL-TIME)
  useEffect(() => {
    if (!postId) return;

    const currentToken = localStorage.getItem("accessToken");

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/api/ws"),
      connectHeaders: {
        Authorization: `Bearer ${currentToken}`,
      },
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Connected to WebSocket");

        // --- Lắng nghe Thêm Bình Luận ---
        client.subscribe(`/topic/posts/${postId}/comments`, (message) => {
          const newComment = JSON.parse(message.body);

          setPost((prev) => {
            if (!prev) return prev;
            // Kiểm tra tránh thêm trùng lặp bình luận (nếu user tự gửi)
            const exists = prev.comments?.some((c) => c.id === newComment.id);
            if (exists) return prev;

            return {
              ...prev,
              comments: [newComment, ...(prev.comments || [])],
              commentsCount: (prev.commentsCount || 0) + 1,
            };
          });
        });

        // --- Lắng nghe Cập Nhật Bình Luận ---
        client.subscribe(
          `/topic/posts/${postId}/comments/update`,
          (message) => {
            const updatedComment = JSON.parse(message.body);

            setPost((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                comments: prev.comments.map((c) =>
                  c.id === updatedComment.id ? updatedComment : c,
                ),
              };
            });
          },
        );

        // --- Lắng nghe Xóa Bình Luận ---
        client.subscribe(
          `/topic/posts/${postId}/comments/delete`,
          (message) => {
            const deletedCommentId = message.body; // Bên Java bắn ra String commentId

            setPost((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                comments: prev.comments.filter(
                  (c) => c.id !== deletedCommentId,
                ),
                commentsCount: Math.max(0, (prev.commentsCount || 0) - 1),
              };
            });
          },
        );

        // --- Lắng nghe Thay Đổi Lượt Thích ---
        client.subscribe(`/topic/posts/${postId}/likes`, (message) => {
          const isLiked = JSON.parse(message.body);

          setPost((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              likesCount: isLiked
                ? (prev.likesCount || 0) + 1
                : Math.max(0, (prev.likesCount || 0) - 1),
            };
          });
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
      },
    });

    client.activate();
    stompClientRef.current = client;

    // Cleanup: Ngắt kết nối socket khi rời khỏi component bài viết này
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [postId]);

  const formatDate = (dateString) => {
    if (!dateString) return "Không rõ thời gian";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  const getFullName = (firstName, lastName) => {
    if (!firstName && !lastName) return "Người dùng ẩn danh";
    return `${firstName || ""} ${lastName || ""}`.trim();
  };

  // --- XỬ LÝ XÓA BÌNH LUẬN ---
  const handleDeleteComment = async (commentId) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa bình luận này không?",
    );
    if (!confirmDelete) return;

    try {
      setIsProcessing(true);
      // Gọi API xóa theo đường dẫn mới có chứa postId
      await postService.deleteComment(postId, commentId);

      // Ghi chú: Không cần setPost ở đây nữa vì WebSocket
      // lắng nghe topic /delete sẽ tự động cập nhật UI cho bạn và mọi người
    } catch (error) {
      alert(
        "Lỗi khi xóa bình luận: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // --- XỬ LÝ SỬA BÌNH LUẬN ---
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
      alert("Nội dung bình luận không được để trống.");
      return;
    }
    if (editContent.length > 100) {
      alert("Bình luận không được vượt quá 100 ký tự.");
      return;
    }

    try {
      setIsProcessing(true);
      const requestData = { commentContent: editContent.trim() };

      // Gọi API sửa theo đường dẫn mới có chứa postId
      await postService.updateComment(postId, commentId, requestData);

      // Ghi chú: Không cần setPost ở đây nữa vì WebSocket
      // lắng nghe topic /update sẽ tự động cập nhật UI cho bạn và mọi người

      setEditingCommentId(null);
    } catch (error) {
      alert(
        "Lỗi khi cập nhật bình luận: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center mt-20 font-medium text-gray-600">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (message || !post) {
    return (
      <div className="text-center mt-20 text-red-500">
        {message || "Không tìm thấy bài viết."}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 bg-gray-100 min-h-screen relative">
      {/* Khóa màn hình nếu đang gửi API sửa/xóa để tránh double-click */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white bg-opacity-50 z-10 flex items-center justify-center">
          <span className="font-bold text-gray-600">Đang xử lý...</span>
        </div>
      )}

      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-medium transition-colors"
      >
        Quay lại bảng tin
      </button>

      {/* Phần chi tiết bài viết */}
      <div className="bg-white p-5 rounded-lg shadow border mb-6">
        <div className="border-b pb-3 mb-3">
          <h2 className="text-xl font-bold text-gray-800">{post.postTitle}</h2>
          <div className="text-sm text-gray-500 mt-1">
            Đăng bởi:{" "}
            <span className="font-semibold text-gray-700">
              {post.user?.name || post.user?.username || "Người dùng ẩn danh"}
            </span>
            <span className="mx-2">-</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
        </div>

        <div className="mb-4 text-gray-700 whitespace-pre-wrap">
          {post.postContent}
        </div>

        {post.postsImage && post.postsImage.length > 0 && (
          <div
            className={`grid gap-2 mb-4 ${post.postsImage.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
          >
            {post.postsImage.map((img, index) => (
              <img
                key={index}
                src={img.imageUrl}
                alt="Post content"
                className="w-full h-auto object-cover rounded max-h-80 border"
              />
            ))}
          </div>
        )}

        <div className="flex justify-between items-center text-gray-600 text-sm border-t pt-3 mt-2">
          <div>
            <span className="font-semibold">{post.likesCount}</span> Lượt thích
          </div>
          <div>
            <span className="font-semibold">{post.commentsCount}</span> Bình
            luận
          </div>
        </div>
      </div>

      {/* Phần danh sách bình luận */}
      <div className="bg-white p-5 rounded-lg shadow border">
        <h3 className="text-lg font-bold border-b pb-2 mb-4 text-blue-600">
          Tất cả bình luận ({post.comments?.length || 0})
        </h3>

        {post.comments && post.comments.length > 0 ? (
          <div className="space-y-4">
            {post.comments.map((comment) => {
              const fullName = getFullName(comment.firstName, comment.lastName);

              const commentOwnerId = comment.userId || comment.user?.id;
              const isOwner = currentUserId && commentOwnerId === currentUserId;

              return (
                <div
                  key={comment.id}
                  className="bg-gray-50 p-3 rounded border flex gap-3"
                >
                  <div className="flex-shrink-0">
                    {comment.avatarUrl ? (
                      <img
                        src={comment.avatarUrl}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover border border-gray-300"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-800">
                        {fullName}
                      </span>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createAt || comment.createdAt)}
                        </span>

                        {isOwner && editingCommentId !== comment.id && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStartEdit(comment)}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="mt-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          maxLength={100}
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm resize-y"
                          rows="2"
                        />
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-400">
                            {editContent.length}/100
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSaveEdit(comment.id)}
                              disabled={!editContent.trim()}
                              className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                            >
                              Lưu
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 text-sm mt-1">
                        {comment.commentContent}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-6 bg-gray-50 rounded border border-dashed">
            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
          </div>
        )}
      </div>
    </div>
  );
};

export default PostComment;
