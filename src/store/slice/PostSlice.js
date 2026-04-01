import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { postService } from "../../services/PostService";

// --- Async Thunks ---
export const fetchAllPosts = createAsyncThunk(
  "post/fetchAll",
  async ({ page = 0, size = 5 } = {}, thunkAPI) => {
    try {
      const response = await postService.getAllPosts(page, size);
      return response.data.result;
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
      return postId;
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
    totalPages: 0,
  },
  reducers: {
    toggleLikeLocal: (state, action) => {
      const { postId, isLiked } = action.payload;
      const post = state.posts.find((p) => p.id === postId);
      if (post) {
        post.liked = isLiked;
        post.isLiked = isLiked;
      }
    },

    // 2. KHI WEBSOCKET BÁO VỀ THÌ MỚI ĐƯỢC CỘNG/TRỪ SỐ
    updateLikesRealtime: (state, action) => {
      const { postId, isActionLike } = action.payload;
      const post = state.posts.find((p) => p.id === postId);

      if (post) {
        post.likesCount = isActionLike
          ? (post.likesCount || 0) + 1
          : Math.max(0, (post.likesCount || 0) - 1);
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
        const oldPost = state.posts[index];
        state.posts[index] = {
          ...oldPost,
          postTitle: updatedPost.postTitle || oldPost.postTitle,
          postContent: updatedPost.postContent || oldPost.postContent,
          status: updatedPost.status || oldPost.status,
          updatedAt: updatedPost.updatedAt || oldPost.updatedAt,
          user: oldPost.user,
          postsImage: oldPost.postsImage,
          comments: oldPost.comments,
          likesCount: oldPost.likesCount,
          commentsCount: oldPost.commentsCount,
        };
      }
    },
    deletePostRealtime: (state, action) => {
      state.posts = state.posts.filter((p) => p.id !== action.payload);
    },
    updateCommentsCountRealtime: (state, action) => {
      const { postId, type } = action.payload;
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
      .addCase(fetchAllPosts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        const { content, totalPages, page } = action.payload;

        if (page === 0) {
          state.posts = content;
        } else {
          const existingPostIds = new Set(state.posts.map((post) => post.id));
          const newPosts = content.filter(
            (post) => !existingPostIds.has(post.id),
          );
          state.posts = [...state.posts, ...newPosts];
        }
        state.totalPages = totalPages;
      })
      .addCase(fetchAllPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.message = action.payload;
      })
      .addCase(deletePostThunk.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p.id !== action.payload);
        state.message = "Đã xóa bài viết thành công.";
      })
      .addCase(deletePostThunk.rejected, (state, action) => {
        state.message = action.payload;
      })
      .addCase(toggleLikeThunk.rejected, (state, action) => {
        state.message = action.payload;
        // Xử lý hoàn tác (revert) nếu API gọi thất bại
        const postId = action.meta.arg;
        const post = state.posts.find((p) => p.id === postId);
        if (post) {
          const revertIsLiked = !post.isLiked;
          post.isLiked = revertIsLiked;
          post.liked = revertIsLiked;

          // API lỗi nghĩa là sẽ không có WS nào dội về, ta xóa lệnh chờ bỏ qua WS
          if (state.ignoredWsCount[postId] > 0) {
            state.ignoredWsCount[postId] -= 1;
          }
        }
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
  setPosts,
} = postSlice.actions;

export default postSlice.reducer;
