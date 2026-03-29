import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCaseById,
  clearCurrentCase,
} from "../../store/slice/TreatmentCaseSlice";
import { treatmentPlanService } from "../../services/TreatmentPlanService";
import { PatientRoutineService } from "../../services/PatientRoutineService";
import {
  Spin,
  Breadcrumb,
  Tag,
  Descriptions,
  Timeline,
  Card,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Modal,
  message,
  Popconfirm,
  Divider,
  Row,
  Col,
  Empty,
  Typography,
} from "antd";
import {
  HomeOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  SyncOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  SunOutlined,
  MoonOutlined,
  EditOutlined, // Thêm icon Edit
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { Search, TextArea } = Input;
const { Title, Text } = Typography;

const TreatmentCaseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentCase, loading } = useSelector((state) => state.treatmentCase);
  const currentUserStr = localStorage.getItem("userInfo");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isDoctor = currentUser?.role === "DOCTOR";

  const [isPlanModalVisible, setIsPlanModalVisible] = useState(false);
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // BIẾN QUẢN LÝ CHỈNH SỬA
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planForm] = Form.useForm();

  // STATE QUẢN LÝ DỮ LIỆU KHO SẢN PHẨM
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // STATE QUẢN LÝ DRAG & DROP PHÁC ĐỒ
  const [planSteps, setPlanSteps] = useState({
    MORNING: [],
    AFTERNOON: [],
    EVENING: [],
  });

  useEffect(() => {
    dispatch(fetchCaseById(id));
    return () => {
      dispatch(clearCurrentCase());
    };
  }, [dispatch, id]);

  // Lấy dữ liệu sản phẩm khi mở Modal kê phác đồ
  useEffect(() => {
    if (isPlanModalVisible && products.length === 0) {
      fetchProductData();
    }
  }, [isPlanModalVisible, products.length]);

  const fetchProductData = async () => {
    setLoadingProducts(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        PatientRoutineService.getAllProducts(),
        PatientRoutineService.getAllCategories(),
      ]);
      setProducts(prodRes.data?.result || []);
      setFilteredProducts(prodRes.data?.result || []);
      setCategories(catRes.data?.result || []);
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu tủ sản phẩm.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleFilterProducts = (categoryId, keyword) => {
    let result = products;
    if (categoryId)
      result = result.filter((p) => p.category?.id === categoryId);
    if (keyword)
      result = result.filter((p) =>
        p.name.toLowerCase().includes(keyword.toLowerCase()),
      );
    setFilteredProducts(result);
  };

  // ==================== LOGIC DRAG & DROP ====================
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

      // Kiểm tra trùng lặp trong cùng một cữ
      const isExist = planSteps[timeOfDay].find(
        (item) => item.productId === product.id,
      );
      if (isExist) {
        return message.warning("Sản phẩm này đã có trong cữ này rồi!");
      }

      setPlanSteps((prev) => ({
        ...prev,
        [timeOfDay]: [
          ...prev[timeOfDay],
          {
            uid:
              Date.now().toString() + Math.random().toString(36).substring(7), // Thêm random để chắc chắn uid là duy nhất
            productId: product.id,
            customName: product.name,
            thumbnailUrl: product.thumbnailUrl,
            brand: product.brand,
            usageInstruction: "",
            durationDays: 30,
            isCustom: false,
          },
        ],
      }));
    }
  };

  // Hàm thêm "Thuốc ngoài" (nhập tay)
  const addCustomItem = (timeOfDay) => {
    setPlanSteps((prev) => ({
      ...prev,
      [timeOfDay]: [
        ...prev[timeOfDay],
        {
          uid: Date.now().toString() + Math.random().toString(36).substring(7),
          productId: null,
          customName: "",
          thumbnailUrl: null,
          brand: "Thuốc ngoài/Tùy chỉnh",
          usageInstruction: "",
          durationDays: 7,
          isCustom: true,
        },
      ],
    }));
  };

  const removeStep = (timeOfDay, uid) => {
    setPlanSteps((prev) => ({
      ...prev,
      [timeOfDay]: prev[timeOfDay].filter((item) => item.uid !== uid),
    }));
  };

  const handleItemChange = (timeOfDay, uid, field, value) => {
    setPlanSteps((prev) => {
      const newSteps = [...prev[timeOfDay]];
      const index = newSteps.findIndex((item) => item.uid === uid);
      if (index !== -1) {
        newSteps[index][field] = value;
      }
      return { ...prev, [timeOfDay]: newSteps };
    });
  };

  // ==================== HÀM MỞ MODAL ====================

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingPlanId(null);
    planForm.resetFields();
    setPlanSteps({ MORNING: [], AFTERNOON: [], EVENING: [] });
    setIsPlanModalVisible(true);
  };

  // Mở modal chỉnh sửa (Nạp dữ liệu từ phác đồ cũ vào form)
  const handleEditPlan = () => {
    const latestPlan = currentCase.treatmentPlans[0];
    if (!latestPlan) return;

    setEditingPlanId(latestPlan.id);

    // Nạp ghi chú
    planForm.setFieldsValue({
      notes: latestPlan.notes || "",
    });

    // Nạp danh sách sản phẩm
    const steps = { MORNING: [], AFTERNOON: [], EVENING: [] };

    latestPlan.items.forEach((item, index) => {
      const isCustomItem = !item.product;
      steps[item.timeSlot].push({
        uid: `edit-${index}-${Date.now()}`,
        productId: isCustomItem ? null : item.product.id,
        customName: isCustomItem ? item.customName : item.product.name,
        thumbnailUrl: isCustomItem ? null : item.product.thumbnailUrl,
        brand: isCustomItem ? "Thuốc ngoài/Tùy chỉnh" : item.product.brand,
        usageInstruction: item.usageInstruction || "",
        durationDays: item.durationDays || 30,
        isCustom: isCustomItem,
        stepOrder: item.stepOrder, // Giữ lại stepOrder để sort
      });
    });

    // Sắp xếp lại thứ tự theo stepOrder trước khi nạp vào state
    Object.keys(steps).forEach((time) => {
      steps[time].sort((a, b) => a.stepOrder - b.stepOrder);
    });

    setPlanSteps(steps);
    setIsPlanModalVisible(true);
  };

  // ==================== SUBMIT API (LƯU & CẬP NHẬT) ====================
  const handleCreatePlan = async () => {
    try {
      const values = await planForm.validateFields();
      const stepsPayload = [];
      let hasItem = false;
      let hasValidationError = false;

      Object.keys(planSteps).forEach((timeSlot) => {
        planSteps[timeSlot].forEach((item, index) => {
          hasItem = true;

          if (
            !item.usageInstruction ||
            !item.durationDays ||
            (item.isCustom && !item.customName)
          ) {
            hasValidationError = true;
          }

          stepsPayload.push({
            productId: item.productId || null,
            customName: item.customName?.trim() || "Sản phẩm không tên",
            stepOrder: index + 1,
            timeSlot: timeSlot,
            usageInstruction: item.usageInstruction?.trim() || "",
            durationDays: item.durationDays || 1,
          });
        });
      });

      if (!hasItem) {
        return message.error("Vui lòng kê ít nhất 1 sản phẩm vào phác đồ!");
      }

      if (hasValidationError) {
        return message.error(
          "Vui lòng điền đầy đủ Tên (nếu là thuốc ngoài), HDSD và Số ngày cho tất cả sản phẩm.",
        );
      }

      setSubmittingPlan(true);

      const payload = {
        notes: values.notes || "",
        items: stepsPayload,
      };

      // Xác định gọi API tạo mới hay cập nhật
      if (editingPlanId) {
        await treatmentPlanService.updatePlan(editingPlanId, payload);
        message.success("Cập nhật phác đồ thành công!");
      } else {
        await treatmentPlanService.createPlan(id, payload);
        message.success("Kê phác đồ thành công!");
      }

      // Reset Modal & Refresh dữ liệu
      setIsPlanModalVisible(false);
      setEditingPlanId(null);
      planForm.resetFields();
      setPlanSteps({ MORNING: [], AFTERNOON: [], EVENING: [] });
      dispatch(fetchCaseById(id));
    } catch (error) {
      if (error.errorFields) return;
      message.error(error.response?.data?.message || "Lỗi khi lưu phác đồ");
      console.error("Plan Error:", error);
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleSyncRoutine = async (planId) => {
    setSyncing(true);
    try {
      await treatmentPlanService.applyToRoutine(planId);
      message.success(
        "Đã đồng bộ phác đồ vào Lịch trình chăm sóc da của bạn thành công!",
      );
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Lỗi đồng bộ";
      if (errorMsg.includes("Không có sản phẩm hợp lệ")) {
        message.error(
          "Không thể đồng bộ vì Bác sĩ chưa kê sản phẩm nào có sẵn trong hệ thống.",
        );
      } else {
        message.error(`Lỗi: ${errorMsg}`);
      }
    } finally {
      setSyncing(false);
    }
  };

  // Render Vùng Kéo Thả
  const renderDropZone = (title, timeOfDay, icon, bgColor) => (
    <div
      className={`p-4 rounded-xl mb-5 border-2 border-dashed ${bgColor} transition-all duration-300 min-h-[150px]`}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, timeOfDay)}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center text-gray-700">
          {icon}{" "}
          <strong className="ml-2 text-lg uppercase tracking-wide">
            {title}
          </strong>
        </div>
        <Button
          size="small"
          type="dashed"
          className="border-gray-400 text-gray-600 hover:text-purple-600 hover:border-purple-600"
          onClick={() => addCustomItem(timeOfDay)}
        >
          + Thêm thuốc ngoài
        </Button>
      </div>

      {planSteps[timeOfDay].length === 0 ? (
        <div className="text-gray-400 text-center py-8 bg-white/50 rounded-lg border border-transparent border-dashed">
          Kéo sản phẩm từ tủ thuốc thả vào đây, hoặc thêm thuốc ngoài
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {planSteps[timeOfDay].map((item, index) => (
            <div
              key={item.uid}
              className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 hover:border-purple-300 transition-colors relative group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center font-black text-purple-600 border border-purple-100 shrink-0">
                    {index + 1}
                  </div>

                  {!item.isCustom && (
                    <img
                      src={
                        item.thumbnailUrl || "https://via.placeholder.com/50"
                      }
                      alt="thumb"
                      className="w-10 h-10 object-cover rounded border shrink-0"
                    />
                  )}

                  <div className="flex-1">
                    {item.isCustom ? (
                      <Input
                        size="small"
                        placeholder="Nhập tên thuốc/sản phẩm..."
                        value={item.customName}
                        onChange={(e) =>
                          handleItemChange(
                            timeOfDay,
                            item.uid,
                            "customName",
                            e.target.value,
                          )
                        }
                        className="font-semibold mb-1 w-full"
                      />
                    ) : (
                      <div className="font-bold text-gray-800 text-sm line-clamp-1">
                        {item.customName}
                      </div>
                    )}
                    <div className="text-[11px] text-gray-500 font-medium">
                      {item.brand}{" "}
                      {item.productId &&
                        `| ID: ${item.productId.slice(0, 6)}...`}
                    </div>
                  </div>
                </div>

                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeStep(timeOfDay, item.uid)}
                  className="shrink-0 opacity-50 hover:opacity-100"
                />
              </div>

              <div className="grid grid-cols-4 gap-3 mt-3 pl-11">
                <div className="col-span-3">
                  <Input
                    size="small"
                    placeholder="Ghi chú cách dùng (VD: Bôi 1 lớp mỏng...)"
                    value={item.usageInstruction}
                    onChange={(e) =>
                      handleItemChange(
                        timeOfDay,
                        item.uid,
                        "usageInstruction",
                        e.target.value,
                      )
                    }
                  />
                </div>
                <div className="col-span-1">
                  <InputNumber
                    size="small"
                    placeholder="Ngày"
                    min={1}
                    max={180}
                    value={item.durationDays}
                    onChange={(val) =>
                      handleItemChange(timeOfDay, item.uid, "durationDays", val)
                    }
                    className="w-full"
                    addonAfter="ngày"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading || !currentCase)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" tip="Đang tải hồ sơ..." />
      </div>
    );

  const latestPlan =
    currentCase.treatmentPlans && currentCase.treatmentPlans.length > 0
      ? currentCase.treatmentPlans[0]
      : null;

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 md:px-12 lg:px-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Breadcrumb>
            <Breadcrumb.Item
              onClick={() =>
                navigate(
                  isDoctor ? "/doctor/treatment-cases" : "/my-treatment-cases",
                )
              }
              className="cursor-pointer font-medium text-blue-600 hover:underline"
            >
              <HomeOutlined /> Danh sách Hồ sơ
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              Hồ sơ #{currentCase.id.slice(0, 8)}
            </Breadcrumb.Item>
          </Breadcrumb>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-black text-[#1e255e] mb-2">
                Hồ sơ Điều trị Da liễu
              </h2>
              <div className="flex items-center gap-3">
                <Tag
                  color={currentCase.status === "ACTIVE" ? "green" : "default"}
                  className="m-0 font-medium px-3 py-1 rounded-full"
                >
                  {currentCase.status === "ACTIVE"
                    ? "Đang điều trị"
                    : "Đã đóng"}
                </Tag>
                <span className="text-gray-500 text-sm">
                  Bắt đầu:{" "}
                  <strong className="text-gray-700">
                    {dayjs(currentCase.startDate).format("DD/MM/YYYY")}
                  </strong>
                </span>
              </div>
            </div>

            {/* HIỂN THỊ NÚT THIẾT KẾ PHÁC ĐỒ NẾU CHƯA CÓ */}
            {isDoctor && currentCase.status === "ACTIVE" && !latestPlan && (
              <Button
                type="primary"
                icon={<MedicineBoxOutlined />}
                className="bg-purple-600 hover:bg-purple-500 font-semibold rounded-lg h-10 px-6 shadow-sm border-none"
                onClick={handleOpenCreateModal}
              >
                Thiết Kế Phác Đồ Mới
              </Button>
            )}
          </div>

          <Descriptions column={{ xs: 1, sm: 2 }} className="mb-2" size="small">
            <Descriptions.Item
              label={
                <span className="font-semibold text-gray-500">
                  <UserOutlined /> Bệnh nhân
                </span>
              }
            >
              <span className="text-base font-bold text-gray-800">
                {currentCase.patientName}
              </span>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span className="font-semibold text-gray-500">
                  <MedicineBoxOutlined /> Bác sĩ phụ trách
                </span>
              }
            >
              <span className="text-base font-bold text-gray-800">
                BS. {currentCase.doctorName}
              </span>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span className="font-semibold text-gray-500">
                  Vấn đề cần khám (Chief Complaint)
                </span>
              }
              span={2}
            >
              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-gray-700 w-full mt-1 font-medium">
                {currentCase.chiefComplaint || "Không có thông tin"}
              </div>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* ================= KHU VỰC HIỂN THỊ PHÁC ĐỒ ĐIỀU TRỊ ================= */}
        {latestPlan && (
          <div className="bg-gradient-to-r from-purple-50 to-white p-6 md:p-8 rounded-2xl shadow-sm border border-purple-100 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform translate-x-10 -translate-y-10"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-purple-100 pb-4 relative z-10 gap-4">
              <div>
                <h3 className="text-xl font-bold text-purple-800 m-0 flex items-center gap-2">
                  <MedicineBoxOutlined /> Phác đồ điều trị hiện tại
                </h3>
                <span className="text-sm text-purple-500">
                  Cập nhật:{" "}
                  {dayjs(latestPlan.createdAt).format("DD/MM/YYYY HH:mm")}
                </span>
              </div>

              <div className="flex gap-2">
                {/* BỆNH NHÂN: Nút Áp dụng vào Routine */}
                {!isDoctor && (
                  <Popconfirm
                    title="Đồng bộ vào Routine?"
                    description={
                      <span>
                        Hệ thống sẽ tạo một lịch trình mới dựa trên phác đồ này.
                        <br />
                        (Chỉ đồng bộ các sản phẩm có ID trong hệ thống)
                      </span>
                    }
                    onConfirm={() => handleSyncRoutine(latestPlan.id)}
                    okText="Đồng ý"
                    cancelText="Hủy"
                  >
                    <Button
                      type="primary"
                      icon={<SyncOutlined spin={syncing} />}
                      loading={syncing}
                      className="bg-green-600 hover:bg-green-500 font-bold shadow-md border-none rounded-lg h-10 px-6"
                    >
                      Áp dụng vào Routine
                    </Button>
                  </Popconfirm>
                )}

                {/* BÁC SĨ: Nút Chỉnh sửa */}
                {isDoctor && currentCase.status === "ACTIVE" && (
                  <Button
                    type="primary"
                    ghost
                    icon={<EditOutlined />}
                    className="border-purple-600 text-purple-600 font-bold h-10 px-6 rounded-lg bg-white"
                    onClick={handleEditPlan}
                  >
                    Chỉnh sửa Phác đồ
                  </Button>
                )}
              </div>
            </div>

            <div className="relative z-10">
              {latestPlan.notes && (
                <div className="bg-white/80 p-4 rounded-xl border border-purple-100 mb-5 shadow-sm">
                  <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
                    Ghi chú từ bác sĩ:
                  </div>
                  <p className="italic text-gray-700 m-0">{latestPlan.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...latestPlan.items]
                  .sort((a, b) => a.stepOrder - b.stepOrder)
                  .map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:border-purple-200 transition-colors relative"
                    >
                      <div className="absolute -top-3 -left-3 w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex justify-center items-center font-black text-xs border border-white shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="flex justify-between items-start mb-2 mt-1">
                        <span className="font-bold text-gray-800 text-base line-clamp-1 pr-2">
                          {item.product?.name ||
                            item.customName ||
                            "Sản phẩm chưa rõ"}
                        </span>
                        <Tag
                          color={
                            item.timeSlot === "MORNING"
                              ? "orange"
                              : item.timeSlot === "AFTERNOON"
                                ? "gold"
                                : item.timeSlot === "EVENING"
                                  ? "blue"
                                  : "default"
                          }
                          className="m-0 font-medium whitespace-nowrap"
                        >
                          {item.timeSlot === "MORNING"
                            ? "Sáng"
                            : item.timeSlot === "AFTERNOON"
                              ? "Trưa/Chiều"
                              : item.timeSlot === "EVENING"
                                ? "Tối"
                                : "Khác"}
                        </Tag>
                      </div>
                      <div className="text-gray-600 text-sm mb-1">
                        <span className="font-medium">Cách dùng:</span>{" "}
                        {item.usageInstruction}
                      </div>
                      <div className="text-gray-400 text-xs mt-auto pt-2">
                        Dùng liên tục trong:{" "}
                        <span className="font-medium text-gray-500">
                          {item.durationDays} ngày
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* DÒNG THỜI GIAN CÁC LẦN KHÁM */}
        <h3 className="text-xl font-bold text-gray-800 mb-6 px-2 flex items-center gap-2">
          <ClockCircleOutlined className="text-blue-600" /> Lịch sử Khám & Đánh
          giá
        </h3>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          {currentCase.consultations && currentCase.consultations.length > 0 ? (
            <Timeline mode="left" className="mt-4">
              {[...currentCase.consultations]
                .sort(
                  (a, b) =>
                    new Date(b.consultationAt) - new Date(a.consultationAt),
                )
                .map((cons, index) => (
                  <Timeline.Item
                    key={cons.id}
                    color={index === 0 ? "blue" : "gray"}
                    label={
                      <span className="font-bold text-gray-600 text-sm">
                        {dayjs(cons.consultationAt).format("DD/MM/YYYY HH:mm")}
                      </span>
                    }
                  >
                    <Card
                      size="small"
                      className={`rounded-xl shadow-sm border ${
                        index === 0
                          ? "border-blue-200 bg-blue-50/30"
                          : "border-gray-100"
                      } w-full`}
                    >
                      <div className="mb-3">
                        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                          Đánh giá tình trạng (Assessment)
                        </div>
                        <p className="text-gray-700 m-0 whitespace-pre-wrap text-sm">
                          {cons.assessment}
                        </p>
                      </div>
                      {cons.planSummary && (
                        <div className="mb-3">
                          <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">
                            Tóm tắt hướng điều trị
                          </div>
                          <p className="text-gray-700 m-0 whitespace-pre-wrap text-sm bg-green-50/50 p-2 rounded border border-green-100">
                            {cons.planSummary}
                          </p>
                        </div>
                      )}
                      {isDoctor && cons.doctorNotes && (
                        <div className="pt-3 border-t border-gray-100 mt-3">
                          <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">
                            Ghi chú riêng (Doctor Notes)
                          </div>
                          <p className="text-gray-500 italic m-0 whitespace-pre-wrap text-sm">
                            {cons.doctorNotes}
                          </p>
                        </div>
                      )}
                    </Card>
                  </Timeline.Item>
                ))}
            </Timeline>
          ) : (
            <div className="text-center text-gray-400 py-10">
              Chưa có dữ liệu khám bệnh nào được ghi nhận.
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL BÁC SĨ KÊ / CHỈNH SỬA PHÁC ĐỒ (DRAG & DROP) */}
      {/* ======================================================== */}
      <Modal
        title={
          <span className="text-xl font-bold text-purple-700 flex items-center gap-2">
            <MedicineBoxOutlined />
            {editingPlanId
              ? "Chỉnh Sửa Phác Đồ Đang Điều Trị"
              : "Kê Phác Đồ Trực Quan (Kéo thả)"}
          </span>
        }
        open={isPlanModalVisible}
        onCancel={() => setIsPlanModalVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose
        centered
        className="custom-plan-modal top-5"
      >
        <Row gutter={[24, 24]} className="mt-4">
          {/* CỘT TRÁI: Vùng Kéo thả Lịch trình */}
          <Col xs={24} lg={14}>
            <Form
              form={planForm}
              layout="vertical"
              className="h-full flex flex-col"
            >
              <Form.Item
                label={
                  <span className="font-semibold text-gray-700">
                    Ghi chú / Lời dặn tổng quan
                  </span>
                }
                name="notes"
                className="mb-4"
              >
                <TextArea
                  rows={2}
                  placeholder="Những điều bệnh nhân cần lưu ý chung trong đợt điều trị này..."
                />
              </Form.Item>

              <div
                className="overflow-y-auto pr-2 custom-scrollbar flex-1"
                style={{ maxHeight: "calc(100vh - 350px)" }}
              >
                {renderDropZone(
                  "Buổi Sáng",
                  "MORNING",
                  <SunOutlined className="text-yellow-500 text-2xl" />,
                  "border-yellow-200 bg-yellow-50/30",
                )}
                {renderDropZone(
                  "Buổi Trưa/Chiều",
                  "AFTERNOON",
                  <ClockCircleOutlined className="text-orange-500 text-2xl" />,
                  "border-orange-200 bg-orange-50/30",
                )}
                {renderDropZone(
                  "Buổi Tối",
                  "EVENING",
                  <MoonOutlined className="text-blue-500 text-2xl" />,
                  "border-blue-200 bg-blue-50/30",
                )}
              </div>

              <Divider className="my-4" />

              <div className="flex justify-end gap-3 mt-auto pt-2">
                <Button
                  size="large"
                  onClick={() => setIsPlanModalVisible(false)}
                  className="font-medium"
                >
                  Hủy bỏ
                </Button>
                <Button
                  size="large"
                  type="primary"
                  onClick={handleCreatePlan}
                  loading={submittingPlan}
                  className="bg-purple-600 hover:bg-purple-500 font-bold px-8 border-none"
                >
                  {editingPlanId ? "Lưu Cập Nhật Phác Đồ" : "Lưu Phác Đồ"}
                </Button>
              </div>
            </Form>
          </Col>

          {/* CỘT PHẢI: Tủ Sản Phẩm (Nguồn kéo thả) */}
          <Col xs={24} lg={10}>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 h-full flex flex-col">
              <Title
                level={4}
                className="mb-4 text-gray-700 flex items-center gap-2"
              >
                Tủ Sản Phẩm Hệ Thống
              </Title>

              <div className="flex gap-2 mb-4">
                <Select
                  allowClear
                  placeholder="Lọc danh mục"
                  className="w-1/2"
                  onChange={(val) => handleFilterProducts(val, null)}
                >
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
                <Search
                  placeholder="Tìm theo tên..."
                  className="w-1/2"
                  onSearch={(val) => handleFilterProducts(null, val)}
                />
              </div>

              <div
                className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
                style={{ maxHeight: "calc(100vh - 350px)" }}
              >
                {loadingProducts ? (
                  <div className="flex justify-center p-10">
                    <Spin tip="Đang tải kho thuốc..." />
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
                        className="border rounded-lg p-3 bg-white cursor-grab active:cursor-grabbing hover:shadow-md hover:border-purple-400 transition-all flex flex-col items-center text-center group"
                      >
                        <img
                          src={
                            product.thumbnailUrl ||
                            "https://via.placeholder.com/100"
                          }
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded mb-2 pointer-events-none group-hover:scale-105 transition-transform"
                        />
                        <Text strong className="text-xs line-clamp-2 mb-1">
                          {product.name}
                        </Text>
                        <Tag
                          color="purple"
                          className="m-0 text-[10px] w-full line-clamp-1 border-none bg-purple-50 text-purple-600"
                        >
                          {product.brand}
                        </Tag>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Modal>
    </div>
  );
};

export default TreatmentCaseDetail;
