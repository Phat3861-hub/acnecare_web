import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Card,
  Tag,
  Empty,
} from "antd";
import {
  AppstoreOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../../store/slice/CategorySlice";
import { categoryService } from "../../services/CategoryService";

const ManageCategory = () => {
  const dispatch = useDispatch();
  const { categories, loading } = useSelector((state) => state.category);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const openModal = (record = null) => {
    setEditingCategory(record);
    if (record) {
      form.setFieldsValue({ name: record.name });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, values);
        message.success("Cập nhật danh mục thành công!");
      } else {
        await categoryService.createCategory(values);
        message.success("Thêm danh mục thành công!");
      }

      setIsModalVisible(false);
      dispatch(fetchCategories());
    } catch (error) {
      message.error(error.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await categoryService.deleteCategory(id);
      message.success("Xóa danh mục thành công!");
      dispatch(fetchCategories());
    } catch (error) {
      message.error(error.response?.data?.message || "Không thể xóa danh mục!");
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((item) =>
      item.name?.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [categories, searchText]);

  const columns = [
    {
      title: "Danh mục",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <div className="group flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border border-blue-100 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
            <FolderOpenOutlined className="text-blue-600 text-lg transition-transform duration-300 group-hover:rotate-6" />
          </div>
          <div>
            <div className="font-semibold text-gray-800 transition-colors duration-300 group-hover:text-blue-700">
              {record.name}
            </div>
            <div className="text-xs text-gray-500">Quản lý nhóm sản phẩm</div>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 180,
      render: () => (
        <Tag className="px-3 py-1 rounded-full font-medium border-0 bg-green-100 text-green-700 shadow-sm">
          Đang hoạt động
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 180,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
            className="text-blue-600 rounded-lg transition-all duration-300 hover:!text-blue-700 hover:!bg-blue-50 hover:scale-105"
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa danh mục này?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="rounded-lg transition-all duration-300 hover:scale-105"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
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
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="uppercase tracking-[0.22em] text-xs text-blue-200 mb-2">
                Category management
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Quản lý danh mục
              </h2>
              <p className="text-slate-300 text-sm md:text-base max-w-2xl">
                Theo dõi, tạo mới và chỉnh sửa danh mục với giao diện hiện đại,
                rõ ràng và dễ thao tác hơn.
              </p>
            </div>

            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
              className="rounded-xl shadow-md w-full lg:w-auto transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
            >
              Thêm danh mục
            </Button>
          </div>
        </div>

        <div className="p-5 md:p-6 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="text-sm text-gray-500">Tổng danh mục</div>
              <div className="text-3xl font-bold text-gray-800 mt-1">
                {categories.length}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="text-sm text-gray-500">Đang hiển thị</div>
              <div className="text-3xl font-bold text-gray-800 mt-1">
                {filteredCategories.length}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="text-sm text-gray-500">Trạng thái hệ thống</div>
              <div className="mt-2">
                <Tag className="px-3 py-1 rounded-full border-0 bg-green-100 text-green-700 shadow-sm">
                  Hoạt động tốt
                </Tag>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 mb-5 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Danh sách danh mục
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Tìm kiếm nhanh và thao tác trực tiếp trên từng danh mục.
                </p>
              </div>

              <Input
                size="large"
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined className="text-gray-400" />}
                placeholder="Tìm tên danh mục..."
                className="w-full md:w-80 rounded-xl transition-all duration-300 hover:border-blue-400 focus-within:shadow-md"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg">
            <Table
              columns={columns}
              dataSource={filteredCategories}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 8,
                showSizeChanger: false,
                showTotal: (total) => `Tổng cộng ${total} danh mục`,
              }}
              rowClassName={() =>
                "transition-all duration-300 hover:bg-blue-50/60"
              }
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có danh mục nào"
                  />
                ),
              }}
            />
          </div>
        </div>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2 text-lg font-bold">
            <AppstoreOutlined className="text-blue-600" />
            {editingCategory ? "Cập nhật danh mục" : "Thêm danh mục mới"}
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        centered
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="mt-5"
        >
          <Form.Item
            label={<span className="font-medium">Tên danh mục</span>}
            name="name"
            rules={[{ required: true, message: "Nhập tên danh mục!" }]}
          >
            <Input
              size="large"
              placeholder="Ví dụ: Chăm sóc da, Trang điểm..."
              className="rounded-xl transition-all duration-300 hover:border-blue-400 focus-within:shadow-md"
            />
          </Form.Item>

          <div className="flex gap-3 pt-2">
            <Button
              size="large"
              onClick={() => setIsModalVisible(false)}
              className="flex-1 rounded-xl transition-all duration-300 hover:scale-[1.02]"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="flex-1 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            >
              {editingCategory ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageCategory;