import React, { useEffect, useRef } from "react";
import { Spin, message } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/AuthService";
import { userService } from "../../services/UserService";
import { setCredentials } from "../../store/slice/UserSlice";

const resolvePrimaryRole = (roles) => {
  if (!Array.isArray(roles)) {
    return "PATIENT";
  }

  const roleNames = roles
    .map((role) => role?.name)
    .filter(Boolean)
    .map((name) => name.toUpperCase());

  if (roleNames.includes("ADMIN")) return "ADMIN";
  if (roleNames.includes("DOCTOR")) return "DOCTOR";
  if (roleNames.includes("BRAND")) return "BRAND";
  if (roleNames.includes("PATIENT")) return "PATIENT";
  return "PATIENT";
};

const normalizeUserProfile = (profile) => {
  if (!profile) return null;

  return {
    ...profile,
    id: profile.id ?? profile.user_id,
    firstName: profile.firstName ?? profile.first_name ?? "",
    lastName: profile.lastName ?? profile.last_name ?? "",
    phone: profile.phone ?? "",
    dob: profile.dob ?? null,
    avatarUrl: profile.avatarUrl ?? profile.avatar_url ?? null,
    roles: profile.roles ?? [],
    hasPassword: Boolean(profile.hasPassword),
    googleLinked: Boolean(profile.googleLinked),
  };
};

const Authenticate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    const authenticate = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (!code) {
        message.error("Thiếu mã xác thực Google. Vui lòng thử lại.");
        navigate("/auth/login", { replace: true });
        return;
      }

      const processedCodeKey = `google_oauth_processed_${code}`;
      if (sessionStorage.getItem(processedCodeKey) === "1") {
        navigate("/auth/login", { replace: true });
        return;
      }
      sessionStorage.setItem(processedCodeKey, "1");

      try {
        const res = await authService.outboundAuthenticate(code);
        if (res?.data?.code !== 1000) {
          throw new Error("OAuth authentication failed");
        }

        const userRes = await userService.getMyInfo();
        const rawProfile = userRes.data?.result || userRes.data;
        const profile = normalizeUserProfile(rawProfile);
        const role = resolvePrimaryRole(profile.roles);

        dispatch(
          setCredentials({
            user: {
              ...profile,
              role,
            },
          }),
        );

        message.success("Đăng nhập Google thành công!");

        if (role === "ADMIN") navigate("/admin/dashboard", { replace: true });
        else if (role === "DOCTOR") navigate("/doctor/schedule", { replace: true });
        else if (role === "BRAND") navigate("/brand/profile", { replace: true });
        else navigate("/", { replace: true });
      } catch (error) {
        message.error(
          error?.response?.data?.message ||
            "Không thể xác thực bằng Google. Vui lòng thử lại.",
        );
        navigate("/auth/login", { replace: true });
      }
    };

    authenticate();
  }, [dispatch, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Spin size="large" />
        <p>Đang xác thực tài khoản Google...</p>
      </div>
    </div>
  );
};

export default Authenticate;
