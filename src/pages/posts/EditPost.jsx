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
  Modal,
  message as antdMessage,
  Spin,
  Tag,
} from "antd";

import {
  updatePostThunk,
  deletePostImageThunk,
  uploadPostImagesThunk,
} from "../../store/slice/PostSlice";
import "./EditPost.css";

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const EditPost = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { postId } = useParams();
  const [form] = Form.useForm();

  const { user } = useSelector((state) => state.user);

  // States
  const [existingImages, setExistingImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

    if (cleanPath.startsWith("/api/")) {
      return `${baseUrl}${cleanPath}`;
    }

    return `${baseUrl}/api${cleanPath}`;
  };

  // 1. TẢI DỮ LIỆU BÀI VIẾT CŨ
  useEffect(() => {
    if (postId) {
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

            if (postData.postsImage) {
              setExistingImages(
                postData.postsImage.map((img) => ({
                  id: img.id,
                  imageUrl: img.imageUrl,
                })),
              );
            }
          }
        } catch (error) {
          antdMessage.error("Lỗi tải bài viết: " + error.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPostDetails();
    }
  }, [postId, form]);

  // 2. HÀM XÓA ẢNH CŨ
  const handleDeleteOldImage = (imageId) => {
    Modal.confirm({
      title: "Xác nhận xóa ảnh",
      content: "Bạn có chắc chắn muốn xóa bức ảnh này khỏi bài viết không?",
      okText: "Xóa ngay",
      okType: "danger",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          setIsLoading(true);
          await dispatch(deletePostImageThunk({ postId, imageId })).unwrap();
          setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
          antdMessage.success("Đã xóa ảnh cũ thành công");
        } catch (error) {
          antdMessage.error("Lỗi khi xóa ảnh: " + error);
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // 3. XỬ LÝ ẢNH MỚI
  const handleImageChange = ({ fileList }) => {
    const files = fileList.map((f) => f.originFileObj).filter(Boolean);
    setSelectedImages(files);

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleRemoveNewImage = (indexToRemove) => {
    const newSelected = selectedImages.filter(
      (_, index) => index !== indexToRemove,
    );
    setSelectedImages(newSelected);
    setImagePreviews(
      imagePreviews.filter((_, index) => index !== indexToRemove),
    );
  };

  // 4. HÀM CẬP NHẬT BÀI VIẾT
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

      // Cập nhật text
      await dispatch(
        updatePostThunk({ userId: currentUserId, postId, data: values }),
      ).unwrap();

      // Tải ảnh mới nếu có
      if (selectedImages.length > 0) {
        await dispatch(
          uploadPostImagesThunk({ postId, files: selectedImages }),
        ).unwrap();
      }

      antdMessage.success("Cập nhật bài viết thành công!");
      navigate("/posts");
    } catch (error) {
      antdMessage.error("Lỗi cập nhật: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout className="edit-post-container py-8 px-4">
      <Content className="max-w-3xl mx-auto w-full">
        <Card
          bordered={false}
          className="edit-post-card overflow-hidden"
          title={
            <Space direction="vertical" size={0} className="py-2">
              <Title level={3} className="m-0 edit-post-title">
                Chỉnh sửa bài viết
              </Title>
              <Text type="secondary">
                Cập nhật nội dung và hình ảnh cho bài viết của bạn
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
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
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
                rules={[{ required: true, message: "Vui lòng nhập nội dung!" }]}
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
                <Select className="h-11 rounded-lg">
                  <Select.Option value="ACTIVE">
                    <Tag
                      color="processing"
                      className="border-none px-3 py-0.5 rounded-full"
                    >
                      Hoạt động (ACTIVE)
                    </Tag>
                  </Select.Option>
                  <Select.Option value="BLOCK">
                    <Tag
                      color="default"
                      className="border-none px-3 py-0.5 rounded-full"
                    >
                      Khóa (BLOCK)
                    </Tag>
                  </Select.Option>
                </Select>
              </Form.Item>

              <Divider orientation="left">
                <Text type="secondary">Quản lý hình ảnh</Text>
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
                      className="h-12 edit-post-upload-btn font-medium rounded-lg"
                    >
                      Tải lên ảnh mới
                    </Button>
                  </Upload>

                  {(existingImages.length > 0 || imagePreviews.length > 0) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      {/* Ảnh cũ */}
                      {existingImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative group aspect-square"
                        >
                          <Image
                            // ĐÃ SỬA: Bọc hàm getImageUrl
                            src={getImageUrl(img.imageUrl)}
                            className="w-full h-full object-cover rounded-lg border shadow-sm"
                            preview={false}
                          />
                          <Tag
                            color="blue"
                            className="absolute top-2 left-2 m-0 border-none shadow-sm opacity-90"
                          >
                            Cũ
                          </Tag>
                          <Button
                            type="primary"
                            danger
                            size="small"
                            className="absolute top-2 right-2 shadow-md"
                            onClick={() => handleDeleteOldImage(img.id)}
                          >
                            Xóa
                          </Button>
                        </div>
                      ))}

                      {/* Ảnh mới */}
                      {imagePreviews.map((url, index) => (
                        <div
                          key={`new-${index}`}
                          className="relative group aspect-square"
                        >
                          <Image
                            src={url}
                            className="w-full h-full object-cover rounded-lg border border-blue-300 shadow-sm"
                            preview={false}
                          />
                          <Tag
                            color="green"
                            className="absolute top-2 left-2 m-0 border-none shadow-sm opacity-90"
                          >
                            Mới
                          </Tag>
                          <Button
                            type="default"
                            danger
                            size="small"
                            className="absolute top-2 right-2 shadow-md"
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
                  className="rounded-lg px-8 border-none bg-slate-100 hover:bg-slate-200"
                  onClick={() => navigate(-1)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={isLoading}
                  className="rounded-lg px-8 edit-post-btn-primary font-bold"
                >
                  Cập nhật bài viết
                </Button>
              </div>
            </Form>
          </Spin>
        </Card>
      </Content>
    </Layout>
  );
};

export default EditPost;
