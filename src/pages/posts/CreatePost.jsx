import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { postService } from "../../services/PostService";

import {
  Layout,
  Card,
  Form,
  Input,
  Button,
  Select,
  Typography,
  Space,
  Upload,
  Image,
  Divider,
  message as antdMessage,
  Spin,
  Tag,
} from "antd";

import {
  createPostThunk,
  updatePostThunk,
  uploadPostImagesThunk,
} from "../../store/slice/PostSlice";

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const Createpost = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { postId } = useParams();
  const isEditMode = Boolean(postId);

  const { user } = useSelector((state) => state.user);

  const [existingImages, setExistingImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ĐÃ THÊM: Hàm xử lý URL ảnh chuẩn xác cho môi trường thực tế
  const getImageUrl = (url) => {
    if (!url) return null;
    const baseUrl = import.meta.env.VITE_BACKEND_URL;

    // 1. Chuyển IP cũ thành HTTPS mới
    if (url.includes("203.145.47.214:5173")) {
      return url.replace("http://203.145.47.214:5173", baseUrl);
    }

    // 2. Link ngoài chuẩn thì giữ nguyên
    if (url.startsWith("http")) return url;

    // 3. Xử lý link tương đối (nối thêm backend url, tránh trùng /api/)
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    if (cleanUrl.startsWith("/api/")) {
      return `${baseUrl}${cleanUrl}`;
    }

    return `${baseUrl}/api${cleanUrl}`;
  };

  // 1. TỰ ĐỘNG TẢI DỮ LIỆU NẾU LÀ CHẾ ĐỘ SỬA
  useEffect(() => {
    if (isEditMode) {
      const fetchPostDetails = async () => {
        try {
          setIsLoading(true);
          const res = await postService.getPostById(postId);
          const postData = res.data?.result || res.result;

          if (postData) {
            form.setFieldsValue({
              postTitle: postData.postTitle,
              postContent: postData.postContent,
              status: postData.status,
            });

            if (postData.postsImage && postData.postsImage.length > 0) {
              setExistingImages(postData.postsImage.map((img) => img.imageUrl));
            }
          }
        } catch (error) {
          antdMessage.error(
            "Lỗi tải thông tin bài viết: " +
              (error.response?.data?.message || error.message),
          );
        } finally {
          setIsLoading(false);
        }
      };
      fetchPostDetails();
    } else {
      // Giá trị mặc định khi tạo mới
      form.setFieldsValue({ status: "ACTIVE" });
    }
  }, [postId, isEditMode, form]);

  // 2. XỬ LÝ ẢNH
  const handleImageChange = ({ fileList }) => {
    const files = fileList.map((f) => f.originFileObj).filter(Boolean);
    if (files.length === 0) return;

    setSelectedImages(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleRemoveNewImage = (indexToRemove) => {
    setSelectedImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
    setImagePreviews((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  // 3. XỬ LÝ SUBMIT
  const onFinish = async (values) => {
    let currentUserId = user?.id;

    if (!currentUserId) {
      const userInfoStr = localStorage.getItem("userInfo"); // Vẫn giữ thông tin public ở đây
      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          currentUserId = userInfo.id;
        } catch (err) {
          console.error("Lỗi parse userInfo", err);
        }
      }
    }

    try {
      setIsLoading(true);
      let finalPostId = postId;

      if (isEditMode) {
        await dispatch(
          updatePostThunk({ userId: currentUserId, postId, data: values }),
        ).unwrap();
        antdMessage.success("Cập nhật bài viết thành công!");
      } else {
        const createRes = await dispatch(
          createPostThunk({ userId: currentUserId, data: values }),
        ).unwrap();

        finalPostId = createRes?.result?.id || createRes?.id;
        if (!finalPostId)
          throw new Error("Không lấy được ID bài viết sau khi tạo.");
        antdMessage.success("Đăng bài thành công!");
      }

      // UPLOAD ẢNH MỚI
      if (selectedImages.length > 0) {
        antdMessage.loading({
          content: "Đang tải ảnh lên...",
          key: "uploading",
        });
        await dispatch(
          uploadPostImagesThunk({ postId: finalPostId, files: selectedImages }),
        ).unwrap();
        antdMessage.success({ content: "Tải ảnh hoàn tất!", key: "uploading" });
      }

      navigate("/posts");
    } catch (error) {
      antdMessage.error(
        `Lỗi ${isEditMode ? "cập nhật" : "đăng"} bài: ` + error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout className="min-h-screen bg-slate-50 py-8 px-4">
      <Content className="max-w-3xl mx-auto w-full">
        <Card
          bordered={false}
          className="shadow-md rounded-2xl overflow-hidden"
          title={
            <Space direction="vertical" size={0} className="py-2">
              <Title level={3} className="m-0 text-blue-700">
                {isEditMode ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
              </Title>
              <Text type="secondary">
                {isEditMode
                  ? "Cập nhật nội dung cho bài viết của bạn"
                  : "Chia sẻ suy nghĩ của bạn với cộng đồng"}
              </Text>
            </Space>
          }
        >
          <Spin spinning={isLoading} tip="Đang xử lý...">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              className="mt-2"
            >
              <Form.Item
                label={<Text strong>Tiêu đề bài viết</Text>}
                name="postTitle"
                rules={[
                  { required: true, message: "Vui lòng nhập tiêu đề!" },
                  {
                    whitespace: true,
                    message: "Tiêu đề không được chỉ chứa khoảng trắng!",
                  },
                ]}
              >
                <Input
                  placeholder="Nhập tiêu đề hấp dẫn..."
                  maxLength={100}
                  showCount
                  className="rounded-lg h-11"
                />
              </Form.Item>

              <Form.Item
                label={<Text strong>Nội dung</Text>}
                name="postContent"
                rules={[
                  { required: true, message: "Vui lòng nhập nội dung!" },
                  {
                    whitespace: true,
                    message: "Nội dung không được chỉ chứa khoảng trắng!",
                  },
                ]}
              >
                <TextArea
                  placeholder="Bạn đang nghĩ gì?"
                  maxLength={100}
                  showCount
                  rows={5}
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                label={<Text strong>Trạng thái bài viết</Text>}
                name="status"
              >
                <Select className="h-11 rounded-lg" suffixIcon={null}>
                  <Select.Option value="ACTIVE">
                    <Tag
                      color="processing"
                      className="border-none px-3 py-0.5 rounded-full text-sm"
                    >
                      Hoạt động (ACTIVE)
                    </Tag>
                  </Select.Option>
                  <Select.Option value="BLOCK">
                    <Tag
                      color="default"
                      className="border-none px-3 py-0.5 rounded-full text-sm"
                    >
                      Khóa (BLOCK)
                    </Tag>
                  </Select.Option>
                </Select>
              </Form.Item>

              <Divider orientation="left">
                <Text type="secondary">Đính kèm hình ảnh</Text>
              </Divider>

              <div className="mb-6">
                <Space direction="vertical" className="w-full" size={16}>
                  <Upload
                    multiple
                    beforeUpload={() => false}
                    onChange={handleImageChange}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <Button
                      block
                      className="h-12 border-dashed border-blue-300 text-blue-600 font-medium rounded-lg hover:bg-blue-50"
                    >
                      Chọn ảnh tải lên
                    </Button>
                  </Upload>

                  {(existingImages.length > 0 || imagePreviews.length > 0) && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      {/* Ảnh cũ (Chỉ xem) */}
                      {existingImages.map((url, index) => (
                        <div
                          key={`old-${index}`}
                          className="relative group aspect-square opacity-80"
                        >
                          <Image
                            // ĐÃ SỬA: Bọc hàm getImageUrl
                            src={getImageUrl(url)}
                            className="w-full h-full object-cover rounded-lg border shadow-sm"
                            preview={false}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-10 rounded-lg"></div>
                          <Tag
                            color="default"
                            className="absolute top-2 left-2 m-0 border-none shadow-sm font-medium"
                          >
                            Ảnh cũ
                          </Tag>
                        </div>
                      ))}

                      {/* Ảnh mới */}
                      {imagePreviews.map((previewUrl, index) => (
                        <div
                          key={`new-${index}`}
                          className="relative group aspect-square"
                        >
                          <Image
                            src={previewUrl}
                            className="w-full h-full object-cover rounded-lg border border-blue-300 shadow-sm"
                            preview={false}
                          />
                          <Tag
                            color="green"
                            className="absolute top-2 left-2 m-0 border-none shadow-sm font-medium"
                          >
                            Ảnh mới
                          </Tag>
                          <Button
                            type="primary"
                            danger
                            size="small"
                            className="absolute top-2 right-2 shadow-md font-bold"
                            onClick={() => handleRemoveNewImage(index)}
                          >
                            Hủy
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Space>
              </div>

              <Divider className="my-6" />

              <div className="flex justify-end gap-3">
                <Button
                  size="large"
                  className="rounded-lg px-8 border-none bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                  onClick={() => navigate(-1)}
                >
                  Quay lại
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={isLoading}
                  className="rounded-lg px-8 bg-blue-600 hover:bg-blue-700 font-bold"
                >
                  {isEditMode ? "Cập nhật bài" : "Đăng bài ngay"}
                </Button>
              </div>
            </Form>
          </Spin>
        </Card>
      </Content>
    </Layout>
  );
};

export default Createpost;
