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
} from "antd";
import axios from "axios";

// ==========================================
// --- Cấu Hình Roboflow API ---
// ==========================================
const WORKSPACE_ID = "nhom14acne";
const WORKFLOW_ID = "custom-workflow-2";
const API_KEY = "huTWEYCuEdWYPAizTiJR";
const classToVietnamese = {
  acne: "Mụn viêm",
  "dark spot": "Vết thâm",
  blackhead: "Mụn đầu đen",
  whitehead: "Mụn đầu trắng",
  nodule: "Mụn bọc",
  papule: "Mụn sẩn",
  pustule: "Mụn mủ",
  scar: "Sẹo mụn",
};

// Hàm dịch sang tiếng Việt (Nếu không có trong từ điển thì giữ nguyên bản)
const translateToVN = (className) => {
  const lowerClass = className.toLowerCase();
  return classToVietnamese[lowerClass] || className;
};

// Hàm format sang dạng snake_case cho Bounding Box (vd: "dark spot" -> "dark_spot")
const toSnakeCase = (str) => {
  return str.trim().toLowerCase().replace(/\s+/g, "_");
};
const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const TestAcneModel = () => {
  const [form] = Form.useForm();
  const [base64Image, setBase64Image] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [apiResult, setApiResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // STATE MỚI: Cấu hình độ nhạy của thanh trượt (Mặc định 30%)
  const [confidenceThreshold, setConfidenceThreshold] = useState(30);

  const onFinish = async () => {
    if (!base64Image) {
      return message.error("Vui lòng tải ảnh lên trước khi phân tích.");
    }

    setIsLoading(true);
    setApiResult(null);

    const endpointUrl = `https://serverless.roboflow.com/${WORKSPACE_ID}/workflows/${WORKFLOW_ID}`;

    // 2. SỬA Ở ĐÂY: Đưa api_key vào lại bên trong requestBody
    const requestBody = {
      api_key: API_KEY, // <-- Chìa khóa phải nằm trong này
      inputs: {
        image: {
          type: "base64",
          value: base64Image,
        },
      },
    };

    try {
      const response = await axios.post(endpointUrl, requestBody, {
        headers: { "Content-Type": "application/json" },
      });
      setApiResult(response.data);
      message.success("Phân tích hình ảnh hoàn tất.");
    } catch (error) {
      console.error("Roboflow API Error:", error);
      setApiResult({
        error: "Lỗi kết nối hoặc xử lý từ phía máy chủ phân tích.",
        details: error.response?.data || error.message,
      });
      message.error("Lỗi gọi API. Vui lòng kiểm tra lại kết nối.");
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
      if (!isJpgOrPng) {
        message.error("Hệ thống chỉ hỗ trợ định dạng ảnh JPG/PNG.");
      }
      return isJpgOrPng || Upload.LIST_IGNORE;
    },
    onChange: async ({ fileList: newFileList }) => {
      setFileList(newFileList);
      if (newFileList.length > 0) {
        const file = newFileList[0].originFileObj;
        try {
          const base64 = await getBase64(file);
          setBase64Image(base64);
        } catch (error) {
          message.error("Không thể xử lý định dạng ảnh này.");
        }
      } else {
        setBase64Image(null);
      }
    },
    fileList,
    maxCount: 1,
  };

  // ==========================================
  // LOGIC TRÍCH XUẤT VÀ LỌC DỮ LIỆU THEO SLIDER
  // ==========================================
  let rawPredictions = [];
  let imgMeta = { width: 1, height: 1 };

  if (apiResult?.outputs?.[0]?.predictions?.predictions) {
    rawPredictions = apiResult.outputs[0].predictions.predictions;
    imgMeta = apiResult.outputs[0].predictions.image;
  } else if (Array.isArray(apiResult?.predictions)) {
    rawPredictions = apiResult.predictions;
    imgMeta = apiResult.image || { width: 1, height: 1 };
  }

  // Mảng này sẽ tự động thay đổi mỗi khi bạn kéo Slider
  const filteredPredictions = rawPredictions.filter(
    (pred) => Math.round(pred.confidence * 100) >= confidenceThreshold,
  );

  const renderImageWithBBoxes = () => {
    if (!base64Image) return null;

    return (
      <div className="relative inline-block w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-black mb-6">
        <img
          src={base64Image}
          alt="Analysis target"
          className="w-full h-auto object-contain max-h-[500px] mx-auto opacity-90"
        />

        {filteredPredictions.map((pred, index) => {
          const leftPercent = ((pred.x - pred.width / 2) / imgMeta.width) * 100;
          const topPercent =
            ((pred.y - pred.height / 2) / imgMeta.height) * 100;
          const widthPercent = (pred.width / imgMeta.width) * 100;
          const heightPercent = (pred.height / imgMeta.height) * 100;
          const confidence = Math.round(pred.confidence * 100);

          const isAcne = pred.class.toLowerCase().includes("acne");
          const isDarkSpot = pred.class.toLowerCase().includes("dark spot");
          const boxColor = isAcne
            ? "#ef4444"
            : isDarkSpot
              ? "#3b82f6"
              : "#eab308";

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
                {/* ÁP DỤNG HÀM SNAKE_CASE Ở ĐÂY */}
                {toSnakeCase(pred.class)} {confidence}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // ==========================================
  // HÀM HIỂN THỊ KẾT QUẢ BÊN PHẢI (HIỂN THỊ TIẾNG VIỆT)
  // ==========================================
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

    if (!Array.isArray(rawPredictions) || rawPredictions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          {renderImageWithBBoxes()}
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl mt-6 mb-4">
            ✓
          </div>
          <h4 className="text-green-600 font-bold text-lg mb-2">
            Da rất khỏe!
          </h4>
          <p className="text-gray-600">
            AI không phát hiện thấy vấn đề da liễu nào.
          </p>
        </div>
      );
    }

    const summaryCount = filteredPredictions.reduce((acc, curr) => {
      acc[curr.class] = (acc[curr.class] || 0) + 1;
      return acc;
    }, {});

    const sortedPredictions = [...filteredPredictions].sort(
      (a, b) => b.confidence - a.confidence,
    );

    return (
      <div className="p-4">
        {renderImageWithBBoxes()}

        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="text-blue-800 font-semibold mb-3">
            Tổng quan: Phát hiện {filteredPredictions.length} tổn thương (Độ
            chắc chắn ≥ {confidenceThreshold}%)
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summaryCount).map(([className, count]) => (
              <Tag color="blue" key={className} className="text-sm py-1 px-3">
                {/* ÁP DỤNG HÀM TIẾNG VIỆT Ở ĐÂY */}
                <span className="capitalize font-medium">
                  {translateToVN(className)}
                </span>
                : <b>{count}</b>
              </Tag>
            ))}
            {filteredPredictions.length === 0 && (
              <span className="text-sm text-gray-500 italic">
                Hãy thử giảm thanh trượt độ nhạy xuống để xem thêm.
              </span>
            )}
          </div>
        </div>

        {filteredPredictions.length > 0 && (
          <>
            <Divider orientation="left" plain>
              Mức độ tự tin của AI
            </Divider>
            <List
              itemLayout="horizontal"
              dataSource={sortedPredictions.slice(0, 10)}
              renderItem={(item, index) => {
                const confidencePercent = Math.round(item.confidence * 100);
                const strokeColor =
                  confidencePercent > 80
                    ? "#52c41a"
                    : confidencePercent > 50
                      ? "#faad14"
                      : "#ff4d4f";

                return (
                  <List.Item className="bg-white p-3 mb-2 rounded border border-gray-100 shadow-sm">
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        {/* ÁP DỤNG HÀM TIẾNG VIỆT Ở ĐÂY */}
                        <span className="font-semibold text-gray-700 capitalize">
                          {index + 1}. {translateToVN(item.class)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Chính xác: {confidencePercent}%
                        </span>
                      </div>
                      <Progress
                        percent={confidencePercent}
                        strokeColor={strokeColor}
                        size="small"
                        status="active"
                        showInfo={false}
                      />
                    </div>
                  </List.Item>
                );
              }}
            />
            {sortedPredictions.length > 10 && (
              <div className="text-center text-gray-400 text-xs mt-2 italic">
                *Đã ẩn bớt {sortedPredictions.length - 10} điểm có độ tin cậy
                thấp...
              </div>
            )}
          </>
        )}
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
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            Hệ thống sử dụng trí tuệ nhân tạo (Computer Vision) để tự động định
            vị và phân loại các vùng mụn, vết thâm trên khuôn mặt.
          </p>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full sticky top-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                1. Cấu hình & Tải ảnh
              </h3>

              <Form form={form} layout="vertical" onFinish={onFinish}>
                {/* --- THANH TRƯỢT SLIDER ĐỘ NHẠY --- */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-gray-700">
                      Độ Nhạy AI (Độ chắc chắn):
                    </span>
                    <Tag color="cyan" className="m-0 font-bold">
                      {confidenceThreshold}%
                    </Tag>
                  </div>
                  <Slider
                    min={10}
                    max={100}
                    value={confidenceThreshold}
                    onChange={(val) => setConfidenceThreshold(val)}
                    tooltip={{ formatter: (val) => `${val}%` }}
                    className="mb-1"
                  />
                  <p className="text-[11px] text-gray-500 m-0 mt-2 leading-tight">
                    • Kéo <b>thấp</b> để AI bắt cả những nốt mụn mờ nhất.
                    <br />• Kéo <b>cao</b> để AI chỉ hiển thị các nốt chắc chắn
                    nhất.
                  </p>
                </div>

                <Form.Item
                  label={
                    <span className="font-semibold text-gray-700">
                      Chọn hình ảnh khuôn mặt:
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
                        Click để tải ảnh
                      </div>
                    )}
                  </Upload>
                </Form.Item>

                {base64Image && (
                  <div className="mb-6">
                    <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium border border-green-200 flex items-center">
                      <span className="mr-2 text-lg">✓</span> Sẵn sàng phân
                      tích.
                    </div>
                  </div>
                )}

                <Form.Item className="mt-2 mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-12 rounded-lg shadow-md"
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
                  2. Kết quả quét (Bounding Boxes)
                </h3>
                {apiResult && (
                  <Tag
                    color={filteredPredictions.length > 0 ? "error" : "success"}
                    className="m-0"
                  >
                    Hiển thị {filteredPredictions.length} điểm
                  </Tag>
                )}
              </div>

              <div className="flex-grow rounded-lg relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 rounded-lg">
                    <Spin size="large" />
                    <p className="mt-4 text-blue-600 font-bold text-lg animate-pulse">
                      AI đang quét từng pixel...
                    </p>
                  </div>
                ) : !apiResult ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-5xl mb-4 opacity-30">🤖</div>
                    <p className="font-medium">
                      Chờ dữ liệu phân tích từ Roboflow...
                    </p>
                  </div>
                ) : (
                  <div className="h-full">{renderAnalysisResults()}</div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default TestAcneModel;
