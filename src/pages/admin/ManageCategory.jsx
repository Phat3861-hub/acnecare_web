import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "../../store/slice/CategorySlice";
import { categoryService } from "../../services/CategoryService";

const ManageCategory = () => {
  const dispatch = useDispatch();
  const { categories, loading } = useSelector((state) => state.category);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const openModal = (record = null) => {
    setEditingCategory(record);
    if (record) form.setFieldsValue({ name: record.name });
    else form.resetFields();
    setIsModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, values);
        message.success("Cập nhật thành công!");
      } else {
        await categoryService.createCategory(values);
        message.success("Thêm mới thành công!");
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
      message.success("Xóa thành công!");
      dispatch(fetchCategories());
    } catch (error) {
      message.error(error.response?.data?.message || "Không thể xóa!");
    }
  };

  const columns = [
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
      className: "font-medium",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => openModal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa danh mục này?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Quản lý Danh mục</h2>
        <Button type="primary" onClick={() => openModal()}>
          + Thêm mới
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingCategory ? "Sửa danh mục" : "Thêm danh mục"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="mt-4"
        >
          <Form.Item
            label="Tên danh mục"
            name="name"
            rules={[{ required: true, message: "Nhập tên danh mục!" }]}
          >
            <Input size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            {editingCategory ? "Cập nhật" : "Thêm mới"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageCategory;
