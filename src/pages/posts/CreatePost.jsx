import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { postService } from "../../services/PostService";

const Createpost = () => {
  const navigate = useNavigate();
  // Lấy postId từ URL (nếu có)
  const { postId } = useParams();
  const isEditMode = Boolean(postId); // Biến kiểm tra xem đang ở chế độ Sửa hay Tạo mới

  const { user } = useSelector((state) => state.user);

  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  // Ảnh cũ (đã có từ trước) và ảnh mới (vừa chọn thêm)
  const [existingImages, setExistingImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  // TỰ ĐỘNG TẢI DỮ LIỆU NẾU LÀ CHẾ ĐỘ SỬA
  useEffect(() => {
    if (isEditMode) {
      const fetchPostDetails = async () => {
        try {
          setIsLoading(true);
          const res = await postService.getPostById(postId);
          const postData = res.data?.result || res.result;

          if (postData) {
            setPostTitle(postData.postTitle);
            setPostContent(postData.postContent);
            setStatus(postData.status);

            // Nếu bài viết có ảnh cũ, hiển thị lên
            if (postData.postsImage && postData.postsImage.length > 0) {
              setExistingImages(postData.postsImage.map((img) => img.imageUrl));
            }
          }
        } catch (error) {
          setMessage(
            "Lỗi tải thông tin bài viết: " +
              (error.response?.data?.message || error.message),
          );
        } finally {
          setIsLoading(false);
        }
      };
      fetchPostDetails();
    }
  }, [postId, isEditMode]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedImages((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...previews]);
    e.target.value = null;
  };

  const handleRemoveNewImage = (indexToRemove) => {
    setSelectedImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
    setImagePreviews((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let currentUserId = user?.id;
    if (!currentUserId) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          currentUserId = jwtDecode(token).sub;
        } catch (err) {}
      }
    }

    if (!currentUserId) {
      setMessage(
        "Lỗi: Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.",
      );
      return;
    }

    if (!postTitle.trim() || !postContent.trim()) {
      setMessage("Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.");
      return;
    }

    try {
      setIsLoading(true);
      const requestData = {
        postTitle: postTitle,
        postContent: postContent,
        status: status,
      };

      let finalPostId = postId;

      if (isEditMode) {
        // CHẾ ĐỘ SỬA: Gọi API update
        setMessage("Đang cập nhật bài viết...");
        await postService.updatePost(currentUserId, postId, requestData);
      } else {
        // CHẾ ĐỘ TẠO MỚI: Gọi API create
        setMessage("Đang tạo bài viết...");
        const createRes = await postService.createPost(
          currentUserId,
          requestData,
        );
        finalPostId = createRes.data?.result?.id || createRes.result?.id;
        if (!finalPostId)
          throw new Error("Không lấy được ID bài viết sau khi tạo.");
      }

      // UPLOAD ẢNH MỚI (Dùng chung cho cả Tạo mới và Sửa nếu có chọn thêm ảnh)
      if (selectedImages.length > 0) {
        setMessage("Đang tải ảnh lên...");
        await postService.uploadPostImages(finalPostId, selectedImages);
      }

      navigate("/posts");
    } catch (error) {
      setMessage(
        `Lỗi ${isEditMode ? "cập nhật" : "đăng"} bài: ` +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-sm border mt-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">
          {isEditMode ? "Chỉnh sửa bài viết" : "Tạo Bài Viết Mới"}
        </h1>

        {message && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded text-sm font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Tiêu đề (Tối đa 100 ký tự)
            </label>
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài viết..."
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              maxLength={100}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Nội dung (Tối đa 100 ký tự)
            </label>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Bạn đang nghĩ gì?"
              className="w-full p-3 border border-gray-300 rounded h-32 resize-y focus:outline-none focus:border-blue-500"
              maxLength={100}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Trạng thái bài viết
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="ACTIVE">Hoạt động (ACTIVE)</option>
              <option value="BLOCK">Khóa (BLOCK)</option>
            </select>
          </div>

          <div className="mb-6 border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-gray-700 font-medium">
                Hình ảnh đính kèm
              </label>
              <label className="cursor-pointer bg-gray-100 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded hover:bg-gray-200 transition-colors">
                Thêm Ảnh
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Khung hiển thị ảnh */}
            {(existingImages.length > 0 || imagePreviews.length > 0) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 border rounded-md">
                {/* Hiển thị ảnh cũ (hiện tại chỉ cho xem, chưa hỗ trợ xóa ảnh cũ) */}
                {existingImages.map((url, index) => (
                  <div
                    key={`old-${index}`}
                    className="relative group opacity-70"
                  >
                    <img
                      src={url}
                      alt={`Cũ ${index}`}
                      className="w-full h-32 object-cover rounded-md border shadow-sm"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-md">
                      <span className="text-white text-xs font-bold px-2 py-1 bg-black bg-opacity-50 rounded">
                        Ảnh cũ
                      </span>
                    </div>
                  </div>
                ))}

                {/* Hiển thị ảnh mới chọn */}
                {imagePreviews.map((previewUrl, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <img
                      src={previewUrl}
                      alt={`Mới ${index}`}
                      className="w-full h-32 object-cover rounded-md border shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow hover:bg-red-600 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2 bg-gray-200 text-gray-700 font-medium rounded hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-5 py-2 font-bold text-white rounded transition-colors ${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading
                ? "Đang xử lý..."
                : isEditMode
                  ? "Cập nhật bài"
                  : "Đăng bài"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Createpost;
