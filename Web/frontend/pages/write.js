import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "../styles/Write.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Write() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isNotice, setIsNotice] = useState(false);
  const [isPublic, setIsPublic] = useState(true); // 전체공개 여부
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    fetchUser();
    if (id) {
      setIsEditMode(true);
      fetchPost(id);
    } else {
      setContent(`<비즈니스 문의 양식>

담당자 이름:
이메일:
연락처: 
부서:
직급:
회사:
국가:
문의 주제:
문의 내용:`);
    }
  }, [id]);

  const fetchUser = () => {
    const token = localStorage.getItem("token");
    axios
      .get(`${BACKEND_URL}/api/user-info/`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        setIsAdmin(response.data.is_staff);
      })
      .catch((error) => console.error("Error fetching user info", error));
  };

  const fetchPost = (id) => {
    const token = localStorage.getItem("token");
    axios
      .get(`${BACKEND_URL}/api/posts/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        const post = response.data;
        setTitle(post.title);
        setContent(post.content);
        setIsNotice(post.is_notice);
        setIsPublic(post.is_public); // 전체공개 여부 설정
      })
      .catch((error) => console.error("Error fetching post", error));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const data = { title, content, is_notice: isNotice, is_public: isPublic }; // 전체공개 여부 추가
    const headers = { Authorization: `Token ${token}` };

    if (isEditMode) {
      axios
        .put(`${BACKEND_URL}/api/posts/${id}/`, data, { headers })
        .then(() => router.push(`/posts/${id}`))
        .catch((error) => console.error("Error updating post", error));
    } else {
      axios
        .post(`${BACKEND_URL}/api/posts/`, data, { headers })
        .then((response) => router.push(`/posts/${response.data.id}`))
        .catch((error) => console.error("Error creating post", error));
    }
  };

  const handleCancel = () => {
    router.push("/contact/1");
  };

  return (
    <div className={styles.container}>
      <div style={{ padding: "0 200px", background: "#fff" }}>
        <Navbar />
      </div>
      <div className={styles.head}>
        <h1>{isEditMode ? "게시글 수정" : "게시글 작성"}</h1>
      </div>
      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          {isAdmin && (
            <label>
              <input
                type="checkbox"
                className={styles.check}
                checked={isNotice}
                onChange={(e) => setIsNotice(e.target.checked)}
              />{" "}
              <span className={styles.check}></span>
              공지사항
            </label>
          )}
          <label>
            <input
              type="checkbox"
              className={styles.check}
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />{" "}
            <span className={styles.check}></span>
            전체공개
          </label>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.button} ${styles.cancelButton}`}
              onClick={handleCancel}
            >
              {isEditMode ? "수정 취소" : "작성 취소"}
            </button>
            <button type="submit" className={styles.button}>
              {isEditMode ? "수정 완료" : "글 등록"}
            </button>
          </div>
        </form>
      </div>
      <div className={styles.footer}>
        <Footer />
      </div>
    </div>
  );
}
