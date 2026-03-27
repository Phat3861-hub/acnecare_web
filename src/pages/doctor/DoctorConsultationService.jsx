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
        await ConsultationService.updateService(editingId, values);
        message.success("Cập nhật dịch vụ thành công!");
      } else {
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
        <span className="font-semibold text-blue-600 whitespace-nowrap">
          {text}
        </span>
      ),
    },
    {
      title: "Hình Thức",
      dataIndex: "mode",
      key: "mode",
      render: (mode) => (
        <Tag
          color={mode === "ONLINE" ? "green" : "purple"}
          className="whitespace-nowrap"
        >
          {mode}
        </Tag>
      ),
    },
    {
      title: "Thời Lượng",
      dataIndex: "durationMinutes",
      key: "durationMinutes",
      render: (mins) => <span className="whitespace-nowrap">{mins} Phút</span>,
    },
    {
      title: "Chi Phí",
      dataIndex: "price",
      key: "price",
      render: (price, record) => (
        <span className="font-bold text-red-500 whitespace-nowrap">
          {new Intl.NumberFormat("vi-VN").format(price)} {record.currency}
        </span>
      ),
    },
    {
      title: "Trạng Thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag
          color={isActive ? "blue" : "default"}
          className="whitespace-nowrap"
        >
          {isActive ? "Đang hoạt động" : "Tạm ngưng"}
        </Tag>
      ),
    },
    {
      title: "Hành Động",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100"
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title="Xóa dịch vụ này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="bg-red-50 hover:bg-red-100"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    // Responsive padding
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Card className="rounded-xl shadow-sm border border-gray-200">
          {/* Header Card: Xếp dọc trên mobile, ngang trên PC */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 m-0">
              Quản Lý Dịch Vụ Khám
            </h2>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
              className="bg-blue-600 font-semibold w-full sm:w-auto"
              size="large"
            >
              Thêm Dịch Vụ
            </Button>
          </div>

          {/* Wrapper có thanh cuộn ngang để Table không bị nát trên mobile */}
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <Table
              columns={columns}
              dataSource={services}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: "max-content" }} // Nòng cốt để vuốt ngang mượt
            />
          </div>
        </Card>
      </div>

      <Modal
        title={
          <span className="text-lg md:text-xl font-bold">
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
        centered
        style={{ padding: "0 10px" }} // Tránh modal dính sát viền trên mobile siêu nhỏ
      >
        <Form form={form} layout="vertical" className="mt-4 md:mt-6">
          <Form.Item
            name="serviceName"
            label={
              <span className="font-medium text-sm md:text-base">
                Tên Dịch Vụ
              </span>
            }
            rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ!" }]}
          >
            <Input
              placeholder="Ví dụ: Khám da liễu tổng quát..."
              size="large"
            />
          </Form.Item>

          {/* Dùng grid-cols-1 trên mobile, grid-cols-2 trên sm trở lên */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item
              name="mode"
              label={
                <span className="font-medium text-sm md:text-base">
                  Hình Thức
                </span>
              }
              rules={[{ required: true, message: "Vui lòng chọn hình thức!" }]}
            >
              <Select size="large" placeholder="Chọn hình thức">
                <Option value="ONLINE">Trực tuyến (Online)</Option>
                <Option value="OFFLINE">Trực tiếp (Offline)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="durationMinutes"
              label={
                <span className="font-medium text-sm md:text-base">
                  Thời lượng (Phút)
                </span>
              }
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Form.Item
              name="price"
              label={
                <span className="font-medium text-sm md:text-base">
                  Chi Phí
                </span>
              }
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
              label={
                <span className="font-medium text-sm md:text-base">
                  Đơn vị tiền tệ
                </span>
              }
              rules={[{ required: true, message: "Vui lòng nhập đơn vị!" }]}
            >
              <Input size="large" disabled />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label={
              <span className="font-medium text-sm md:text-base">
                Mô tả chi tiết
              </span>
            }
          >
            <TextArea
              rows={4}
              placeholder="Nhập mô tả về dịch vụ khám của bạn..."
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label={
              <span className="font-medium text-sm md:text-base">
                Trạng thái hoạt động
              </span>
            }
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
