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
} from "antd";
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
  // 1. LẤY THÔNG TIN USER (KÈM BACKUP TỪ LOCALSTORAGE)
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
  // 2. STATE QUẢN LÝ DỮ LIỆU & TAB
  // ================================================================
  const { products, loading: prodLoading } = useSelector(
    (state) => state.product,
  );
  const { categories } = useSelector((state) => state.category);

  const [activeTab, setActiveTab] = useState("ALL"); // State lưu Tab hiện tại
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchProducts());
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  // ================================================================
  // 3. LOGIC LỌC DỮ LIỆU THEO TAB
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
  // 4. CÁC HÀM XỬ LÝ (MỞ MODAL, LƯU, XÓA)
  // ================================================================
  const openModal = (record = null) => {
    setEditingProduct(record);
    if (record) {
      form.setFieldsValue({
        name: record.name,
        brand: record.brand,
        categoryId: record.category?.id,
        description: record.description,
        thumbnailUrl: record.thumbnailUrl,
        ingredients: record.ingredients,
        affiliateUrl: record.affiliateUrl,
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, values);
        message.success("Cập nhật sản phẩm thành công!");
      } else {
        await productService.createProduct(values);
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

  // ================================================================
  // 5. CẤU HÌNH CỘT BẢNG
  // ================================================================
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "thumbnailUrl",
      render: (url) => <Avatar shape="square" size={64} src={url} />,
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

        if (!canEditOrDelete)
          return <span className="text-gray-400 italic">Chỉ xem</span>;

        return (
          <Space size="middle">
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

      {/* TÍCH HỢP TABS ĐỂ LỌC SẢN PHẨM */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        items={tabItems}
        className="mb-4"
      />

      {/* TRUYỀN DỮ LIỆU ĐÃ LỌC VÀO BẢNG */}
      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey="id"
        loading={prodLoading}
      />

      {/* MODAL THÊM/SỬA */}
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
          <Form.Item label="Link ảnh Thumbnail" name="thumbnailUrl">
            <Input placeholder="https://..." />
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
    </div>
  );
};

export default ManageProduct;
