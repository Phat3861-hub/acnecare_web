import React, { useState, useEffect } from "react";
import {
  Card,
  Col,
  Row,
  Input,
  Select,
  Button,
  Typography,
  message,
  Tag,
  Divider,
  Empty,
  Spin,
  Form,
} from "antd";
import {
  SaveOutlined,
  DeleteOutlined,
  SunOutlined,
  ClockCircleOutlined,
  MoonOutlined,
} from "@ant-design/icons";
import { PatientRoutineService } from "../../services/PatientRoutineService";
import { useLocation, useNavigate } from "react-router-dom"; // Thêm hook điều hướng

const { Title, Text } = Typography;
const { Search, TextArea } = Input;
const { Option } = Select;

const RoutineBuilder = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();

  // Dữ liệu truyền từ trang MyRoutines (nếu bấm nút Cập nhật)
  const editData = location.state?.editData;
  const [editingId, setEditingId] = useState(null);

  // State quản lý dữ liệu kho sản phẩm
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State quản lý Routine đang kéo thả
  const [routineSteps, setRoutineSteps] = useState({
    MORNING: [],
    AFTERNOON: [],
    EVENING: [],
  });

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
  useEffect(() => {
    fetchInitialData();

    // NẾU CÓ DỮ LIỆU EDIT ĐẨY SANG -> ĐIỀN VÀO FORM & KÉO THẢ
    if (editData) {
      setEditingId(editData.id);
      form.setFieldsValue({
        routineName: editData.routineName,
        note: editData.note,
      });

      const initSteps = { MORNING: [], AFTERNOON: [], EVENING: [] };
      if (editData.steps) {
        // Phân loại sản phẩm vào đúng buổi
        editData.steps.forEach((step) => {
          initSteps[step.timeOfDay].push({
            product: step.product,
            notes: step.notes || "",
            stepOrder: step.stepOrder,
          });
        });

        // Sắp xếp lại thứ tự các bước cho chuẩn
        Object.keys(initSteps).forEach((time) => {
          initSteps[time].sort((a, b) => a.stepOrder - b.stepOrder);
        });
      }
      setRoutineSteps(initSteps);
    }
  }, [editData, form]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        PatientRoutineService.getAllProducts(),
        PatientRoutineService.getAllCategories(),
      ]);
      setProducts(prodRes.data?.result || []);
      setFilteredProducts(prodRes.data?.result || []);
      setCategories(catRes.data?.result || []);
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (categoryId, keyword) => {
    let result = products;
    if (categoryId)
      result = result.filter((p) => p.category?.id === categoryId);
    if (keyword)
      result = result.filter((p) =>
        p.name.toLowerCase().includes(keyword.toLowerCase()),
      );
    setFilteredProducts(result);
  };

  const handleDragStart = (e, product) => {
    e.dataTransfer.setData("product", JSON.stringify(product));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, timeOfDay) => {
    e.preventDefault();
    const productData = e.dataTransfer.getData("product");
    if (productData) {
      const product = JSON.parse(productData);

      const isExist = routineSteps[timeOfDay].find(
        (item) => item.product.id === product.id,
      );
      if (isExist) {
        return message.warning("Sản phẩm này đã có trong buổi này rồi!");
      }

      setRoutineSteps((prev) => ({
        ...prev,
        [timeOfDay]: [...prev[timeOfDay], { product, notes: "" }],
      }));
    }
  };

  const removeStep = (timeOfDay, productId) => {
    setRoutineSteps((prev) => ({
      ...prev,
      [timeOfDay]: prev[timeOfDay].filter(
        (item) => item.product.id !== productId,
      ),
    }));
  };

  // Hàm xử lý ghi chú từng sản phẩm (Ví dụ: "Bôi 1 lớp mỏng")
  const handleNoteChange = (timeOfDay, productId, value) => {
    setRoutineSteps((prev) => {
      const newSteps = [...prev[timeOfDay]];
      const index = newSteps.findIndex((item) => item.product.id === productId);
      if (index !== -1) {
        newSteps[index].notes = value;
      }
      return { ...prev, [timeOfDay]: newSteps };
    });
  };

  // LƯU HOẶC CẬP NHẬT
  const handleSaveRoutine = async () => {
    try {
      const values = await form.validateFields();

      const stepsPayload = [];
      Object.keys(routineSteps).forEach((timeOfDay) => {
        routineSteps[timeOfDay].forEach((item, index) => {
          stepsPayload.push({
            productId: item.product.id,
            timeOfDay: timeOfDay,
            stepOrder: index + 1,
            notes: item.notes,
          });
        });
      });

      if (stepsPayload.length === 0) {
        return message.error(
          "Vui lòng kéo thả ít nhất 1 sản phẩm vào lịch trình!",
        );
      }

      const payload = {
        routineName: values.routineName,
        note: values.note,
        steps: stepsPayload,
      };

      setIsSaving(true);

      // LOGIC KIỂM TRA: Cập nhật hay Thêm mới
      if (editingId) {
        await PatientRoutineService.updateRoutine(editingId, payload);
        message.success("Cập nhật lịch trình thành công!");
      } else {
        await PatientRoutineService.createRoutine(payload);
        message.success("Tạo lịch trình thành công!");
      }

      // Đẩy người dùng về lại trang danh sách Routine sau khi lưu xong
      navigate("/my-routines");
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          "Lưu thất bại, vui lòng kiểm tra lại!",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderDropZone = (title, timeOfDay, icon, bgColor) => (
    <div
      className={`p-4 rounded-lg mb-4 border-2 border-dashed ${bgColor} transition-all duration-300 min-h-[150px]`}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, timeOfDay)}
    >
      <div className="flex items-center mb-3">
        {icon} <strong className="ml-2 text-lg">{title}</strong>
      </div>

      {routineSteps[timeOfDay].length === 0 ? (
        <div className="text-gray-400 text-center py-6">
          Kéo sản phẩm và thả vào đây
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {routineSteps[timeOfDay].map((item, index) => (
            <div
              key={item.product.id}
              className="bg-white p-3 rounded shadow-sm border"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 border border-blue-200">
                    {index + 1}
                  </div>
                  <img
                    // ĐÃ SỬA: Chèn hàm getImageUrl vào đây
                    src={
                      getImageUrl(item.product.thumbnailUrl) ||
                      "https://via.placeholder.com/50"
                    }
                    alt="thumb"
                    className="w-10 h-10 object-cover rounded border"
                  />
                  <div>
                    <div className="font-semibold text-sm line-clamp-1">
                      {item.product.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.product.brand}
                    </div>
                  </div>
                </div>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeStep(timeOfDay, item.product.id)}
                />
              </div>

              {/* Ô nhập ghi chú sử dụng cho từng sản phẩm */}
              <Input
                size="small"
                placeholder="Ghi chú cách dùng (vd: Bôi 1 lớp mỏng, đợi 5p...)"
                value={item.notes}
                onChange={(e) =>
                  handleNoteChange(timeOfDay, item.product.id, e.target.value)
                }
                className="text-xs mt-1"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Title level={3} className="m-0">
            {editingId ? "Cập Nhật Routine" : "Thiết Kế Routine"}
          </Title>
          <Button onClick={() => navigate("/my-routines")}>Quay lại</Button>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <Card className="rounded-xl shadow-sm h-full">
              <Form form={form} layout="vertical">
                <Form.Item
                  name="routineName"
                  label={<span className="font-bold">Tên Lịch Trình</span>}
                  rules={[{ required: true, message: "Nhập tên lịch trình!" }]}
                >
                  <Input
                    size="large"
                    placeholder="Ví dụ: Phục hồi da sau mụn mùa đông..."
                  />
                </Form.Item>
                <Form.Item
                  name="note"
                  label={<span className="font-bold">Ghi chú tổng quan</span>}
                >
                  <TextArea
                    rows={2}
                    placeholder="Ghi chú thêm về routine này..."
                  />
                </Form.Item>
              </Form>

              <Divider>Kéo Thả Các Bước Skincare</Divider>

              {renderDropZone(
                "Buổi Sáng",
                "MORNING",
                <SunOutlined className="text-yellow-500 text-xl" />,
                "border-yellow-200 bg-yellow-50",
              )}
              {renderDropZone(
                "Buổi Chiều",
                "AFTERNOON",
                <ClockCircleOutlined className="text-orange-500 text-xl" />,
                "border-orange-200 bg-orange-50",
              )}
              {renderDropZone(
                "Buổi Tối",
                "EVENING",
                <MoonOutlined className="text-blue-500 text-xl" />,
                "border-blue-200 bg-blue-50",
              )}

              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                className={`w-full mt-4 ${editingId ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
                onClick={handleSaveRoutine}
                loading={isSaving}
              >
                {editingId ? "Lưu Cập Nhật" : "Lưu Routine Của Tôi"}
              </Button>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card className="rounded-xl shadow-sm h-full">
              <Title level={4} className="mb-4">
                Tủ Sản Phẩm
              </Title>

              <div className="flex gap-2 mb-4">
                <Select
                  allowClear
                  placeholder="Lọc danh mục"
                  className="w-1/2"
                  onChange={(val) => handleFilter(val, null)}
                >
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
                <Search
                  placeholder="Tìm sản phẩm..."
                  className="w-1/2"
                  onSearch={(val) => handleFilter(null, val)}
                />
              </div>

              <div className="h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <div className="flex justify-center p-10">
                    <Spin />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <Empty description="Không tìm thấy sản phẩm nào" />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, product)}
                        className="border rounded-lg p-3 bg-white cursor-grab hover:shadow-md hover:border-blue-400 transition-all flex flex-col items-center text-center"
                      >
                        <img
                          // ĐÃ SỬA: Chèn hàm getImageUrl vào đây
                          src={
                            getImageUrl(product.thumbnailUrl) ||
                            "https://via.placeholder.com/100"
                          }
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded mb-2 pointer-events-none"
                        />
                        <Text strong className="text-sm line-clamp-2 mb-1">
                          {product.name}
                        </Text>
                        <Tag color="blue" className="m-0 text-[10px]">
                          {product.brand}
                        </Tag>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default RoutineBuilder;
