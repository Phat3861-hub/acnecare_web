import { http } from "../api/config";

export const postService = {
  // Lấy tất cả bài viết
  getAllPosts: () => http.get(`/posts`),

  // Lấy danh sách bài viết theo User ID
  getPostsByUserId: (userId) => http.get(`/posts/users/${userId}`),

  // Lấy chi tiết một bài viết theo Post ID
  getPostById: (postId) => http.get(`/posts/${postId}`),

  // Tạo bài viết mới
  createPost: (userId, data) => http.post(`/posts/${userId}`, data),

  // Cập nhật bài viết
  updatePost: (userId, postId, data) =>
    http.put(`/posts/update/${userId}/${postId}`, data),

  // Xóa bài viết
  deletePost: (userId, postId) =>
    http.delete(`/posts/delete/${userId}/${postId}`),

  // ==========================================
  // POST IMAGES (Ảnh bài viết) - Lấy từ PostsImageController
  // ==========================================

  // Xoá ảnh bài post
  deletePostImage: (postId, imageId) =>
    http.delete(`/posts/${postId}/images/${imageId}`),

  // Tải ảnh cho bài viết (hỗ trợ nhiều ảnh)
  uploadPostImages: (postId, files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file); // Tên field phải là "files" để khớp với @RequestParam ở backend
    });

    return http.post(`/posts/${postId}/images`, formData, {
      headers: {
        // Axios sẽ tự động set Content-Type là multipart/form-data khi gửi FormData,
        // nhưng khai báo rõ ràng ở đây cũng là một best practice tốt.
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Lấy danh sách ảnh của một bài viết
  getImagesByPost: (postId) => http.get(`/posts/${postId}/images`),

  // ==========================================
  // COMMENTS (Bình luận) - Lấy từ CommentController
  // ==========================================

  // Lấy tất cả bình luận của một bài viết
  getAllComments: (postId) => http.get(`/posts/${postId}/comments`),

  // Thêm bình luận mới vào bài viết
  createComment: (postId, data) => http.post(`/posts/${postId}/comments`, data),

  // Cập nhật bình luận
  updateComment: (commentId, data) =>
    http.put(`/posts/comments/${commentId}`, data),

  // Xóa bình luận
  deleteComment: (commentId) => http.delete(`/posts/comments/${commentId}`),

  // ==========================================
  // LIKES (Lượt thích) - Lấy từ LikeController
  // ==========================================

  // Thích hoặc Bỏ thích bài viết (Toggle Like)
  toggleLikePost: (postId) => http.post(`/posts/${postId}/likes`),
};
