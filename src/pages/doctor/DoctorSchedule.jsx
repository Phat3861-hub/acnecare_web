import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Calendar,
  Modal,
  Table,
  Select,
  Tag,
  message,
  Spin,
  Input,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  fetchDoctorSchedule,
  updateStatus,
} from "../../store/slice/AppointmentSlice";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Link } from "react-router-dom";
import locale from "antd/es/date-picker/locale/vi_VN";
import "./DoctorSchedule.css";
const { Option } = Select;

const DoctorSchedule = () => {
  const dispatch = useDispatch();

  const { doctorScheduleList, loading } = useSelector(
    (state) => state.appointment,
  );
  const { userInfo } = useSelector((state) => state.user);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayAppointments, setDayAppointments] = useState([]);

  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [currentEditAppt, setCurrentEditAppt] = useState(null);
  const [meetingUrl, setMeetingUrl] = useState("");

  const [viewMode, setViewMode] = useState("week");
  const [currentDate, setCurrentDate] = useState(dayjs());

  const currentDay = currentDate.day();
  const diff = currentDay === 0 ? -6 : 1 - currentDay;
  const startOfWeek = currentDate.add(diff, "day").startOf("day");
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    startOfWeek.add(i, "day"),
  );

  useEffect(() => {
    dispatch(fetchDoctorSchedule());
  }, [dispatch]);

  useEffect(() => {
    if (selectedDate && doctorScheduleList) {
      const appointmentsOnDate = doctorScheduleList.filter((app) =>
        dayjs(app.appointmentTime).isSame(selectedDate, "day"),
      );
      setDayAppointments(appointmentsOnDate);
    }
  }, [doctorScheduleList, selectedDate]);

  useEffect(() => {
    if (!userInfo?.id) return;

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const stompClient = new Client({
      // Thay thế localhost bằng biến backendUrl
      webSocketFactory: () => new SockJS(`${backendUrl}/api/ws`),
      debug: (str) => console.log(str),
      onConnect: () => {
        stompClient.subscribe(
          `/topic/doctor/${userInfo.id}/notifications`,
          (msg) => {
            const response = JSON.parse(msg.body);
            if (response.type === "NEW_APPOINTMENT") {
              message.success(response.message);
              dispatch(fetchDoctorSchedule());
            } else if (response.type === "APPOINTMENT_CANCELLED") {
              message.warning(response.message);
              dispatch(fetchDoctorSchedule());
            }
          },
        );
      },
    });

    stompClient.activate();
    return () => stompClient.deactivate();
  }, [userInfo?.id, dispatch]);

  const dateCellRender = (value) => {
    const listData =
      doctorScheduleList?.filter((app) =>
        dayjs(app.appointmentTime).isSame(value, "day"),
      ) || [];

    if (listData.length === 0) return null;
    const pendingCount = listData.filter(
      (app) => app.status === "PENDING",
    ).length;

    return (
      <div className="flex flex-col gap-1 mt-1 px-1">
        <div className="bg-blue-50 text-blue-700 text-[10px] sm:text-xs px-1 sm:px-2 py-1 rounded border border-blue-100 text-center truncate">
          <span className="hidden sm:inline">Tổng: </span>
          {listData.length} ca
        </div>
        {pendingCount > 0 && (
          <div className="bg-red-50 text-red-600 text-[10px] px-1 sm:px-2 py-1 rounded border border-red-100 text-center font-medium truncate">
            {pendingCount} chờ
          </div>
        )}
      </div>
    );
  };

  const cellRender = (current, info) => {
    if (info.type === "date") return dateCellRender(current);
    return info.originNode;
  };

  const onSelectDate = (newValue) => {
    setSelectedDate(newValue);
    const appointmentsOnDate =
      doctorScheduleList?.filter((app) =>
        dayjs(app.appointmentTime).isSame(newValue, "day"),
      ) || [];

    setDayAppointments(appointmentsOnDate);
    setIsModalVisible(true);
  };

  // ==============================================
  // GIAO DIỆN WEEK VIEW (ĐÃ FIX LỖI LỆCH GRID)
  // ==============================================
  const renderWeekView = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 7);
    const ROW_HEIGHT = 160;
    const now = dayjs();

    const blockColors = [
      "bg-yellow-50 border-yellow-200 text-yellow-800",
      "bg-indigo-50 border-indigo-200 text-indigo-800",
      "bg-green-50 border-green-200 text-green-800",
      "bg-blue-50 border-blue-200 text-blue-800",
      "bg-pink-50 border-pink-200 text-pink-800",
    ];

    return (
      <div className="w-full overflow-x-auto bg-white custom-scrollbar">
        <div
          className="min-w-[800px] lg:min-w-full flex flex-col relative overflow-y-auto overflow-x-hidden custom-scrollbar"
          style={{ height: "65vh", minHeight: "500px" }}
        >
          {/* HEADER - Tăng z-index lên 50 để đè lên các khối sự kiện, thêm shadow-sm để tạo hiệu ứng nổi khi cuộn */}
          <div className="grid grid-cols-[70px_repeat(7,1fr)] md:grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
            <div className="p-2 md:p-3 text-center text-[10px] md:text-xs text-blue-600 font-semibold flex items-center justify-center border-r border-gray-100">
              W{startOfWeek.week ? startOfWeek.week() : dayjs().week?.() || "2"}
            </div>
            {weekDays.map((day) => {
              const isToday = day.isSame(now, "day");
              return (
                <div
                  key={day.format("DD")}
                  className="p-2 md:p-3 text-center border-r border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onSelectDate(day)}
                >
                  <div className="text-[10px] md:text-[11px] text-gray-500 font-bold tracking-wider uppercase">
                    {day.locale("vi").format("ddd")}
                  </div>
                  <div
                    className={`text-base md:text-lg font-bold mt-1 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center mx-auto rounded-full ${
                      isToday
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-800"
                    }`}
                  >
                    {day.format("D")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* BODY - Chứa đường kẻ ngang và các ca khám */}
          <div className="relative flex-1">
            {now.hour() >= 7 && now.hour() <= 18 && (
              <div
                className="absolute left-0 right-0 flex z-30 pointer-events-none"
                style={{
                  top: `${
                    (now.hour() - 7) * ROW_HEIGHT +
                    (now.minute() / 60) * ROW_HEIGHT
                  }px`,
                }}
              >
                <div className="w-[70px] md:w-[80px] text-right pr-2 -mt-2 text-[10px] md:text-[11px] text-blue-600 font-bold bg-white">
                  {now.format("h:mm A")}
                </div>
                <div className="flex-1 border-t border-blue-500 relative">
                  <div className="absolute -left-1.5 -top-1.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-blue-500 rounded-full shadow-sm"></div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-[70px_repeat(7,1fr)] md:grid-cols-[80px_repeat(7,1fr)]">
              {/* CỘT HIỂN THỊ GIỜ */}
              <div className="border-r border-gray-100 bg-white z-10">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: ROW_HEIGHT }}
                    className="relative flex flex-col"
                  >
                    <div className="flex-1 border-b border-gray-50 border-dashed relative">
                      <div className="absolute -top-2.5 left-0 right-0 flex justify-center">
                        <span className="text-[9px] md:text-[11px] font-medium text-gray-400 bg-white px-1 md:px-2">
                          {hour === 12
                            ? "12:00 PM"
                            : hour > 12
                              ? `${hour - 12}:00 PM`
                              : `${hour}:00 AM`}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 border-b border-gray-100 relative">
                      <div className="absolute -top-2.5 left-0 right-0 flex justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-[8px] md:text-[10px] font-medium text-gray-300 bg-white px-1">
                          {hour === 12
                            ? "12:30 PM"
                            : hour > 12
                              ? `${hour - 12}:30 PM`
                              : `${hour}:30 AM`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CỘT CÁC NGÀY TRONG TUẦN */}
              {weekDays.map((day) => {
                const dayApps =
                  doctorScheduleList?.filter((app) =>
                    dayjs(app.appointmentTime).isSame(day, "day"),
                  ) || [];

                const appsBySlot = {};
                dayApps.forEach((app) => {
                  const time = dayjs(app.appointmentTime);
                  const h = time.hour();
                  const m = time.minute();
                  const slotKey = `${h}-${m >= 30 ? 30 : 0}`;
                  if (!appsBySlot[slotKey]) appsBySlot[slotKey] = [];
                  appsBySlot[slotKey].push(app);
                });

                return (
                  <div
                    key={day.format("DD")}
                    className="relative border-r border-b border-gray-50 min-h-full group cursor-pointer"
                    onClick={() => onSelectDate(day)}
                  >
                    {/* Vẽ đường line chia giờ trong các cột ngày */}
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        style={{ height: ROW_HEIGHT }}
                        className="flex flex-col"
                      >
                        <div className="flex-1 border-b border-gray-50 border-dashed"></div>
                        <div className="flex-1 border-b border-gray-100"></div>
                      </div>
                    ))}

                    {/* Hiển thị các khối sự kiện (Ca khám) */}
                    {dayApps.map((app, idx) => {
                      const appTime = dayjs(app.appointmentTime);
                      const hour = appTime.hour();
                      const minute = appTime.minute();

                      if (hour < 7 || hour > 18) return null;

                      const slotKey = `${hour}-${minute >= 30 ? 30 : 0}`;
                      const concurrentApps = appsBySlot[slotKey];
                      const appIndex = concurrentApps.findIndex(
                        (a) => a.id === app.id,
                      );
                      const totalConcurrent = concurrentApps.length;

                      const top =
                        (hour - 7) * ROW_HEIGHT + (minute / 60) * ROW_HEIGHT;
                      const height = ROW_HEIGHT / 2 - 4;

                      const widthPercent = 100 / totalConcurrent;
                      const leftPercent = appIndex * widthPercent;
                      const colorClass = blockColors[idx % blockColors.length];

                      return (
                        <div
                          key={app.id}
                          className={`absolute rounded-md p-1.5 md:p-2 border shadow-sm ${colorClass} hover:brightness-95 hover:z-50 hover:shadow-md transition-all flex flex-col overflow-hidden`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `calc(${leftPercent}% + 2px)`,
                            width: `calc(${widthPercent}% - 4px)`,
                            zIndex: 20 + appIndex, // Z-index ở đây luôn nhỏ hơn Header (50)
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDate(day);
                          }}
                        >
                          <div className="text-[9px] md:text-[11px] font-semibold mb-0.5 opacity-80 leading-none">
                            {appTime.format("h:mm A")}
                          </div>
                          <div className="text-[10px] md:text-[12px] font-bold leading-tight truncate">
                            {app.patientName || "Bệnh nhân"}
                          </div>
                          <div className="text-[9px] md:text-[10px] flex items-center gap-1 font-medium opacity-90 mt-auto">
                            {app.mode === "ONLINE" ? (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 flex-shrink-0"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                </svg>
                                <span className="truncate">Video</span>
                              </>
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 flex-shrink-0"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="truncate">In-Person</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleStatusChange = async (record, newStatus) => {
    if (newStatus === "CONFIRMED" && record.mode === "ONLINE") {
      setCurrentEditAppt(record);
      setMeetingUrl(record.meetingUrl || "");
      setLinkModalVisible(true);
    } else {
      try {
        await dispatch(
          updateStatus({ id: record.id, status: newStatus }),
        ).unwrap();
        message.success("Cập nhật trạng thái thành công");
      } catch (error) {
        message.error(error.message || "Lỗi khi cập nhật trạng thái");
      }
    }
  };

  const handleSubmitLink = async () => {
    if (!meetingUrl.trim()) {
      return message.error("Vui lòng nhập đường dẫn phòng khám!");
    }
    try {
      await dispatch(
        updateStatus({
          id: currentEditAppt.id,
          status: "CONFIRMED",
          meetingUrl: meetingUrl,
        }),
      ).unwrap();

      message.success("Xác nhận lịch và gửi Link thành công!");
      setLinkModalVisible(false);
      setMeetingUrl("");
    } catch (error) {
      message.error(error.message || "Lỗi khi xác nhận lịch");
    }
  };

  const columns = [
    {
      title: "Giờ",
      dataIndex: "appointmentTime",
      key: "time",
      render: (time) => (
        <span className="font-medium whitespace-nowrap">
          {dayjs(time).format("HH:mm")}
        </span>
      ),
      sorter: (a, b) =>
        dayjs(a.appointmentTime).unix() - dayjs(b.appointmentTime).unix(),
      defaultSortOrder: "ascend",
    },
    {
      title: "Bệnh nhân",
      dataIndex: "patientName",
      key: "patientName",
      render: (name, record) => (
        <div className="min-w-[120px]">
          <div className="font-medium text-gray-800">{name}</div>
          <div className="text-xs text-gray-500 mt-1">
            Hình thức:{" "}
            {record.mode === "ONLINE" ? (
              <span className="text-blue-600 font-medium">Trực tuyến</span>
            ) : (
              "Trực tiếp"
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Ghi chú bệnh lý",
      dataIndex: "note",
      key: "note",
      render: (note) => (
        <span className="text-gray-500 text-sm min-w-[150px] block">
          {note || "-"}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center gap-2 min-w-[200px]">
          <Select
            value={record.status}
            style={{ width: 130 }}
            onChange={(val) => handleStatusChange(record, val)}
            disabled={
              record.status === "CANCELLED" || record.status === "COMPLETED"
            }
          >
            <Option value="PENDING">
              <Tag color="orange">Chờ duyệt</Tag>
            </Option>
            <Option value="CONFIRMED">
              <Tag color="blue">Đã duyệt</Tag>
            </Option>
            <Option value="COMPLETED">
              <Tag color="green">Hoàn thành</Tag>
            </Option>
            <Option value="REJECTED">
              <Tag color="red">Từ chối</Tag>
            </Option>
            <Option value="CANCELLED" disabled>
              <Tag>Bệnh nhân hủy</Tag>
            </Option>
          </Select>

          <Link
            to={`/doctor/schedule/${record.id}`}
            className="text-blue-600 hover:underline text-sm whitespace-nowrap"
          >
            Chi tiết
          </Link>
        </div>
      ),
    },
  ];

  if (loading && !doctorScheduleList) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-2 md:p-6 bg-transparent md:doctor-schedule-container h-full min-h-screen">
      <div className="max-w-7xl mx-auto h-full flex flex-col bg-white doctor-schedule-card p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
          <div className="flex flex-wrap items-center gap-4 md:gap-6 w-full md:w-auto">
            <h2 className="text-xl md:text-2xl font-black doctor-schedule-title m-0">
              Lịch làm việc
            </h2>

            <div className="bg-gray-200/60 p-1 rounded-lg flex text-sm shadow-inner w-full sm:w-auto">
              <button
                onClick={() => setViewMode("week")}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === "week"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Tuần
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === "month"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Tháng
              </button>
            </div>
          </div>

          {viewMode === "week" && (
            <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center border border-gray-200 rounded-lg px-2 py-1 bg-white shadow-sm w-full md:w-auto justify-between">
                <button
                  onClick={() =>
                    setCurrentDate((prev) => prev.subtract(1, "week"))
                  }
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <span className="mx-2 md:mx-4 text-xs md:text-sm font-semibold text-gray-700 truncate">
                  {weekDays[0].locale("vi").format("D [Thg] M")} -{" "}
                  {weekDays[6].locale("vi").format("D [Thg] M, YYYY")}
                </span>
                <button
                  onClick={() => setCurrentDate((prev) => prev.add(1, "week"))}
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 overflow-hidden flex-1 border-t border-gray-100 pt-4">
          {viewMode === "month" ? (
            <div className="p-2 md:p-4 overflow-x-auto custom-scrollbar">
              <div className="min-w-[600px] lg:min-w-full">
                <Calendar
                  locale={locale}
                  cellRender={cellRender}
                  onSelect={onSelectDate}
                />
              </div>
            </div>
          ) : (
            renderWeekView()
          )}
        </div>

        <Modal
          title={
            <span className="text-lg">
              Danh sách khám ngày{" "}
              {selectedDate ? selectedDate.format("DD/MM/YYYY") : ""}
            </span>
          }
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={800}
          centered
          destroyOnClose
          style={{ padding: "0 10px" }}
        >
          {dayAppointments.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar mt-4">
              <Table
                dataSource={dayAppointments}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="middle"
                scroll={{ x: "max-content" }}
              />
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500">
              Không có dữ liệu.
            </div>
          )}
        </Modal>

        <Modal
          title="Tạo phòng khám Trực tuyến"
          open={linkModalVisible}
          onOk={handleSubmitLink}
          onCancel={() => {
            setLinkModalVisible(false);
            setMeetingUrl("");
          }}
          okText="Xác nhận & Gửi Link"
          cancelText="Hủy bỏ"
          centered
        >
          <div className="py-4">
            <p className="mb-2 text-gray-600">
              Vui lòng nhập đường dẫn (Google Meet, Zoom, Zalo...) để bệnh nhân{" "}
              <span className="font-medium text-gray-800">
                {currentEditAppt?.patientName}
              </span>{" "}
              có thể tham gia:
            </p>
            <Input
              size="large"
              placeholder="VD: https://meet.google.com/abc-xyz-123"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default DoctorSchedule;
