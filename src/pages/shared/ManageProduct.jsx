import React, { useState, useEffect, useMemo } from "react";
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
  Card,
  Empty,
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
  ShoppingOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../../store/slice/ProductSlice";
import { fetchCategories } from "../../store/slice/CategorySlice";
import { productService } from "../../services/ProductService";
import { jwtDecode } from "jwt-decode";

const { TextArea } = Input;
const { Option } = Select;

const ManageProduct = () => {
  const dispatch = useDispatch();

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

      currentUser = { id: decoded.sub, role };
    }
  }

  const isAdmin = currentUser?.role === "ADMIN";

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

  useEffect(() => {
    dispatch(fetchProducts());
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      let isTabMatch = true;

      if (activeTab === "MINE") {
        isTabMatch = item.createdBy === currentUser?.id;
      }

      if (activeTab === "PENDING") {
        isTabMatch =
          item.approvalStatus === "PENDING" &&
          (isAdmin || item.createdBy === currentUser?.id);
      }

      let isSearchMatch = true;
      if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        const matchName = item.name?.toLowerCase().includes(lowerSearch);
        const matchBrand = item.brand?.toLowerCase().includes(lowerSearch);
        isSearchMatch = matchName || matchBrand;
      }

      return isTabMatch && isSearchMatch;
    });
  }, [products, activeTab, searchText, currentUser?.id, isAdmin]);

  const tabItems = [
    { key: "ALL", label: "Tất cả sản phẩm" },
    { key: "MINE", label: "Của tôi" },
    { key: "PENDING", label: "Chờ duyệt" },
  ];

  const approvedCount = products.filter(
    (item) => item.approvalStatus === "APPROVED",
  ).length;
  const pendingCount = products.filter(
    (item) => item.approvalStatus === "PENDING",
  ).length;

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
            url: record.thumbnailUrl,
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
          url: url.trim(),
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

      if (values.ingredients) {
        formData.append("ingredients", values.ingredients);
      }

      if (values.affiliateUrl) {
        formData.append("affiliateUrl", values.affiliateUrl);
      }

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
        message.success("Thêm sản phẩm thành công!");
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
      message.success("Xóa sản phẩm thành công!");
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

  const columns = [
    {
      title: "Sản phẩm",
      key: "product",
      render: (_, record) => (
        <div className="group flex items-center gap-3 min-w-[240px]">
          <Avatar
            shape="square"
            size={56}
            src={record.thumbnailUrl || "https://via.placeholder.com/56"}
            className="border border-gray-200 shadow-sm rounded-xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-md"
          />
          <div>
            <div className="font-semibold text-gray-800 leading-tight transition-colors duration-300 group-hover:text-blue-700">
              {record.name}
            </div>
            <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
              {record.brand}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Danh mục",
      key: "category",
      width: 180,
      render: (_, record) => (
        <Tag className="px-3 py-1 rounded-full border-0 bg-blue-100 text-blue-700 shadow-sm">
          {record.category?.name}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "approvalStatus",
      width: 160,
      render: (status) => (
        <Tag
          className={`px-3 py-1 rounded-full font-medium border-0 shadow-sm ${
            status === "APPROVED"
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {status === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 240,
      align: "center",
      render: (_, record) => {
        const isOwner = currentUser?.id === record.createdBy;
        const canEditOrDelete = isAdmin || isOwner;

        return (
          <Space size="small" wrap>
            <Tooltip title="Xem chi tiết">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => openDetailModal(record)}
                className="text-blue-600 rounded-lg transition-all duration-300 hover:!bg-blue-50 hover:scale-105"
              />
            </Tooltip>

            {isAdmin && record.approvalStatus === "PENDING" && (
              <Popconfirm
                title="Duyệt sản phẩm này?"
                onConfirm={() => handleUpdateStatus(record.id, "APPROVED")}
              >
                <Tooltip title="Duyệt">
                  <Button
                    type="text"
                    icon={<CheckCircleOutlined />}
                    className="text-green-600 rounded-lg transition-all duration-300 hover:!bg-green-50 hover:scale-105"
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
                    icon={<CloseCircleOutlined />}
                    className="text-orange-500 rounded-lg transition-all duration-300 hover:!bg-orange-50 hover:scale-105"
                  />
                </Tooltip>
              </Popconfirm>
            )}

            {canEditOrDelete && (
              <>
                <Tooltip title="Chỉnh sửa">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => openModal(record)}
                    className="text-gray-700 rounded-lg transition-all duration-300 hover:!bg-gray-100 hover:scale-105"
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
                      className="rounded-lg transition-all duration-300 hover:scale-105"
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
    <div className="min-h-screen bg-transparent">
      <Card
        bordered={false}
        className="rounded-2xl shadow-sm overflow-hidden border-0"
        bodyStyle={{ padding: 0 }}
      >
        <div className="px-6 md:px-8 py-7 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_28%)]" />
          <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div>
              <div className="uppercase tracking-[0.22em] text-xs text-blue-200 mb-2">
                Product management
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Quản lý sản phẩm
              </h2>
              <p className="text-slate-300 text-sm md:text-base max-w-2xl">
                Quản lý danh sách sản phẩm, duyệt nội dung và cập nhật thông tin
                trong một giao diện trực quan và hiện đại hơn.
              </p>
            </div>

            <Button
              type="primary"
              onClick={() => openModal()}
              size="large"
              icon={<PlusOutlined />}
              className="rounded-xl shadow-md w-full xl:w-auto transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
            >
              Thêm sản phẩm
            </Button>
          </div>
        </div>

        <div className="p-5 md:p-6 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Tổng sản phẩm</div>
                  <div className="text-3xl font-bold text-gray-800 mt-1">
                    {products.length}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <ShoppingOutlined className="text-blue-600 text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Đã duyệt</div>
                  <div className="text-3xl font-bold text-gray-800 mt-1">
                    {approvedCount}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <CheckCircleOutlined className="text-green-600 text-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Chờ duyệt</div>
                  <div className="text-3xl font-bold text-gray-800 mt-1">
                    {pendingCount}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <ClockCircleOutlined className="text-orange-500 text-lg" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-5 transition-all duration-300 hover:shadow-md">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="w-full xl:w-auto overflow-x-auto">
                <Tabs
                  activeKey={activeTab}
                  onChange={(key) => setActiveTab(key)}
                  items={tabItems}
                />
              </div>

              <Input
                placeholder="Tìm tên hoặc thương hiệu..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                className="w-full xl:w-80 rounded-xl transition-all duration-300 hover:border-blue-400 focus-within:shadow-md"
                size="large"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg">
            <Table
              columns={columns}
              dataSource={filteredProducts}
              rowKey="id"
              loading={prodLoading}
              pagination={{
                pageSize: 8,
                showSizeChanger: true,
                showTotal: (total) => `Tổng cộng ${total} sản phẩm`,
              }}
              rowClassName={() =>
                "transition-all duration-300 hover:bg-blue-50/50"
              }
              scroll={{ x: "max-content" }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có sản phẩm nào"
                  />
                ),
              }}
            />
          </div>
        </div>
      </Card>

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
        width={780}
        destroyOnClose
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="mt-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
            <Form.Item
              label={<span className="font-medium">Tên sản phẩm</span>}
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm!" }]}
            >
              <Input
                size="large"
                placeholder="Ví dụ: Sữa rửa mặt Cetaphil"
                className="rounded-xl transition-all duration-300 hover:border-blue-400 focus-within:shadow-md"
              />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Thương hiệu</span>}
              name="brand"
              rules={[{ required: true, message: "Vui lòng nhập thương hiệu!" }]}
            >
              <Input
                size="large"
                placeholder="Ví dụ: Cetaphil"
                className="rounded-xl transition-all duration-300 hover:border-blue-400 focus-within:shadow-md"
              />
            </Form.Item>
          </div>

          <Form.Item
            label={<span className="font-medium">Danh mục</span>}
            name="categoryId"
            rules={[{ required: true, message: "Vui lòng chọn danh mục phù hợp!" }]}
          >
            <Select
              size="large"
              placeholder="-- Chọn danh mục phù hợp --"
              className="rounded-xl"
            >
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="bg-slate-50 border border-gray-100 rounded-2xl p-4 mb-5 transition-all duration-300 hover:shadow-sm">
            <Form.Item
              label={<span className="font-medium">Ảnh thumbnail</span>}
              valuePropName="fileList"
              getValueFromEvent={normFile}
              className="mb-4"
            >
              <Upload
                listType="picture"
                maxCount={1}
                beforeUpload={() => false}
                onChange={(info) => setThumbnailFileList(info.fileList)}
                fileList={thumbnailFileList}
              >
                <Button
                  icon={<UploadOutlined />}
                  className="rounded-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  Tải ảnh đại diện
                </Button>
              </Upload>
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Ảnh phụ</span>}
              valuePropName="fileList"
              getValueFromEvent={normFile}
              style={{ marginBottom: 0 }}
            >
              <Upload
                listType="picture"
                multiple
                beforeUpload={() => false}
                onChange={(info) => setImageFileList(info.fileList)}
                fileList={imageFileList}
              >
                <Button
                  icon={<UploadOutlined />}
                  className="rounded-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  Chọn nhiều ảnh
                </Button>
              </Upload>
            </Form.Item>
          </div>

          <Form.Item
            label={<span className="font-medium">Mô tả sản phẩm</span>}
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập công dụng, đặc điểm nổi bật của sản phẩm..."
              className="rounded-xl transition-all duration-300 hover:border-blue-400 focus-within:shadow-md"
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium">Thành phần chi tiết</span>}
            name="ingredients"
          >
            <TextArea
              rows={3}
              placeholder="Ví dụ: Water, Glycerin, Niacinamide..."
              className="rounded-xl transition-all duration-300 hover:border-blue-400 focus-within:shadow-md"
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium">Link mua hàng</span>}
            name="affiliateUrl"
          >
            <Input
              size="large"
              placeholder="https://shopee.vn/..."
              className="rounded-xl transition-all duration-300 hover:border-blue-400 focus-within:shadow-md"
            />
          </Form.Item>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t">
            <Button
              size="large"
              onClick={() => setIsModalVisible(false)}
              className="rounded-xl w-full sm:w-auto transition-all duration-300 hover:scale-[1.02]"
            >
              Hủy
            </Button>
            <Button
              size="large"
              type="primary"
              htmlType="submit"
              className="rounded-xl w-full sm:w-auto transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            >
              {editingProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={null}
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={820}
        centered
      >
        {detailProduct && (
          <div className="pt-3">
            <div className="flex justify-between items-start border-b pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {detailProduct.name}
                </h2>
                <div className="text-sm text-gray-500">
                  {detailProduct.brand}
                </div>
              </div>

              <Tag
                className={`px-3 py-1 rounded-full border-0 shadow-sm ${
                  detailProduct.approvalStatus === "APPROVED"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {detailProduct.approvalStatus === "APPROVED"
                  ? "Đã duyệt"
                  : "Chờ duyệt"}
              </Tag>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
              <div>
                <Image
                  width={220}
                  height={220}
                  src={
                    detailProduct.thumbnailUrl ||
                    "https://via.placeholder.com/220"
                  }
                  className="rounded-2xl object-cover border border-gray-100 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                  fallback="https://via.placeholder.com/220"
                />
              </div>

              <div>
                <Descriptions bordered column={1} size="middle">
                  <Descriptions.Item
                    label={<span className="font-medium">Danh mục</span>}
                  >
                    <Tag className="border-0 bg-blue-100 text-blue-700 rounded-full">
                      {detailProduct.category?.name}
                    </Tag>
                  </Descriptions.Item>

                  <Descriptions.Item
                    label={<span className="font-medium">Mô tả</span>}
                  >
                    <div className="whitespace-pre-wrap text-gray-700">
                      {detailProduct.description}
                    </div>
                  </Descriptions.Item>

                  <Descriptions.Item
                    label={<span className="font-medium">Thành phần</span>}
                  >
                    {detailProduct.ingredients ? (
                      <div className="whitespace-pre-wrap text-gray-700">
                        {detailProduct.ingredients}
                      </div>
                    ) : (
                      <span className="italic text-gray-400">
                        Không có thông tin thành phần.
                      </span>
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item
                    label={<span className="font-medium">Link mua hàng</span>}
                  >
                    {detailProduct.affiliateUrl ? (
                      <a
                        href={detailProduct.affiliateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 font-medium transition-all duration-300 hover:text-blue-700 hover:underline"
                      >
                        Mở liên kết mua hàng
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">
                        Chưa có liên kết
                      </span>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </div>

            {detailProduct.imagesUrl && (
              <div className="mt-8">
                <h4 className="font-semibold text-gray-800 mb-4">
                  Hình ảnh tham khảo
                </h4>
                <div className="flex flex-wrap gap-3">
                  {detailProduct.imagesUrl.split(",").map((img, index) => (
                    <Image
                      key={index}
                      width={100}
                      height={100}
                      src={img.trim()}
                      className="rounded-xl border border-gray-200 object-cover transition-all duration-300 hover:scale-105 hover:shadow-md"
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