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
  Descriptions,
  Image,
  Tooltip,
} from "antd";
import {
  UploadOutlined,
  EyeOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../../store/slice/ProductSlice";
import { fetchCategories } from "../../store/slice/CategorySlice";
import { productService } from "../../services/ProductService";
import { jwtDecode } from "jwt-decode";
import "./SharedPages.css";

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
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);

  const [thumbnailFileList, setThumbnailFileList] = useState([]);
  const [imageFileList, setImageFileList] = useState([]);

  const getImageUrl = (url) => {
  if (!url) return null;

  const baseUrl = import.meta.env.VITE_BACKEND_URL; 

  if (url.startsWith("http")) {
    if (url.includes("203.145.47.214") || url.includes("https://acnecare.io.vn/api/")) {
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

  useEffect(() => {
    dispatch(fetchProducts());
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  // ================================================================
  // 3. LOGIC LỌC DỮ LIỆU (Tích hợp Tìm kiếm)
  // ================================================================
  const filteredProducts = products.filter((item) => {
    // 1. Lọc theo Tab
    let isTabMatch = true;
    if (activeTab === "MINE") isTabMatch = item.createdBy === currentUser?.id;
    if (activeTab === "PENDING") {
      isTabMatch =
        item.approvalStatus === "PENDING" &&
        (isAdmin || item.createdBy === currentUser?.id);
    }

    // 2. Lọc theo Keyword (Tên hoặc Thương hiệu)
    let isSearchMatch = true;
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(lowerSearch);
      const matchBrand = item.brand?.toLowerCase().includes(lowerSearch);
      isSearchMatch = matchName || matchBrand;
    }

    return isTabMatch && isSearchMatch;
  });

  const tabItems = [
    { key: "ALL", label: "Tất cả sản phẩm" },
    { key: "MINE", label: "Của tôi" },
    { key: "PENDING", label: "Chờ duyệt" },
  ];

  // ================================================================
  // 4. CÁC HÀM XỬ LÝ
  // ================================================================
  const openModal = (record = null) => {
    setEditingProduct(record);

    if (record) {
      form.setFieldsValue({
        name: record.name,
        brand: record.brand,
        categoryId: record.category?.id,
        description: record.description,
        ingredients: record.ingredients,
        affiliateUrl: record.affiliateUrl,
      });

      if (record.thumbnailUrl) {
        setThumbnailFileList([
          {
            uid: "-1",
            name: "thumbnail.png",
            status: "done",
            // ĐÃ SỬA: Bọc hàm getImageUrl để ảnh cũ load lên Modal không bị lỗi
            url: getImageUrl(record.thumbnailUrl),
          },
        ]);
      } else {
        setThumbnailFileList([]);
      }

      if (record.imagesUrl) {
        const urls = record.imagesUrl
          .split(",")
          .filter((url) => url.trim() !== "");
        const formattedFiles = urls.map((url, index) => ({
          uid: `-${index + 2}`,
          name: `image-${index}.png`,
          status: "done",
          // ĐÃ SỬA: Bọc hàm getImageUrl
          url: getImageUrl(url.trim()),
        }));
        setImageFileList(formattedFiles);
      } else {
        setImageFileList([]);
      }
    } else {
      form.resetFields();
      setThumbnailFileList([]);
      setImageFileList([]);
    }

    setIsModalVisible(true);
  };

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

      if (thumbnailFileList.length > 0) {
        if (thumbnailFileList[0].originFileObj) {
          formData.append("thumbnailFile", thumbnailFileList[0].originFileObj);
        } else if (thumbnailFileList[0].url) {
          formData.append("thumbnailUrl", thumbnailFileList[0].url);
        }
      } else {
        formData.append("thumbnailUrl", "");
      }

      const retainedImages = [];
      imageFileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("imageFiles", file.originFileObj);
        } else if (file.url) {
          retainedImages.push(file.url);
        }
      });
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
      width: 80, // Giảm một chút cho gọn trên mobile
      render: (url) => (
        <Avatar
          shape="square"
          size={50} // Giảm size avatar xuống chút để đỡ chiếm chỗ
          // ĐÃ SỬA: Bọc hàm getImageUrl
          src={url ? getImageUrl(url) : "https://via.placeholder.com/50"}
          className="border border-gray-200 shadow-sm"
        />
      ),
    },
    {
      title: "Thông tin Sản phẩm",
      render: (_, record) => (
        <div className="min-w-[150px]">
          <div className="font-semibold text-gray-800 text-[14px] md:text-base leading-tight md:leading-normal">
            {record.name}
          </div>
          <div className="text-[11px] md:text-xs text-gray-500 mt-1 uppercase tracking-wider">
            {record.brand}
          </div>
        </div>
      ),
    },
    {
      title: "Danh mục",
      render: (_, record) => <Tag color="blue">{record.category?.name}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "approvalStatus",
      render: (status) => (
        <Tag
          color={status === "APPROVED" ? "success" : "warning"}
          className="px-2 md:px-3 py-0.5 md:py-1 rounded-full font-medium"
        >
          {status === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      align: "center",
      render: (_, record) => {
        const isOwner = currentUser?.id === record.createdBy;
        const canEditOrDelete = isAdmin || isOwner;

        return (
          <Space size="small" className="whitespace-nowrap">
            <Tooltip title="Xem chi tiết">
              <Button
                type="text"
                onClick={() => openDetailModal(record)}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2"
                icon={<EyeOutlined />}
              />
            </Tooltip>

            {isAdmin && record.approvalStatus === "PENDING" && (
              <Popconfirm
                title="Duyệt sản phẩm này?"
                onConfirm={() => handleUpdateStatus(record.id, "APPROVED")}
              >
                <Tooltip title="Duyệt sản phẩm">
                  <Button
                    type="text"
                    className="text-green-600 hover:text-green-800 hover:bg-green-50 px-2"
                    icon={<CheckCircleOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            )}

            {isAdmin && record.approvalStatus === "APPROVED" && (
              <Popconfirm
                title="Hủy duyệt sản phẩm này?"
                onConfirm={() => handleUpdateStatus(record.id, "PENDING")}
              >
                <Tooltip title="Hủy duyệt">
                  <Button
                    type="text"
                    className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 px-2"
                    icon={<CloseCircleOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            )}

            {canEditOrDelete && (
              <>
                <Tooltip title="Chỉnh sửa">
                  <Button
                    type="text"
                    onClick={() => openModal(record)}
                    className="text-gray-600 hover:text-blue-600 hover:bg-gray-100 px-2"
                    icon={<EditOutlined />}
                  />
                </Tooltip>
                <Popconfirm
                  title="Xóa sản phẩm này?"
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDelete(record.id)}
                >
                  <Tooltip title="Xóa">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      className="px-2"
                    />
                  </Tooltip>
                </Popconfirm>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    // Bỏ padding mặc định khi ở mobile, giữ padding lớn ở tablet/PC
    <div className="shared-page-container p-3 sm:p-4 md:p-8 rounded-xl md:rounded-2xl border-none min-h-screen">
      <div className="bg-white shared-card-main p-4 sm:p-6 md:p-8">
      {/* HEADER TỪNG TRANG */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold shared-title">
            Quản lý Sản phẩm
          </h2>
          <p className="text-gray-500 text-xs md:text-sm mt-1">
            Danh sách tất cả các sản phẩm đang được quản lý trên hệ thống.
          </p>
        </div>
        <Button
          type="primary"
          onClick={() => openModal()}
          size="large"
          icon={<PlusOutlined />}
          className="w-full md:w-auto rounded-xl shared-btn-primary"
        >
          Thêm Sản phẩm
        </Button>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 bg-gray-50/50 p-2 md:p-3 rounded-lg border border-gray-100 gap-4">
        {/* Tabs để full width ở mobile cho cuộn ngang */}
        <div className="w-full lg:w-auto overflow-x-auto custom-scrollbar pb-1">
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            items={tabItems}
            style={{ marginBottom: 0 }}
          />
        </div>

        <Input
          placeholder="Tìm tên hoặc thương hiệu..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          className="w-full lg:w-72 rounded-md"
          size="middle"
        />
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="overflow-x-auto custom-scrollbar">
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          loading={prodLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng cộng ${total} sản phẩm`,
          }}
          rowClassName="hover:bg-gray-50 cursor-pointer transition-colors"
          // Cho phép cuộn ngang nếu bảng bị tràn trên mobile
          scroll={{ x: "max-content" }}
        />
      </div>
      </div>

      {/* MODAL THÊM/SỬA SẢN PHẨM */}
      <Modal
        title={
          <div className="text-lg md:text-xl font-bold flex items-center gap-2">
            {editingProduct ? (
              <EditOutlined className="text-blue-600" />
            ) : (
              <PlusOutlined className="text-green-600" />
            )}
            {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={750}
        destroyOnClose
        centered
        style={{ padding: "0 10px" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="mt-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <Form.Item
              label={
                <span className="font-medium text-sm md:text-base">
                  Tên sản phẩm
                </span>
              }
              name="name"
              rules={[
                { required: true, message: "Vui lòng nhập tên sản phẩm!" },
              ]}
            >
              <Input size="large" placeholder="VD: Sữa rửa mặt Cetaphil" />
            </Form.Item>

            <Form.Item
              label={
                <span className="font-medium text-sm md:text-base">
                  Thương hiệu
                </span>
              }
              name="brand"
              rules={[
                { required: true, message: "Vui lòng nhập thương hiệu!" },
              ]}
            >
              <Input size="large" placeholder="VD: Cetaphil" />
            </Form.Item>
          </div>

          <Form.Item
            label={
              <span className="font-medium text-sm md:text-base">Danh mục</span>
            }
            name="categoryId"
            rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
          >
            <Select size="large" placeholder="-- Chọn danh mục phù hợp --">
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-lg mb-6">
            <Form.Item
              label={
                <span className="font-medium text-sm md:text-base">
                  Ảnh Thumbnail (Ảnh đại diện chính)
                </span>
              }
              valuePropName="fileList"
              getValueFromEvent={normFile}
              extra={
                <span className="text-xs">
                  {editingProduct
                    ? "Để trống nếu bạn muốn giữ lại ảnh cũ."
                    : "Định dạng hỗ trợ: JPG, PNG."}
                </span>
              }
              className="mb-4"
            >
              <Upload
                listType="picture"
                maxCount={1}
                beforeUpload={() => false}
                onChange={(info) => setThumbnailFileList(info.fileList)}
                fileList={thumbnailFileList}
              >
                <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              label={
                <span className="font-medium text-sm md:text-base">
                  Các ảnh phụ (Chất kem, mặt sau...)
                </span>
              }
              valuePropName="fileList"
              getValueFromEvent={normFile}
              extra={
                <span className="text-xs">
                  {editingProduct ? (
                    <span className="text-orange-500">
                      ⚠️ Lưu ý: Nếu tải lên ảnh mới, toàn bộ ảnh phụ cũ sẽ bị
                      thay thế.
                    </span>
                  ) : (
                    "Có thể chọn nhiều ảnh cùng lúc."
                  )}
                </span>
              }
              style={{ marginBottom: 0 }}
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
          </div>

          <Form.Item
            label={
              <span className="font-medium text-sm md:text-base">
                Mô tả sản phẩm
              </span>
            }
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập công dụng, đặc điểm nổi bật của sản phẩm..."
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-medium text-sm md:text-base">
                Thành phần chi tiết (Ingredients)
              </span>
            }
            name="ingredients"
          >
            <TextArea
              rows={3}
              placeholder="VD: Water, Glycerin, Niacinamide..."
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-medium text-sm md:text-base">
                Link mua hàng (Affiliate / Shopee)
              </span>
            }
            name="affiliateUrl"
          >
            <Input size="large" placeholder="https://shopee.vn/..." />
          </Form.Item>

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-4 border-t">
            <Button
              size="large"
              onClick={() => setIsModalVisible(false)}
              className="w-full sm:w-auto"
            >
              Hủy bỏ
            </Button>
            <Button
              size="large"
              type="primary"
              htmlType="submit"
              className="w-full sm:w-auto px-8"
            >
              {editingProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL XEM CHI TIẾT SẢN PHẨM */}
      <Modal
        title={null}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
        centered
        style={{ padding: "0 10px" }}
      >
        {detailProduct && (
          <div className="pt-4">
            <div className="flex justify-between items-start border-b pb-4 mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 pr-2">
                Thông tin chi tiết
              </h2>
              <Tag
                color={
                  detailProduct.approvalStatus === "APPROVED"
                    ? "success"
                    : "warning"
                }
                className="text-xs md:text-sm px-2 md:px-3 py-1 rounded-full whitespace-nowrap"
              >
                {detailProduct.approvalStatus === "APPROVED"
                  ? "Đã duyệt"
                  : "Chờ duyệt"}
              </Tag>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 md:gap-8 mb-8">
              <div className="shrink-0 flex justify-center w-full sm:w-auto">
                <Image
                  width={200}
                  height={200}
                  // ĐÃ SỬA: Bọc hàm getImageUrl
                  src={
                    detailProduct.thumbnailUrl
                      ? getImageUrl(detailProduct.thumbnailUrl)
                      : "https://via.placeholder.com/200"
                  }
                  className="rounded-xl object-cover shadow-md border border-gray-100"
                  fallback="https://via.placeholder.com/200"
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 leading-tight">
                  {detailProduct.name}
                </h3>
                <div className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-xs md:text-sm font-semibold uppercase tracking-wider mb-4">
                  {detailProduct.brand}
                </div>

                <div className="mb-4">
                  <span className="text-gray-500 mr-2 text-sm md:text-base">
                    Danh mục:
                  </span>
                  <Tag color="blue" className="text-xs md:text-sm">
                    {detailProduct.category?.name}
                  </Tag>
                </div>

                {detailProduct.affiliateUrl && (
                  <Button
                    type="primary"
                    href={detailProduct.affiliateUrl}
                    target="_blank"
                    className="mt-2 bg-orange-500 hover:bg-orange-600 border-none shadow-sm w-full sm:w-auto"
                  >
                    Xem Nơi Mua Chính Hãng
                  </Button>
                )}
              </div>
            </div>

            <Descriptions
              bordered
              column={1}
              size="small" // Giảm size description trên màn nhỏ
              className="bg-gray-50/50"
            >
              <Descriptions.Item
                label={
                  <span className="font-bold text-gray-700 w-20 md:w-32 inline-block text-xs md:text-sm">
                    Mô tả
                  </span>
                }
              >
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-justify text-sm md:text-base">
                  {detailProduct.description}
                </div>
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <span className="font-bold text-gray-700 w-20 md:w-32 inline-block text-xs md:text-sm">
                    Thành phần
                  </span>
                }
              >
                {detailProduct.ingredients ? (
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm md:text-base">
                    {detailProduct.ingredients}
                  </div>
                ) : (
                  <span className="italic text-gray-400 text-sm md:text-base">
                    Không có thông tin thành phần.
                  </span>
                )}
              </Descriptions.Item>
            </Descriptions>

            {detailProduct.imagesUrl && (
              <div className="mt-8">
                <h4 className="font-bold text-base md:text-lg mb-4 text-gray-800 border-b pb-2">
                  Hình ảnh tham khảo
                </h4>
                <div className="flex flex-wrap gap-2 md:gap-4 justify-center sm:justify-start">
                  {detailProduct.imagesUrl.split(",").map((img, index) => (
                    <Image
                      key={index}
                      width={100} // Nhỏ lại xíu để nhét được nhiều ảnh trên điện thoại
                      height={100}
                      // ĐÃ SỬA: Bọc hàm getImageUrl
                      src={getImageUrl(img.trim())}
                      className="rounded-lg border border-gray-200 object-cover shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      fallback="https://via.placeholder.com/100"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <Button
                size="large"
                onClick={() => setIsDetailModalVisible(false)}
                className="w-full sm:w-auto"
              >
                Đóng cửa sổ
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageProduct;
