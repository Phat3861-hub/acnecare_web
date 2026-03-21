import React, { useState } from "react";
import {
  Form,
  Button,
  Upload,
  message,
  Spin,
  Col,
  Row,
  Tag,
  Progress,
  List,
  Divider,
  Slider,
  Modal,
  Select,
  Input,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import axios from "axios";
import { http } from "../../api/config";

const { TextArea } = Input;

const WORKSPACE_ID = "nhom14acne";
const WORKFLOW_ID = "custom-workflow-2";
const API_KEY = "huTWEYCuEdWYPAizTiJR";

const classToVietnamese = {
  "dark spot": "Vết thâm",
  blackheads: "Mụn đầu đen",
  whiteheads: "Mụn đầu trắng",
  nodules: "Mụn bọc",
  papules: "Mụn sẩn",
  pustules: "Mụn mủ",
};

const translateToVN = (className) => {
  const lowerClass = className.toLowerCase().trim();
  return classToVietnamese[lowerClass] || className;
};

const toSnakeCase = (str) => str.trim().toLowerCase().replace(/\s+/g, "_");

const getBoxColor = (className) => {
  const c = className.toLowerCase().trim();
  if (c === "nodules" || c === "papules" || c === "pustules") return "#ef4444";
  if (c === "dark spot") return "#3b82f6";
  return "#22c55e";
};

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const generateImageWithBBoxes = (originalBase64, predictions, imgMeta) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_SIZE = 1200;
      let width = img.width;
      let height = img.height;

      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(img, 0, 0, width, height);

      const scaleX = width / imgMeta.width;
      const scaleY = height / imgMeta.height;

      const lineWidth = Math.max(2, width / 400);
      const fontSize = Math.max(12, width / 60);

      predictions.forEach((pred) => {
        const x = (pred.x - pred.width / 2) * scaleX;
        const y = (pred.y - pred.height / 2) * scaleY;
        const w = pred.width * scaleX;
        const h = pred.height * scaleY;

        const boxColor = getBoxColor(pred.class);

        ctx.strokeStyle = boxColor;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = boxColor;
        const label = `${toSnakeCase(pred.class)} ${Math.round(pred.confidence * 100)}%`;
        ctx.font = `bold ${fontSize}px Arial`;
        const textWidth = ctx.measureText(label).width;

        ctx.fillRect(
          x - lineWidth / 2,
          y - fontSize - 8,
          textWidth + 16,
          fontSize + 8,
        );
        ctx.fillStyle = "#ffffff";
        ctx.fillText(label, x + 8 - lineWidth / 2, y - 6);
      });

      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = originalBase64;
  });
};

