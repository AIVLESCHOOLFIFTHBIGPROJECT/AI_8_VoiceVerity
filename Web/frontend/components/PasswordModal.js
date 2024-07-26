import React, { useState } from 'react';
import Modal from 'react-modal';
import styles from '../styles/PasswordModal.module.css';

Modal.setAppElement('#__next');

const PasswordModal = ({ isOpen, onRequestClose, onSubmit }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    onSubmit(password);
    setPassword('');
    onRequestClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="비밀번호 입력"
      className={styles.modal}
      overlayClassName={styles.overlay}
    >
      <button onClick={onRequestClose} className={styles.closeButton}>x</button>
      <h2>비밀번호를 입력해주세요</h2>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={styles.passwordInput}
        placeholder="비밀번호를 입력해 주세요."
      />
      <button onClick={handleSubmit} className={styles.submitButton}>
        확인
      </button>
      <button onClick={onRequestClose} className={styles.cancelButton}>
        취소
      </button>
    </Modal>
  );
};

export default PasswordModal;
