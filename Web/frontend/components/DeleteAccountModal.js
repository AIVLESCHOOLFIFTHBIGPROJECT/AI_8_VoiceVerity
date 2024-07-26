import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import styles from "../styles/DeleteAccountModal.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const DeleteAccountModal = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleDeleteAccount = async () => {
    setErrorMessage(""); // Reset error message
    const token = localStorage.getItem("token");
    try {
      // 비밀번호 확인 요청
      const confirmResponse = await axios.post(
        `${BACKEND_URL}/api/confirm-delete-account/`,
        { password: password },
        { headers: { Authorization: `Token ${token}` } }
      );

      // 비밀번호 확인 후 계정 삭제 요청
      await axios.delete(`${BACKEND_URL}/api/delete-account/`, {
        headers: { Authorization: `Token ${token}` },
      });

      alert("계정이 성공적으로 삭제되었습니다.");
      localStorage.removeItem("token");
      router.push("/");
    } catch (error) {
      console.error("계정 삭제 오류", error);
      if (error.response && error.response.status === 400) {
        setErrorMessage("비밀번호가 틀렸습니다.");
      } else {
        alert("계정 삭제 오류: " + (error.response?.data.error || error.message));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>X</button>
        <h2>계정 삭제</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.inputField}
          placeholder="비밀번호 입력"
        />
        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        <div className={styles.buttonContainer}>
          <button onClick={handleDeleteAccount} className={styles.deleteButton}>삭제</button>
          <button onClick={onClose} className={styles.cancelButton}>취소</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
