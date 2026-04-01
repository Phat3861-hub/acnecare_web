import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

import {
  Layout,
  Card,
  Button,
  Input,
  Avatar,
  Typography,
  Space,
  Divider,
  Modal,
  Image,
  Empty,
  message as antdMessage,
  Skeleton,
} from "antd";
import {
  HeartOutlined,
  HeartFilled,
  MessageOutlined,
  DeleteOutlined,
  EditOutlined,
  PictureOutlined,
} from "@ant-design/icons";

import {
  fetchAllPosts,
  deletePostThunk,
  toggleLikeThunk,
  createCommentThunk,
  deletePostRealtime,
  updatePostRealtime,
  updateLikesRealtime,
  updateCommentsCountRealtime,
  addImagesRealtime,
  removeImageRealtime,
  toggleLikeLocal,
} from "../../store/slice/PostSlice";

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const getCookie = (name) => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  } catch (error) {
    return null;
  }
};

const Post = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const stompClientRef = useRef(null);
  const observer = useRef();

  const { user } = useSelector((state) => state.user);
  const {
    posts,
    isLoading,
    totalPages,
    message: reduxMessage,
  } = useSelector((state) => state.post);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  // Lấy ID và ROLE người dùng hiện tại
  let currentUserId = null;
  let currentUserRole = null;
  try {
    const localUser = JSON.parse(localStorage.getItem("userInfo") || "{}");
    currentUserId = user?.id || localUser?.id;
    currentUserRole = user?.role || localUser?.role;
  } catch (error) {
    console.error("🚨 [Lỗi] Không thể lấy thông tin User:", error);
  }

  // 🚨 HÀM TỰ ĐỘNG TẠO ĐƯỜNG DẪN DỰA TRÊN ROLE
  const getBaseRoute = () => {
    if (currentUserRole === "ADMIN") return "/admin";
    if (currentUserRole === "DOCTOR") return "/doctor";
    if (currentUserRole === "BRAND") return "/brand";
    return ""; // Default cho Patient (không có tiền tố)
  };
  const baseRoute = getBaseRoute();

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

  const handleFetchPosts = async (currentPage) => {
    try {
      await dispatch(fetchAllPosts({ page: currentPage, size: 5 })).unwrap();
    } catch (error) {
      antdMessage.error("Không thể tải bài viết: " + error);
    }
  };

  useEffect(() => {
    setPage(0);
    handleFetchPosts(0);
  }, []);

  useEffect(() => {
    if (totalPages !== undefined) {
      setHasMore(page < totalPages - 1);
    }
  }, [totalPages, page]);

  const lastPostElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            handleFetchPosts(nextPage);
            return nextPage;
          });
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore],
  );

  const postIdsString = posts.map((p) => p.id).join(",");
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:9090";

  useEffect(() => {
    if (!postIdsString) return;

    try {
      const currentToken = getCookie("accessToken");
      const client = new Client({
        webSocketFactory: () => new SockJS(`${backendUrl}/api/ws`),
        connectHeaders: currentToken
          ? { Authorization: `Bearer ${currentToken}` }
          : {},
        reconnectDelay: 5000,
        onConnect: () => {
          client.subscribe("/topic/posts/delete", (msg) =>
            dispatch(deletePostRealtime(msg.body)),
          );
          client.subscribe("/topic/posts/update", (msg) =>
            dispatch(updatePostRealtime(JSON.parse(msg.body))),
          );

          postIdsString.split(",").forEach((postId) => {
            client.subscribe(`/topic/posts/${postId}/likes`, (msg) => {
              dispatch(
                updateLikesRealtime({
                  postId,
                  isActionLike: JSON.parse(msg.body),
                }),
              );
            });
            client.subscribe(`/topic/posts/${postId}/comments`, () => {
              dispatch(updateCommentsCountRealtime({ postId, type: "add" }));
            });
            client.subscribe(`/topic/posts/${postId}/comments/delete`, () => {
              dispatch(updateCommentsCountRealtime({ postId, type: "delete" }));
            });
            client.subscribe(`/topic/posts/${postId}/images/upload`, (msg) => {
              dispatch(
                addImagesRealtime({ postId, newImages: JSON.parse(msg.body) }),
              );
            });
            client.subscribe(`/topic/posts/${postId}/images/delete`, (msg) => {
              dispatch(removeImageRealtime({ postId, imageId: msg.body }));
            });
          });
        },
      });
      client.activate();
      stompClientRef.current = client;
    } catch (error) {
      console.error("🚨 [Lỗi WebSocket]:", error);
    }

    return () => stompClientRef.current?.deactivate();
  }, [postIdsString, dispatch, backendUrl]);

  const handleToggleLike = async (postId, currentIsLiked) => {
    dispatch(toggleLikeLocal({ postId, isLiked: !currentIsLiked }));
    try {
      await dispatch(toggleLikeThunk(postId)).unwrap();
    } catch (error) {
      dispatch(toggleLikeLocal({ postId, isLiked: currentIsLiked }));
      antdMessage.error("Lỗi tương tác");
    }
  };

  const handleCommentSubmit = async (postId) => {
    if (!commentText.trim()) return;
    setIsCommenting(true);
    try {
      await dispatch(
        createCommentThunk({
          postId,
          data: { commentContent: commentText.trim() },
        }),
      ).unwrap();
      setCommentText("");
      setActiveCommentPostId(null);
      antdMessage.success("Đã đăng bình luận");
    } catch (error) {
      antdMessage.error("Lỗi bình luận");
    } finally {
      setIsCommenting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await dispatch(
        deletePostThunk({ userId: currentUserId, postId: postToDelete }),
      ).unwrap();
      antdMessage.success("Đã xóa bài viết");
    } catch (error) {
      antdMessage.error("Lỗi khi xóa");
    } finally {
      setIsDeleteModalOpen(false);
      setPostToDelete(null);
    }
  };

  return (
    <Layout className="min-h-screen bg-[#F0F2F5]">
      <Header className="bg-white border-b px-4 sticky top-0 z-50 flex items-center justify-center h-16 shadow-sm">
        <div className="max-w-2xl w-full flex justify-between items-center">
          <Title
            level={4}
            className="m-0 text-blue-600 font-black tracking-tight"
          >
            AcneCare Community
          </Title>
          <Space>
            <Button
              type="primary"
              shape="round"
              className="bg-blue-600 hover:bg-blue-700 font-semibold px-6 shadow-md shadow-blue-200"
              onClick={() => navigate(`${baseRoute}/createpost`)} // 🚨 SỬA Ở ĐÂY
              icon={<EditOutlined />}
            >
              Đăng bài
            </Button>
          </Space>
        </div>
      </Header>

      <Content className="p-4 flex flex-col items-center">
        <div className="max-w-2xl w-full space-y-6">
          <Card
            className="shadow-sm rounded-xl border-none"
            bodyStyle={{ padding: "16px" }}
          >
            <div
              className="flex gap-3 items-center cursor-text"
              onClick={() => navigate(`${baseRoute}/createpost`)} // 🚨 SỬA Ở ĐÂY
            >
              <Avatar
                size={44}
                className="bg-blue-100 text-blue-600 font-bold flex-shrink-0"
              >
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </Avatar>
              <div className="bg-slate-100 hover:bg-slate-200 transition-colors w-full rounded-full py-2.5 px-4 text-slate-500 font-medium">
                Bạn đang nghĩ gì về làn da của mình?
              </div>
            </div>
            <Divider className="my-3" />
            <div className="flex justify-center">
              <Button
                type="text"
                className="text-slate-500 font-medium flex items-center gap-2 hover:bg-slate-50 rounded-lg px-8"
                onClick={() => navigate(`${baseRoute}/createpost`)} // 🚨 SỬA Ở ĐÂY
              >
                <PictureOutlined className="text-green-500 text-lg" /> Thêm ảnh
                / Video
              </Button>
            </div>
          </Card>

          {reduxMessage && !isLoading && posts.length === 0 && (
            <Alert
              message={reduxMessage}
              type="info"
              showIcon
              className="rounded-xl border-none shadow-sm"
            />
          )}

          {posts.map((post, index) => {
            const isOwner = Boolean(
              currentUserId &&
              post.user?.id &&
              String(currentUserId) === String(post.user?.id),
            );
            const hasLiked = post.liked || post.isLiked;
            const isLastPost = posts.length === index + 1;

            return (
              <Card
                key={post.id}
                ref={isLastPost ? lastPostElementRef : null}
                className="shadow-sm rounded-xl border-none hover:shadow-md transition-shadow duration-300"
                bodyStyle={{ padding: "0px" }}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <Space align="center" size={12}>
                      <Avatar
                        src={post.user?.avatarUrl}
                        size={44}
                        className="bg-gradient-to-tr from-blue-400 to-indigo-500 text-white font-bold cursor-pointer"
                      >
                        {post.user?.name?.charAt(0).toUpperCase() || "U"}
                      </Avatar>
                      <div className="flex flex-col">
                        <Text
                          strong
                          className="text-slate-800 text-[15px] cursor-pointer hover:underline"
                        >
                          {post.user?.name || "Người dùng ẩn danh"}
                        </Text>
                        <Text type="secondary" className="text-xs font-medium">
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleString("vi-VN", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "Vừa xong"}
                        </Text>
                      </div>
                    </Space>

                    {isOwner && (
                      <Space size={0}>
                        <Button
                          type="text"
                          onClick={() =>
                            navigate(`${baseRoute}/editpost/${post.id}`)
                          } // 🚨 SỬA Ở ĐÂY
                          className="text-slate-400 hover:text-blue-600"
                          icon={<EditOutlined />}
                        />
                        <Button
                          type="text"
                          danger
                          onClick={() => {
                            setPostToDelete(post.id);
                            setIsDeleteModalOpen(true);
                          }}
                          icon={<DeleteOutlined />}
                        />
                      </Space>
                    )}
                  </div>

                  <div className="mb-4">
                    {post.postTitle && (
                      <Title
                        level={5}
                        className="mt-0 mb-1 font-bold text-slate-800"
                      >
                        {post.postTitle}
                      </Title>
                    )}
                    <Paragraph className="text-slate-700 text-[15px] whitespace-pre-wrap leading-relaxed mb-0">
                      {post.postContent}
                    </Paragraph>
                  </div>
                </div>

                {post.postsImage?.length > 0 && (
                  <div
                    className={`grid ${post.postsImage.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-1 bg-slate-100`}
                  >
                    <Image.PreviewGroup>
                      {post.postsImage.map((img, idx) => (
                        <Image
                          key={idx}
                          src={getImageUrl(img.imageUrl)}
                          className="w-full aspect-square object-cover"
                          alt="Post visual"
                        />
                      ))}
                    </Image.PreviewGroup>
                  </div>
                )}

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                  <div className="flex justify-between items-center mb-3">
                    <Text type="secondary" className="text-sm">
                      <HeartFilled className="text-red-500 mr-1" />{" "}
                      {post.likesCount} người đã thích
                    </Text>
                    <Text
                      type="secondary"
                      className="text-sm cursor-pointer hover:underline"
                      onClick={() => navigate(`${baseRoute}/posts/${post.id}`)} // 🚨 SỬA Ở ĐÂY
                    >
                      {post.commentsCount} bình luận
                    </Text>
                  </div>

                  <Divider className="my-0 mb-3 border-slate-200" />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="text"
                      className={`h-10 font-semibold text-[15px] ${hasLiked ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:bg-slate-100"}`}
                      onClick={() => handleToggleLike(post.id, hasLiked)}
                      icon={
                        hasLiked ? (
                          <HeartFilled className="text-red-500" />
                        ) : (
                          <HeartOutlined />
                        )
                      }
                    >
                      Thích
                    </Button>
                    <Button
                      type="text"
                      className="h-10 font-semibold text-[15px] text-slate-600 hover:bg-slate-100"
                      onClick={() =>
                        setActiveCommentPostId(
                          activeCommentPostId === post.id ? null : post.id,
                        )
                      }
                      icon={<MessageOutlined />}
                    >
                      Bình luận
                    </Button>
                  </div>

                  {activeCommentPostId === post.id && (
                    <div className="mt-3 pt-3 flex gap-2 items-start animate-fade-in">
                      <Avatar
                        size={36}
                        className="bg-blue-600 text-white flex-shrink-0"
                      >
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </Avatar>
                      <div className="flex-1 flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <Input.TextArea
                          autoSize={{ minRows: 1, maxRows: 4 }}
                          placeholder="Viết bình luận..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onPressEnter={(e) => {
                            if (!e.shiftKey) {
                              e.preventDefault();
                              handleCommentSubmit(post.id);
                            }
                          }}
                          className="border-none shadow-none focus:ring-0 resize-none py-1.5 px-3"
                        />
                        <Button
                          type="primary"
                          shape="circle"
                          loading={isCommenting}
                          onClick={() => handleCommentSubmit(post.id)}
                          className="bg-blue-600 flex-shrink-0 self-end mb-0.5 mr-0.5"
                          disabled={!commentText.trim()}
                        >
                          ↑
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {isLoading && (
            <Card className="shadow-sm rounded-xl border-none mb-6">
              <Skeleton loading={true} avatar active paragraph={{ rows: 3 }} />
            </Card>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="text-center py-6">
              <Text type="secondary" className="font-medium text-slate-400">
                Bạn đã xem hết bài viết. Hãy quay lại sau nhé!
              </Text>
            </div>
          )}

          {!isLoading && posts.length === 0 && (
            <Empty
              description="Hiện chưa có bài viết nào"
              className="bg-white p-12 rounded-xl border border-dashed border-slate-300"
            />
          )}
        </div>
      </Content>

      <Modal
        title={
          <Text strong className="text-lg">
            Xác nhận xóa
          </Text>
        }
        open={isDeleteModalOpen}
        onOk={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Xóa bài viết"
        cancelText="Hủy"
        okButtonProps={{
          danger: true,
          type: "primary",
          className: "font-bold rounded-lg",
        }}
        cancelButtonProps={{ type: "text", className: "rounded-lg" }}
        centered
        width={380}
      >
        <Text className="text-slate-600">
          Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể
          khôi phục.
        </Text>
      </Modal>
    </Layout>
  );
};

export default Post;
