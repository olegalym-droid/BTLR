import { useState } from "react";
import {
  loginRequest,
  registerRequest,
  saveAuthData,
} from "../lib/auth";

export default function useMasterAuth() {
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

  const validateForm = ({ fullName }) => {
    if (!phone || !password) {
      throw new Error("Заполни телефон и пароль");
    }

    if (phone.length < 12) {
      throw new Error("Введите корректный номер телефона");
    }

    if (password.length < 6) {
      throw new Error("Пароль должен быть не короче 6 символов");
    }

    if (mode === "register") {
      if (String(fullName || "").trim().split(/\s+/).length < 2) {
        throw new Error("Введите имя и фамилию");
      }

      if (password !== confirmPassword) {
        throw new Error("Пароли не совпадают");
      }

      if (selectedCategories.length === 0) {
        throw new Error("Выберите хотя бы одну категорию");
      }
    }
  };

  const handleSubmit = async ({ fullName, onAuthSuccess }) => {
    validateForm({ fullName });

    try {
      setIsLoading(true);

      let authData;

      if (mode === "register") {
        const [firstName = "", ...lastNameParts] = fullName.trim().split(/\s+/);

        authData = await registerRequest({
          role: "master",
          phone,
          password,
          firstName,
          lastName: lastNameParts.join(" "),
          fullName,
          categories: selectedCategories,
        });
      } else {
        authData = await loginRequest({
          role: "master",
          phone,
          password,
        });
      }

      saveAuthData(authData);

      if (onAuthSuccess) {
        await onAuthSuccess(authData);
      }

      return authData;
    } finally {
      setIsLoading(false);
    }
  };

  const resetMasterAuthState = () => {
    setMode("login");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setSelectedCategories([]);
    setIsLoading(false);
  };

  return {
    mode,
    setMode,
    phone,
    setPhone,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    selectedCategories,
    toggleCategory,
    isLoading,
    handleSubmit,
    resetMasterAuthState,
  };
}
