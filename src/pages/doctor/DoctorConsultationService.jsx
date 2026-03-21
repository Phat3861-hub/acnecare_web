import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Space,
  message,
  Tag,
  Popconfirm,
  Card,
  Typography,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { ConsultationService } from "../../services/ConsultationService";
const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const DoctorConsultationService = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await ConsultationService.getMyServices();
      setServices(res.data?.result || []);
    } catch (error) {
      message.error("Không thể tải danh sách dịch vụ!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenModal = (record = null) => {
    setEditingId(record ? record.id : null);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
      form.setFieldsValue({ currency: "VND", isActive: true }); // Giá trị mặc định
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editingId) {
        // Đổi consultationApi thành ConsultationService
        await ConsultationService.updateService(editingId, values);
        message.success("Cập nhật dịch vụ thành công!");
      } else {
        // Đổi consultationApi thành ConsultationService
        await ConsultationService.createService(values);
        message.success("Thêm mới dịch vụ thành công!");
      }
      setIsModalVisible(false);
      fetchServices();
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      // Đổi consultationApi thành ConsultationService
      await ConsultationService.deleteService(id);
      message.success("Xóa dịch vụ thành công!");
      fetchServices();
    } catch (error) {
      message.error("Không thể xóa dịch vụ này!");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Tên Dịch Vụ",
      dataIndex: "serviceName",
      key: "serviceName",
      render: (text) => (
        <span className="font-semibold text-blue-600">{text}</span>
      ),
    },
    {
      title: "Hình Thức",
      dataIndex: "mode",
      key: "mode",
      render: (mode) => (
        <Tag color={mode === "ONLINE" ? "green" : "purple"}>{mode}</Tag>
      ),
    },
    {
      title: "Thời Lượng",
      dataIndex: "durationMinutes",
      key: "durationMinutes",
      render: (mins) => `${mins} Phút`,
    },
    {
      title: "Chi Phí",
      dataIndex: "price",
      key: "price",
      render: (price, record) => (
        <span className="font-bold text-red-500">
          {new Intl.NumberFormat("vi-VN").format(price)} {record.currency}
        </span>
      ),
    },
    {
      title: "Trạng Thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "blue" : "default"}>
          {isActive ? "Đang hoạt động" : "Tạm ngưng"}
        </Tag>
      ),
    },
    {
      title: "Hành Động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            className="text-blue-500 hover:text-blue-700"
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa dịch vụ này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Card className="rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <Title level={3} className="m-0 text-gray-800">
              Quản Lý Dịch Vụ Khám Bệnh
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
              className="bg-blue-600 font-semibold"
              size="large"
            >
              Thêm Dịch Vụ
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={services}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>

      <Modal
        title={
          <span className="text-xl font-bold">
            {editingId ? "Cập Nhật Dịch Vụ" : "Thêm Mới Dịch Vụ"}
          </span>
        }
        open={isModalVisible}
        onOk={handleSave}
        onCancel={handleCancel}
        confirmLoading={loading}
        okText="Lưu Lại"
        cancelText="Hủy"
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="serviceName"
            label="Tên Dịch Vụ"
            rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ!" }]}
          >
            <Input
              placeholder="Ví dụ: Khám da liễu tổng quát..."
              size="large"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="mode"
              label="Hình Thức"
              rules={[{ required: true, message: "Vui lòng chọn hình thức!" }]}
            >
              <Select size="large" placeholder="Chọn hình thức">
                <Option value="ONLINE">Trực tuyến (Online)</Option>
                <Option value="OFFLINE">Trực tiếp (Offline)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="durationMinutes"
              label="Thời lượng (Phút)"
              rules={[{ required: true, message: "Vui lòng nhập thời lượng!" }]}
            >
              <InputNumber
                className="w-full"
                size="large"
                min={1}
                placeholder="Ví dụ: 30"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="price"
              label="Chi Phí"
              rules={[{ required: true, message: "Vui lòng nhập chi phí!" }]}
            >
              <InputNumber
                className="w-full"
                size="large"
                min={0}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                placeholder="Ví dụ: 500,000"
              />
            </Form.Item>

            <Form.Item
              name="currency"
              label="Đơn vị tiền tệ"
              rules={[{ required: true, message: "Vui lòng nhập đơn vị!" }]}
            >
              <Input size="large" disabled />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả chi tiết">
            <TextArea
              rows={4}
              placeholder="Nhập mô tả về dịch vụ khám của bạn..."
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái hoạt động"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorConsultationService;
