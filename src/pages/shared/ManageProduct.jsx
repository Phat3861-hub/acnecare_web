import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Avatar,
  Tabs,
  Upload,
  Descriptions, // Thêm component để hiển thị chi tiết đẹp hơn
  Image, // Thêm component để xem ảnh phóng to
} from "antd";
import { UploadOutlined, EyeOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../../store/slice/ProductSlice";
import { fetchCategories } from "../../store/slice/CategorySlice";
import { productService } from "../../services/ProductService";
import { jwtDecode } from "jwt-decode";

const { TextArea } = Input;
const { Option } = Select;

const ManageProduct = () => {
  const dispatch = useDispatch();

  // ================================================================
  // 1. LẤY THÔNG TIN USER
  // ================================================================
  let currentUser = useSelector((state) => state.user?.userInfo);

  if (!currentUser || !currentUser.id) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const decoded = jwtDecode(token);
      const tokenRoles = decoded.roles || decoded.scope || "";
      let role = "PATIENT";
      if (tokenRoles.includes("ADMIN")) role = "ADMIN";
      else if (tokenRoles.includes("DOCTOR")) role = "DOCTOR";
      else if (tokenRoles.includes("BRAND")) role = "BRAND";

      currentUser = { id: decoded.sub, role: role };
    }
  }

  const isAdmin = currentUser?.role === "ADMIN";

  // ================================================================
  // 2. STATE QUẢN LÝ DỮ LIỆU
  // ================================================================
  const { products, loading: prodLoading } = useSelector(
    (state) => state.product,
  );
  const { categories } = useSelector((state) => state.category);

  const [activeTab, setActiveTab] = useState("ALL");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  // Thêm State cho Modal Xem Chi Tiết
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);

  const [thumbnailFileList, setThumbnailFileList] = useState([]);
  const [imageFileList, setImageFileList] = useState([]);

  useEffect(() => {
    dispatch(fetchProducts());
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  // ================================================================
  // 3. LOGIC LỌC DỮ LIỆU
  // ================================================================
  const filteredProducts = products.filter((item) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "MINE") return item.createdBy === currentUser?.id;
    if (activeTab === "PENDING")
      return (
        item.approvalStatus === "PENDING" &&
        (isAdmin || item.createdBy === currentUser?.id)
      );
    return true;
  });

  const tabItems = [
    { key: "ALL", label: "Tất cả" },
    { key: "MINE", label: "Của tôi" },
    { key: "PENDING", label: "Chờ duyệt" },
  ];

  // ================================================================
  // 4. CÁC HÀM XỬ LÝ
  // ================================================================
  const openModal = (record = null) => {
    setEditingProduct(record);

    if (record) {
      // 1. Fill các thông tin text bình thường
      form.setFieldsValue({
        name: record.name,
        brand: record.brand,
        categoryId: record.category?.id,
        description: record.description,
        ingredients: record.ingredients,
        affiliateUrl: record.affiliateUrl,
      });

      // 2. Load ảnh Thumbnail (Ảnh chính)
      if (record.thumbnailUrl) {
        setThumbnailFileList([
          {
            uid: "-1", // ID ảo để Antd nhận diện
            name: "thumbnail.png",
            status: "done", // Trạng thái đã tải xong
            url: record.thumbnailUrl, // Link ảnh từ server
          },
        ]);
      } else {
        setThumbnailFileList([]);
      }

      // 3. Load danh sách ảnh phụ (Cắt chuỗi bằng dấu phẩy)
      if (record.imagesUrl) {
        const urls = record.imagesUrl
          .split(",")
          .filter((url) => url.trim() !== "");
        const formattedFiles = urls.map((url, index) => ({
          uid: `-${index + 2}`,
          name: `image-${index}.png`,
          status: "done",
          url: url.trim(),
        }));
        setImageFileList(formattedFiles);
      } else {
        setImageFileList([]);
      }
    } else {
      // Nếu là THÊM MỚI thì xóa trắng mọi thứ
      form.resetFields();
      setThumbnailFileList([]);
      setImageFileList([]);
    }

    setIsModalVisible(true);
  };

  // Hàm mở Modal Xem chi tiết
  const openDetailModal = (record) => {
    setDetailProduct(record);
    setIsDetailModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("brand", values.brand);
      formData.append("categoryId", values.categoryId);
      formData.append("description", values.description);

      if (values.ingredients)
        formData.append("ingredients", values.ingredients);
      if (values.affiliateUrl)
        formData.append("affiliateUrl", values.affiliateUrl);

      // --- 1. XỬ LÝ ẢNH CHÍNH (THUMBNAIL) ---
      if (thumbnailFileList.length > 0) {
        if (thumbnailFileList[0].originFileObj) {
          // Có ảnh upload mới
          formData.append("thumbnailFile", thumbnailFileList[0].originFileObj);
        } else if (thumbnailFileList[0].url) {
          // Giữ lại URL ảnh cũ
          formData.append("thumbnailUrl", thumbnailFileList[0].url);
        }
      } else {
        // Đã xóa ảnh chính
        formData.append("thumbnailUrl", "");
      }

      // --- 2. XỬ LÝ ẢNH PHỤ (GIỮ CŨ + THÊM MỚI) ---
      const retainedImages = [];
      imageFileList.forEach((file) => {
        if (file.originFileObj) {
          // File tải lên mới
          formData.append("imageFiles", file.originFileObj);
        } else if (file.url) {
          // File cũ giữ lại
          retainedImages.push(file.url);
        }
      });
      // Gửi mảng link ảnh cũ lên Backend
      formData.append("imagesUrl", retainedImages.join(","));

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, formData);
        message.success("Cập nhật sản phẩm thành công!");
      } else {
        await productService.createProduct(formData);
        message.success(
          "Thêm sản phẩm thành công! (Chờ duyệt nếu không phải Admin)",
        );
      }
      setIsModalVisible(false);
      dispatch(fetchProducts());
    } catch (error) {
      message.error(error.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await productService.deleteProduct(id);
      message.success("Xóa thành công!");
      dispatch(fetchProducts());
    } catch (error) {
      message.error("Xóa thất bại!");
    }
  };
  const handleUpdateStatus = async (id, status) => {
    try {
      await productService.updateApprovalStatus(id, status);
      message.success(
        status === "APPROVED" ? "Đã duyệt sản phẩm!" : "Đã hủy duyệt sản phẩm!",
      );
      dispatch(fetchProducts());
    } catch (error) {
      message.error("Lỗi khi cập nhật trạng thái!");
    }
  };

  const normFile = (e) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  // ================================================================
  // 5. CẤU HÌNH CỘT BẢNG
  // ================================================================
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "thumbnailUrl",
      render: (url) => (
        <Avatar
          shape="square"
          size={64}
          src={url || "https://via.placeholder.com/64"}
        />
      ),
    },
    { title: "Tên sản phẩm", dataIndex: "name", className: "font-medium" },
    { title: "Thương hiệu", dataIndex: "brand" },
    { title: "Danh mục", render: (_, record) => record.category?.name },
    {
      title: "Trạng thái",
      dataIndex: "approvalStatus",
      render: (status) => (
        <Tag color={status === "APPROVED" ? "success" : "warning"}>
          {status === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      render: (_, record) => {
        const isOwner = currentUser?.id === record.createdBy;
        const canEditOrDelete = isAdmin || isOwner;

        return (
          <Space size="middle" className="flex-wrap">
            <Button
              type="link"
              onClick={() => openDetailModal(record)}
              className="px-0 text-green-600 font-medium"
              icon={<EyeOutlined />}
            >
              Xem
            </Button>

            {/* NÚT DUYỆT / HỦY DUYỆT (CHỈ ADMIN MỚI THẤY) */}
            {isAdmin && record.approvalStatus === "PENDING" && (
              <Popconfirm
                title="Bạn muốn duyệt sản phẩm này để hiển thị công khai?"
                onConfirm={() => handleUpdateStatus(record.id, "APPROVED")}
              >
                <Button type="link" className="px-0 text-blue-600 font-bold">
                  Duyệt
                </Button>
              </Popconfirm>
            )}

            {isAdmin && record.approvalStatus === "APPROVED" && (
              <Popconfirm
                title="Bạn muốn ẩn sản phẩm này đi (Hủy duyệt)?"
                onConfirm={() => handleUpdateStatus(record.id, "PENDING")}
              >
                <Button type="link" className="px-0 text-orange-500 font-bold">
                  Hủy duyệt
                </Button>
              </Popconfirm>
            )}

            {canEditOrDelete && (
              <>
                <Button
                  type="link"
                  onClick={() => openModal(record)}
                  className="px-0"
                >
                  Sửa
                </Button>
                <Popconfirm
                  title="Xóa sản phẩm này?"
                  onConfirm={() => handleDelete(record.id)}
                >
                  <Button type="link" danger className="px-0">
                    Xóa
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold">Quản lý Sản phẩm</h2>
        <Button type="primary" onClick={() => openModal()} size="large">
          + Thêm Sản phẩm
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        items={tabItems}
        className="mb-4"
      />

      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey="id"
        loading={prodLoading}
      />

      {/* MODAL THÊM/SỬA SẢN PHẨM */}
      <Modal
        title={
          <div className="text-lg font-bold">
            {editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="mt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Tên sản phẩm"
              name="name"
              rules={[{ required: true, message: "Bắt buộc!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Thương hiệu"
              name="brand"
              rules={[{ required: true, message: "Bắt buộc!" }]}
            >
              <Input />
            </Form.Item>
          </div>

          <Form.Item
            label="Danh mục"
            name="categoryId"
            rules={[{ required: true, message: "Chọn danh mục!" }]}
          >
            <Select placeholder="Chọn danh mục">
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Ảnh Thumbnail (Ảnh chính)"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            extra={editingProduct ? "Để trống nếu không muốn đổi ảnh cũ." : ""}
          >
            <Upload
              listType="picture"
              maxCount={1}
              beforeUpload={() => false}
              onChange={(info) => setThumbnailFileList(info.fileList)}
              fileList={thumbnailFileList}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh chính</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="Các ảnh phụ (Mặt sau, chất kem...)"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            extra={
              editingProduct
                ? "Lưu ý: Nếu bạn tải ảnh mới lên, toàn bộ ảnh phụ cũ sẽ bị xóa."
                : ""
            }
          >
            <Upload
              listType="picture"
              multiple
              beforeUpload={() => false}
              onChange={(info) => setImageFileList(info.fileList)}
              fileList={imageFileList}
            >
              <Button icon={<UploadOutlined />}>Chọn nhiều ảnh</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ required: true, message: "Bắt buộc!" }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item label="Thành phần (Ingredients)" name="ingredients">
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item label="Link mua hàng (Affiliate)" name="affiliateUrl">
            <Input placeholder="https://..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit">
              {editingProduct ? "Cập nhật" : "Lưu"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL XEM CHI TIẾT SẢN PHẨM */}
      <Modal
        title={
          <div className="text-xl font-bold text-blue-800 border-b pb-2">
            Chi tiết sản phẩm
          </div>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setIsDetailModalVisible(false)}
          >
            Đóng
          </Button>,
        ]}
        width={750}
      >
        {detailProduct && (
          <div className="mt-4">
            {/* Phần Header: Ảnh + Tên + Nhãn */}
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="shrink-0 flex justify-center">
                <Image
                  width={180}
                  height={180}
                  src={
                    detailProduct.thumbnailUrl ||
                    "https://via.placeholder.com/180"
                  }
                  className="rounded-lg object-cover shadow-sm border border-gray-200"
                  fallback="https://via.placeholder.com/180"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1 text-gray-800">
                  {detailProduct.name}
                </h3>
                <p className="text-md text-gray-500 font-medium mb-3 uppercase tracking-wider">
                  {detailProduct.brand}
                </p>
                <div className="flex gap-2 mb-2">
                  <Tag color="blue">{detailProduct.category?.name}</Tag>
                  <Tag
                    color={
                      detailProduct.approvalStatus === "APPROVED"
                        ? "success"
                        : "warning"
                    }
                  >
                    {detailProduct.approvalStatus === "APPROVED"
                      ? "Đã duyệt"
                      : "Chờ duyệt"}
                  </Tag>
                </div>
              </div>
            </div>

            {/* Phần Body: Mô tả & Thành phần */}
            <Descriptions
              bordered
              column={1}
              size="middle"
              className="bg-white"
            >
              <Descriptions.Item
                label={
                  <span className="font-semibold whitespace-nowrap">Mô tả</span>
                }
              >
                <div className="whitespace-pre-wrap text-justify">
                  {detailProduct.description}
                </div>
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <span className="font-semibold whitespace-nowrap">
                    Thành phần
                  </span>
                }
              >
                {detailProduct.ingredients ? (
                  <div className="whitespace-pre-wrap text-gray-700">
                    {detailProduct.ingredients}
                  </div>
                ) : (
                  <span className="italic text-gray-400">
                    Không có thông tin
                  </span>
                )}
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <span className="font-semibold whitespace-nowrap">
                    Mua hàng
                  </span>
                }
              >
                {detailProduct.affiliateUrl ? (
                  <a
                    href={detailProduct.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Nhấn vào đây để xem nơi mua
                  </a>
                ) : (
                  <span className="italic text-gray-400">
                    Chưa có liên kết mua hàng
                  </span>
                )}
              </Descriptions.Item>
            </Descriptions>

            {/* Phần Hình ảnh phụ (Nếu có) */}
            {detailProduct.imagesUrl && (
              <div className="mt-6">
                <h4 className="font-bold text-lg mb-3">Hình ảnh khác</h4>
                <div className="flex flex-wrap gap-3">
                  {detailProduct.imagesUrl.split(",").map((img, index) => (
                    <Image
                      key={index}
                      width={100}
                      height={100}
                      src={img.trim()}
                      className="rounded border object-cover shadow-sm"
                      fallback="https://via.placeholder.com/100"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageProduct;
