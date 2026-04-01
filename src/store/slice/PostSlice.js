import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { postService } from "../../services/PostService";

// --- Async Thunks ---

export const fetchAllPosts = createAsyncThunk(
  "post/fetchAll",
  // Nhận page và size từ UI truyền xuống, mặc định page 0, size 5
  async ({ page = 0, size = 5 } = {}, thunkAPI) => {
    try {
      const response = await postService.getAllPosts(page, size);
      return response.data.result; // Trả về PagedResponse { content, totalPages, page, ... }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  },
);

export const deletePostThunk = createAsyncThunk(
  "post/deletePost",
  async ({ userId, postId }, { rejectWithValue }) => {
    try {
      await postService.deletePost(userId, postId);
      return postId; // Trả về ID để xóa khỏi state local
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const toggleLikeThunk = createAsyncThunk(
  "post/toggleLike",
  async (postId, { rejectWithValue }) => {
    try {
      const res = await postService.toggleLikePost(postId);
      return { postId, data: res.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const createCommentThunk = createAsyncThunk(
  "post/createComment",
  async ({ postId, data }, { rejectWithValue }) => {
    try {
      const res = await postService.createComment(postId, data);
      return { postId, comment: res.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const updatePostThunk = createAsyncThunk(
  "post/updatePost",
  async ({ userId, postId, data }, { rejectWithValue }) => {
    try {
      const res = await postService.updatePost(userId, postId, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const deletePostImageThunk = createAsyncThunk(
  "post/deletePostImage",
  async ({ postId, imageId }, { rejectWithValue }) => {
    try {
      await postService.deletePostImage(postId, imageId);
      return { postId, imageId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const uploadPostImagesThunk = createAsyncThunk(
  "post/uploadPostImages",
  async ({ postId, files }, { rejectWithValue }) => {
    try {
      const res = await postService.uploadPostImages(postId, files);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const createPostThunk = createAsyncThunk(
  "post/createPost",
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      const res = await postService.createPost(userId, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const updateCommentThunk = createAsyncThunk(
  "post/updateComment",
  async ({ postId, commentId, data }, { rejectWithValue }) => {
    try {
      const res = await postService.updateComment(postId, commentId, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const deleteCommentThunk = createAsyncThunk(
  "post/deleteComment",
  async ({ postId, commentId }, { rejectWithValue }) => {
    try {
      await postService.deleteComment(postId, commentId);
      return { postId, commentId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// --- Slice ---

const postSlice = createSlice({
  name: "post",
  initialState: {
    posts: [],
    isLoading: false,
    message: "",
    totalPages: 0, // 🚨 Thêm trạng thái lưu tổng số trang để UI xử lý Infinite Loading
  },
  reducers: {
    // Các action đồng bộ dùng cho WebSocket để cập nhật UI realtime

    toggleLikeLocal: (state, action) => {
      const { postId, isLiked } = action.payload;
      const post = state.posts.find((p) => p.id === postId);
      if (post) {
        post.liked = isLiked;
        post.isLiked = isLiked;
      }
    },
    addImagesRealtime: (state, action) => {
      const { postId, newImages } = action.payload;
      const post = state.posts.find((p) => p.id === postId);
      if (post) {
        post.postsImage = [...(post.postsImage || []), ...newImages];
      }
    },
    removeImageRealtime: (state, action) => {
      const { postId, imageId } = action.payload;
      const post = state.posts.find((p) => p.id === postId);
      if (post && post.postsImage) {
        post.postsImage = post.postsImage.filter(
          (img) => img.id.toString() !== imageId.toString(),
        );
      }
    },

    setPosts: (state, action) => {
      state.posts = action.payload;
    },
    updatePostRealtime: (state, action) => {
      const updatedPost = action.payload;
      const index = state.posts.findIndex((p) => p.id === updatedPost.id);

      if (index !== -1) {
        // Lấy bài post cũ ra
        const oldPost = state.posts[index];

        // Gộp dữ liệu an toàn tuyệt đối
        state.posts[index] = {
          ...oldPost, // Rải toàn bộ thuộc tính cũ ra trước

          // CHỈ đè những trường text thực sự có thay đổi từ updatedPost
          postTitle: updatedPost.postTitle || oldPost.postTitle,
          postContent: updatedPost.postContent || oldPost.postContent,
          status: updatedPost.status || oldPost.status,
          updatedAt: updatedPost.updatedAt || oldPost.updatedAt,

          // ÉP BUỘC GIỮ NGUYÊN các thông tin không bao giờ thay đổi khi edit text
          user: oldPost.user,
          postsImage: oldPost.postsImage,

          // Các thông số đếm cũng giữ nguyên của state hiện tại
          comments: oldPost.comments,
          likesCount: oldPost.likesCount,
          commentsCount: oldPost.commentsCount,
        };
      }
    },
    deletePostRealtime: (state, action) => {
      state.posts = state.posts.filter((p) => p.id !== action.payload);
    },
    updateLikesRealtime: (state, action) => {
      const { postId, isActionLike } = action.payload;
      const post = state.posts.find((p) => p.id === postId);
      if (post) {
        post.likesCount = isActionLike
          ? (post.likesCount || 0) + 1
          : Math.max(0, (post.likesCount || 0) - 1);
      }
    },
    updateCommentsCountRealtime: (state, action) => {
      const { postId, type } = action.payload; // type: 'add' hoặc 'delete'
      const post = state.posts.find((p) => p.id === postId);
      if (post) {
        post.commentsCount =
          type === "add"
            ? (post.commentsCount || 0) + 1
            : Math.max(0, (post.commentsCount || 0) - 1);
      }
    },
    clearMessage: (state) => {
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Posts
      .addCase(fetchAllPosts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllPosts.fulfilled, (state, action) => {
        state.isLoading = false;

        // Bóc tách dữ liệu từ PagedResponse của Backend
        const { content, totalPages, page } = action.payload;

        if (page === 0) {
          // Nếu load trang 0 (chạy lần đầu hoặc F5), ghi đè lại toàn bộ state
          state.posts = content;
        } else {
          // Lọc ra các bài viết mới (để tránh bị trùng lặp ID khi Backend thêm dữ liệu song song)
          const existingPostIds = new Set(state.posts.map((post) => post.id));
          const newPosts = content.filter(
            (post) => !existingPostIds.has(post.id),
          );

          // Cộng dồn bài viết mới vào danh sách hiện tại
          state.posts = [...state.posts, ...newPosts];
        }

        // Cập nhật tổng số trang để UI nhận biết
        state.totalPages = totalPages;
      })
      .addCase(fetchAllPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.message = action.payload;
      })

      // Delete Post (Optimistic hoặc chờ API)
      .addCase(deletePostThunk.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p.id !== action.payload);
        state.message = "Đã xóa bài viết thành công.";
      })
      .addCase(deletePostThunk.rejected, (state, action) => {
        state.message = action.payload;
      })

      // Toggle Like (Cập nhật local ngay khi gọi)
      .addCase(toggleLikeThunk.rejected, (state, action) => {
        state.message = action.payload;
        // Chỗ này bạn có thể logic revert lại like nếu cần,
        // nhưng thường WebSocket sẽ lo phần sync số lượng.
      });
  },
});

export const {
  updatePostRealtime,
  deletePostRealtime,
  updateLikesRealtime,
  updateCommentsCountRealtime,
  clearMessage,
  addImagesRealtime,
  removeImageRealtime,
  toggleLikeLocal,
  setPosts, // Export thêm cái này nếu ở ngoài cần dùng
} = postSlice.actions;

export default postSlice.reducer;