const TestAcneModel = () => {
  const [form] = Form.useForm();
  const [saveForm] = Form.useForm();

  const { userInfo } = useSelector((state) => state.user);

  const isDoctor = window.location.pathname.includes("/doctor");

  const [base64Image, setBase64Image] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [apiResult, setApiResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [confidenceThreshold, setConfidenceThreshold] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [patients, setPatients] = useState([]);
  const [isFetchingPatients, setIsFetchingPatients] = useState(false);

  const onFinish = async () => {
    if (!base64Image) return message.error("Vui lòng tải ảnh lên trước.");
    setIsLoading(true);
    setApiResult(null);

    const endpointUrl = `https://serverless.roboflow.com/${WORKSPACE_ID}/workflows/${WORKFLOW_ID}`;
    const requestBody = {
      api_key: API_KEY,
      inputs: { image: { type: "base64", value: base64Image } },
    };

    try {
      const response = await axios.post(endpointUrl, requestBody, {
        headers: { "Content-Type": "application/json" },
      });
      setApiResult(response.data);
      message.success("Phân tích hoàn tất.");
    } catch (error) {
      setApiResult({ error: "Lỗi kết nối.", details: error.message });
      message.error("Lỗi gọi API AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const uploadProps = {
    onRemove: () => {
      setBase64Image(null);
      setFileList([]);
      setApiResult(null);
    },
    beforeUpload: (file) => {
      const isJpgOrPng =
        file.type === "image/jpeg" || file.type === "image/png";
      if (!isJpgOrPng) message.error("Chỉ hỗ trợ JPG/PNG.");
      return isJpgOrPng || Upload.LIST_IGNORE;
    },
    onChange: async ({ fileList: newFileList }) => {
      setFileList(newFileList);
      if (newFileList.length > 0) {
        try {
          const base64 = await getBase64(newFileList[0].originFileObj);
          setBase64Image(base64);
        } catch (error) {
          message.error("Không thể xử lý ảnh.");
        }
      } else {
        setBase64Image(null);
      }
    },
    fileList,
    maxCount: 1,
  };

  let rawPredictions = [];
  let imgMeta = { width: 1, height: 1 };

  if (apiResult?.outputs?.[0]?.predictions?.predictions) {
    rawPredictions = apiResult.outputs[0].predictions.predictions;
    imgMeta = apiResult.outputs[0].predictions.image;
  } else if (Array.isArray(apiResult?.predictions)) {
    rawPredictions = apiResult.predictions;
    imgMeta = apiResult.image || { width: 1, height: 1 };
  }

  const filteredPredictions = rawPredictions.filter(
    (pred) => Math.round(pred.confidence * 100) >= confidenceThreshold,
  );

  const summaryCount = filteredPredictions.reduce((acc, curr) => {
    acc[curr.class] = (acc[curr.class] || 0) + 1;
    return acc;
  }, {});

  const handleOpenSaveModal = async () => {
    setIsModalOpen(true);
    setTimeout(() => saveForm.resetFields(), 10);

    if (isDoctor && patients.length === 0) {
      setIsFetchingPatients(true);
      try {
        const res = await http.get("/users/patients");
        setPatients(res.data?.result || []);
      } catch (error) {
        message.error(
          "Lỗi 404: Không tìm thấy API danh sách bệnh nhân trên Server!",
        );
      } finally {
        setIsFetchingPatients(false);
      }
    }
  };

  const handleSaveResult = async (values) => {
    setIsSaving(true);
    try {
      const basePredictionsForSaving = rawPredictions.filter(
        (pred) => Math.round(pred.confidence * 100) >= 10,
      );

      const baseSummaryCount = basePredictionsForSaving.reduce((acc, curr) => {
        acc[curr.class] = (acc[curr.class] || 0) + 1;
        return acc;
      }, {});

      const finalImageBase64 = await generateImageWithBBoxes(
        base64Image,
        basePredictionsForSaving,
        imgMeta,
      );

      const detailsArray = Object.entries(baseSummaryCount).map(
        ([className, count]) => ({
          className: className,
          count: count,
        }),
      );

      const payload = {
        patientId: isDoctor ? values.patientId : userInfo.id,
        severityLevel: values.severityLevel,
        note: values.note,
        imageBase64: finalImageBase64,
        details: detailsArray,
      };

      await http.post("/acne-predictions", payload);

      message.success("Lưu kết quả phân tích thành công (Dữ liệu chuẩn 10%)!");
      setIsModalOpen(false);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Lỗi 500: Server xử lý thất bại!",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderImageWithBBoxes = () => {
    if (!base64Image) return null;
    return (
      <div className="flex justify-center bg-black rounded-lg overflow-hidden shadow-sm mb-6 w-full">
        <div className="relative inline-block" style={{ lineHeight: 0 }}>
          <img
            src={base64Image}
            alt="Analysis target"
            className="max-w-full max-h-[500px] object-contain opacity-90"
          />
          {filteredPredictions.map((pred, index) => {
            const leftPercent =
              ((pred.x - pred.width / 2) / imgMeta.width) * 100;
            const topPercent =
              ((pred.y - pred.height / 2) / imgMeta.height) * 100;
            const widthPercent = (pred.width / imgMeta.width) * 100;
            const heightPercent = (pred.height / imgMeta.height) * 100;
            const boxColor = getBoxColor(pred.class);

            return (
              <div
                key={index}
                className="absolute pointer-events-none transition-all duration-300 hover:z-10"
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  width: `${widthPercent}%`,
                  height: `${heightPercent}%`,
                  border: `2px solid ${boxColor}`,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                }}
              >
                <span
                  className="absolute -top-5 -left-0.5 text-[10px] text-white font-bold px-1.5 py-0.5 whitespace-nowrap rounded-t-sm shadow-md"
                  style={{ backgroundColor: boxColor }}
                >
                  {toSnakeCase(pred.class)} {Math.round(pred.confidence * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAnalysisResults = () => {
    if (!apiResult) return null;
    if (apiResult.error) {
      return (
        <div className="p-4">
          <span className="text-red-600 font-medium mb-2 block">
            Cảnh báo: Lỗi xử lý
          </span>
          <pre className="text-xs font-mono text-red-500 whitespace-pre-wrap">
            {JSON.stringify(apiResult.details, null, 2)}
          </pre>
        </div>
      );
    }

    const sortedPredictions = [...filteredPredictions].sort(
      (a, b) => b.confidence - a.confidence,
    );

    return (
      <div className="p-4 flex flex-col h-full">
        <div className="flex-grow">
          {renderImageWithBBoxes()}
          <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="text-blue-800 font-semibold mb-3">
              Tổng quan hiển thị: {filteredPredictions.length} tổn thương
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summaryCount).map(([className, count]) => (
                <Tag color="blue" key={className} className="text-sm py-1 px-3">
                  <span className="capitalize font-medium">
                    {translateToVN(className)}
                  </span>
                  : <b>{count}</b>
                </Tag>
              ))}
            </div>
          </div>

          {filteredPredictions.length > 0 && (
            <>
              <Divider orientation="left" plain>
                Mức độ tự tin của AI
              </Divider>
              <List
                itemLayout="horizontal"
                dataSource={sortedPredictions.slice(0, 5)}
                renderItem={(item, index) => {
                  const percent = Math.round(item.confidence * 100);
                  const color =
                    percent > 80
                      ? "#52c41a"
                      : percent > 50
                        ? "#faad14"
                        : "#ff4d4f";

                  return (
                    <List.Item className="bg-white p-3 mb-2 rounded border border-gray-100 shadow-sm">
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-gray-700 capitalize">
                            {index + 1}. {translateToVN(item.class)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Chính xác: {percent}%
                          </span>
                        </div>
                        <Progress
                          percent={percent}
                          strokeColor={color}
                          size="small"
                          status="active"
                          showInfo={false}
                        />
                      </div>
                    </List.Item>
                  );
                }}
              />
            </>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            size="large"
            className="w-full bg-green-600 hover:bg-green-700 font-bold h-12 rounded-lg shadow-md"
            onClick={handleOpenSaveModal}
          >
            Lưu Kết Quả Phân Tích Này
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800">
            Trợ Lý AI Phân Tích Da
          </h2>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full sticky top-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                1. Cấu hình & Tải ảnh
              </h3>

              <Form form={form} layout="vertical" onFinish={onFinish}>
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-gray-700">
                      Độ Nhạy (Hiển thị):
                    </span>
                    <Tag color="cyan" className="m-0 font-bold">
                      {confidenceThreshold}%
                    </Tag>
                  </div>

                  <Slider
                    min={10}
                    max={100}
                    value={confidenceThreshold}
                    onChange={setConfidenceThreshold}
                    tooltip={{ formatter: (val) => `${val}%` }}
                  />
                </div>

                <Form.Item
                  label={
                    <span className="font-semibold text-gray-700">
                      Chọn hình ảnh:
                    </span>
                  }
                >
                  <Upload
                    {...uploadProps}
                    listType="picture-card"
                    className="w-full"
                  >
                    {fileList.length < 1 && (
                      <div className="text-gray-400 font-medium">
                        Click tải ảnh
                      </div>
                    )}
                  </Upload>
                </Form.Item>

                <Form.Item className="mt-2 mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    className="w-full bg-blue-600 font-bold h-12 rounded-lg shadow-md"
                    loading={isLoading}
                    disabled={!base64Image}
                  >
                    Bắt Đầu Phân Tích AI
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </Col>

          <Col xs={24} lg={16}>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="text-lg font-bold text-gray-800 m-0">
                  2. Kết quả quét
                </h3>
              </div>

              <div className="flex-grow rounded-lg relative">
                {isLoading ? (
                  <Spin
                    size="large"
                    className="absolute inset-0 flex items-center justify-center bg-white/90 z-20"
                  />
                ) : !apiResult ? (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50 border-2 border-dashed">
                    Chờ dữ liệu...
                  </div>
                ) : (
                  <div className="h-full">{renderAnalysisResults()}</div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <Modal
        title={<span className="text-xl font-bold">Lưu Hồ Sơ Phân Tích</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form
          form={saveForm}
          layout="vertical"
          onFinish={handleSaveResult}
          className="mt-4"
        >
          {isDoctor && (
            <Form.Item
              name="patientId"
              label="Chọn bệnh nhân để lưu hồ sơ"
              rules={[{ required: true, message: "Vui lòng chọn bệnh nhân!" }]}
            >
              <Select
                showSearch
                placeholder="Tìm kiếm bệnh nhân theo tên hoặc SĐT..."
                loading={isFetchingPatients}
                options={patients.map((p) => ({
                  value: p.id,
                  label: `${p.firstName} ${p.lastName} - ${p.phone}`,
                }))}
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          )}

          <Form.Item
            name="severityLevel"
            label="Đánh giá mức độ tổn thương"
            rules={[{ required: true, message: "Vui lòng chọn mức độ!" }]}
          >
            <Select
              placeholder="Chọn mức độ"
              options={[
                { value: "Da khỏe", label: "Da khỏe" },
                { value: "Nhẹ", label: "Nhẹ" },
                { value: "Trung bình", label: "Trung bình" },
                { value: "Nặng", label: "Nặng" },
              ]}
            />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú thêm">
            <TextArea rows={4} />
          </Form.Item>

          <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-6 border border-blue-200">
            * <b>Lưu ý y khoa:</b> Dù bạn đang kéo thanh trượt ở mức nào, hệ
            thống vẫn sẽ tự động lưu lại{" "}
            <b>toàn bộ dữ liệu (từ mức 10% trở lên)</b> để đảm bảo không bỏ sót
            bất kỳ chi tiết nhỏ nào trong hồ sơ của bệnh nhân.
          </div>

          <div className="flex justify-end gap-3">
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSaving}
              className="bg-green-600"
            >
              Xác Nhận Lưu
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TestAcneModel;
