import React, { useState, useEffect } from "react";
import { postService } from "../../services/PostService";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";

const Post = () => {
  const [message, setMessage] = useState("");
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);

  let currentUserId = user?.id;
  if (!currentUserId) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        currentUserId = decoded.sub;
      } catch (err) {
        console.error("Lỗi giải mã token:", err);
      }
    }
  }

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const handleGetAllPosts = async () => {
    try {
      setIsLoading(true);
      setMessage("Đang tải danh sách bài viết...");
      const res = await postService.getAllPosts();

      const postData = res.data?.result || res.result || [];
      setPosts(postData);

      setMessage("");
    } catch (error) {
      setMessage("Lỗi: " + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGetAllPosts();
  }, []);

  const handleToggleLike = async (
    postId,
    currentIsLiked,
    currentLikesCount,
  ) => {
    // 1. Cập nhật giao diện ngay lập tức
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            liked: !currentIsLiked,
            isLiked: !currentIsLiked,
            likesCount: currentIsLiked
              ? Math.max(0, post.likesCount - 1)
              : post.likesCount + 1,
          };
        }
        return post;
      }),
    );

    // 2. Gọi API xử lý dưới nền
    try {
      await postService.toggleLikePost(postId);
    } catch (error) {
      // Hoàn tác nếu lỗi
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              liked: currentIsLiked,
              isLiked: currentIsLiked,
              likesCount: currentLikesCount,
            };
          }
          return post;
        }),
      );
      setMessage(
        "Lỗi khi tương tác bài viết: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handleDeleteClick = (postId) => {
    setPostToDelete(postId);
    setIsDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setPostToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!postToDelete || !currentUserId) return;

    try {
      setIsLoading(true);
      setMessage("Đang xóa bài viết...");

      await postService.deletePost(currentUserId, postToDelete);

      setPosts(posts.filter((post) => post.id !== postToDelete));
      setMessage("Đã xóa bài viết thành công.");
    } catch (error) {
      setMessage(
        "Lỗi khi xóa bài viết: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setPostToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Không rõ thời gian";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  const toggleCommentInput = (postId) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      setCommentText("");
    } else {
      setActiveCommentPostId(postId);
      setCommentText("");
    }
  };

  const handleCommentSubmit = async (postId) => {
    if (!commentText.trim()) {
      setMessage("Vui lòng nhập nội dung bình luận.");
      return;
    }

    if (commentText.length > 100) {
      setMessage("Bình luận không được vượt quá 100 ký tự.");
      return;
    }

    try {
      setIsCommenting(true);

      const requestData = {
        commentContent: commentText.trim(),
      };

      await postService.createComment(postId, requestData);

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              commentsCount: (post.commentsCount || 0) + 1,
            };
          }
          return post;
        }),
      );

      setMessage("Đã thêm bình luận thành công.");
      setActiveCommentPostId(null);
      setCommentText("");
    } catch (error) {
      setMessage(
        "Lỗi khi bình luận: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-gray-100 min-h-screen relative">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
        Bảng Tin Cộng Đồng
      </h1>

      <div className="mb-6 relative flex items-center justify-center">
        <button
          onClick={handleGetAllPosts}
          disabled={isLoading}
          className={`px-6 py-2 rounded font-bold text-white transition-colors ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isLoading ? "Đang tải..." : "Tải Lại Bài Viết"}
        </button>

        <button
          onClick={() => navigate("/createpost")}
          title="Tạo một bài post mới"
          className="absolute right-0 w-12 h-12 bg-green-500 hover:bg-green-600 text-white font-bold text-2xl rounded-full shadow-md transition-colors flex items-center justify-center pb-1"
        >
          +
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-md font-medium text-center">
          {message}
        </div>
      )}

      <div className="space-y-6">
        {posts.length > 0
          ? posts.map((post) => {
              // XỬ LÝ ĐỌC TRẠNG THÁI LIKE TỪ BACKEND
              const hasLiked = post.liked === true || post.isLiked === true;

              return (
                <div
                  key={post.id}
                  className="bg-white p-5 rounded-lg shadow border"
                >
                  <div className="border-b pb-3 mb-3 flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {post.postTitle}
                      </h2>
                      <div className="text-sm text-gray-500 mt-1">
                        Đăng bởi:{" "}
                        <span className="font-semibold text-gray-700">
                          {post.user?.name || "Người dùng ẩn danh"}
                        </span>
                        <span className="mx-2">-</span>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>

                    {currentUserId &&
                      post.user &&
                      currentUserId === post.user.id && (
                        <div className="flex gap-3 ml-4">
                          <button
                            onClick={() => navigate(`/editpost/${post.id}`)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteClick(post.id)}
                            className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                  </div>

                  <div className="mb-4 text-gray-700 whitespace-pre-wrap">
                    {post.postContent}
                  </div>

                  {post.postsImage && post.postsImage.length > 0 && (
                    <div
                      className={`grid gap-2 mb-4 ${
                        post.postsImage.length === 1
                          ? "grid-cols-1"
                          : "grid-cols-2"
                      }`}
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

                  <div className="flex justify-between items-center text-sm border-t pt-3 mt-2">
                    <div
                      className={`cursor-pointer transition-colors px-2 py-1 rounded-md ${
                        hasLiked
                          ? "text-blue-600 font-bold bg-blue-50"
                          : "text-gray-600 font-medium hover:text-blue-500 hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        handleToggleLike(post.id, hasLiked, post.likesCount)
                      }
                    >
                      <span className="mr-1">{post.likesCount}</span>
                      {hasLiked ? "Đã thích" : "Thích"}
                    </div>

                    <div
                      className="cursor-pointer text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-2 py-1 rounded-md transition-colors font-medium"
                      onClick={() => toggleCommentInput(post.id)}
                    >
                      Viết bình luận
                    </div>

                    <div
                      className="cursor-pointer text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-2 py-1 rounded-md transition-colors font-medium"
                      onClick={() => navigate(`/posts/${post.id}`)}
                    >
                      <span className="mr-1">{post.commentsCount}</span>
                      Xem bình luận
                    </div>
                  </div>

                  {activeCommentPostId === post.id && (
                    <div className="mt-4 flex gap-2 items-start border-t pt-3">
                      <div className="flex-grow flex flex-col">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Nhập bình luận của bạn..."
                          maxLength={100}
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm resize-none h-12"
                        />
                        <span className="text-xs text-gray-400 mt-1 text-right">
                          {commentText.length}/100
                        </span>
                      </div>
                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        disabled={isCommenting || !commentText.trim()}
                        className={`px-4 py-2 text-sm font-bold text-white rounded transition-colors h-10 ${
                          isCommenting || !commentText.trim()
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {isCommenting ? "Đang gửi..." : "Gửi"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          : !isLoading && (
              <div className="text-center text-gray-500 py-10 bg-white rounded border">
                Chưa có bài viết nào để hiển thị.
              </div>
            )}
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Xác nhận xóa
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không
              thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded hover:bg-gray-300 transition-colors"
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Đang xử lý..." : "Xóa bài"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
