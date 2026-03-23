import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { postService } from "../../services/PostService";

const PostComment = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  // Lấy ID người dùng hiện tại để kiểm tra quyền Sửa/Xóa
  const { user } = useSelector((state) => state.user);
  let currentUserId = user?.id;
  if (!currentUserId) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        currentUserId = jwtDecode(token).sub;
      } catch (err) {}
    }
  }

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");

  // States dành cho việc Sửa bình luận
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");

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
      await postService.deleteComment(commentId);

      // Loại bỏ bình luận khỏi danh sách hiển thị
      setPost((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c.id !== commentId),
        commentsCount: Math.max(0, prev.commentsCount - 1),
      }));
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

      await postService.updateComment(commentId, requestData);

      // Cập nhật lại nội dung trên giao diện
      setPost((prev) => ({
        ...prev,
        comments: prev.comments.map((c) =>
          c.id === commentId ? { ...c, commentContent: editContent.trim() } : c,
        ),
      }));
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

              // Kiểm tra xem bình luận này có phải của User đang đăng nhập không
              // Phụ thuộc vào Backend trả về ID ở dạng comment.userId hay comment.user.id
              const commentOwnerId = comment.userId || comment.user?.id;
              const isOwner = currentUserId && commentOwnerId === currentUserId;

              return (
                <div
                  key={comment.id}
                  className="bg-gray-50 p-3 rounded border flex gap-3"
                >
                  {/* Khối hiển thị Avatar */}
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

                  {/* Khối hiển thị Nội dung bình luận */}
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-gray-800">
                        {fullName}
                      </span>

                      {/* Khu vực chứa Ngày tháng và nút Sửa/Xóa */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createAt || comment.createdAt)}
                        </span>

                        {/* Chỉ hiện nút khi bình luận là của người dùng */}
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

                    {/* Kiểm tra nếu đang ở chế độ Sửa của bình luận này */}
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
