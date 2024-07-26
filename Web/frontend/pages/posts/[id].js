import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import styles from "../../styles/PostDetail.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function PostDetail() {
  const [post, setPost] = useState(null);
  const [newComment, setNewComment] = useState({
    content: "",
    is_public: true,
  });
  const [editingComment, setEditingComment] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get(`${BACKEND_URL}/api/user-info/`, {
          headers: { Authorization: `Token ${token}` },
        })
        .then((response) => setUser(response.data))
        .catch((error) => console.error("Error fetching user info", error));
    }
  }, [id]);

  const fetchPost = (id) => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Token ${token}` } : {};

    axios
      .get(`${BACKEND_URL}/api/posts/${id}/`, { headers })
      .then((response) => setPost(response.data))
      .catch((error) => {
        if (error.response && error.response.status === 403) {
          alert("비공개 게시글 입니다.");
          router.push("/contact/1");
        } else if (error.response && error.response.status === 404) {
          alert("삭제되었거나 존재하지 않는 게시글입니다.");
          router.push("/contact/1");
        } else {
          console.error("Error fetching post", error);
        }
      });
  };

  const handleCommentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewComment({
      ...newComment,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Token ${token}` };

    if (editingComment) {
      axios
        .put(`${BACKEND_URL}/api/comments/${editingComment.id}/`, newComment, {
          headers,
        })
        .then(() => {
          fetchPost(id);
          setNewComment({ content: "", is_public: true });
          setEditingComment(null);
        })
        .catch((error) => console.error("Error editing comment", error));
    } else {
      axios
        .post(`${BACKEND_URL}/api/posts/${id}/comments/`, newComment, {
          headers,
        })
        .then(() => {
          fetchPost(id);
          setNewComment({ content: "", is_public: true });
        })
        .catch((error) => console.error("Error posting comment", error));
    }
  };

  const handleCommentEdit = (comment) => {
    setNewComment({ content: comment.content, is_public: comment.is_public });
    setEditingComment(comment);
  };

  const handleCommentDelete = (commentId) => {
    if (confirm("정말로 댓글을 삭제하시겠습니까?")) {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };

      axios
        .delete(`${BACKEND_URL}/api/comments/${commentId}/`, { headers })
        .then(() => fetchPost(id))
        .catch((error) => console.error("Error deleting comment", error));
    }
  };

  const handlePostEdit = () => {
    router.push(`/write?id=${post.id}`);
  };

  const handlePostDelete = () => {
    if (confirm("정말로 게시글을 삭제하시겠습니까?")) {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Token ${token}` };

      axios
        .delete(`${BACKEND_URL}/api/posts/${id}/`, { headers })
        .then(() => router.push("/contact/1"))
        .catch((error) => console.error("Error deleting post", error));
    }
  };

  const handleBackClick = () => {
    router.push("/contact/1");
  };

  const anonymizeName = (name, isAuthorStaff, isUserStaff) => {
    if (isAuthorStaff || isUserStaff) return name;
    return name[0] + "*".repeat(name.length - 1);
  };

  if (!post) return <div>Loading...</div>;

  const canEditOrDelete = user && (user.is_staff || user.id === post.author_id);

  return (
    <div className={styles.container}>
      <div style={{ padding: "0 200px", background: "#fff" }}>
        <Navbar />
      </div>
      <div className={styles.main}>
        <div className={styles.head}>
          <h3>Contact Us</h3>
        </div>
        <h1 className={post.is_notice ? styles.noticeTitle : ""}>
          {post.title}
        </h1>
        <div className={styles.meta}>
          <span>By {anonymizeName(post.author_name, post.author_is_staff, user?.is_staff)}</span>
          <span>{new Date(post.created_at).toLocaleString()}</span>
          <span>Views: {post.views}</span>
        </div>
        <div className={styles.content}>
          <pre>{post.content}</pre>
        </div>
        <br />
        <div className={styles.commentsSection}>
          <div className={styles.commentHeader}>
            <button onClick={handleBackClick} className={styles.backButton}>
              글 목록
            </button>
            {canEditOrDelete && (
              <div className={styles.actions}>
                <button onClick={handlePostEdit}>수정</button>
                <button onClick={handlePostDelete}>삭제</button>
              </div>
            )}
          </div>
          <h2>댓글</h2>
          {post.comments.map((comment) => {
            const canEditOrDeleteComment =
              user &&
              (user.is_staff ||
                user.id === comment.author_id ||
                user.id === post.author_id);
            return (
              <div
                key={comment.id}
                className={`${styles.comment} ${
                  comment.author_name === "관리자" ? styles.adminComment : ""
                }`}
              >
                {editingComment && editingComment.id === comment.id ? (
                  <form
                    onSubmit={handleCommentSubmit}
                    className={styles.commentForm}
                  >
                    <textarea
                      name="content"
                      value={newComment.content}
                      onChange={handleCommentChange}
                      required
                    ></textarea>
                    <label>
                      <input
                        type="checkbox"
                        name="is_public"
                        checked={newComment.is_public}
                        onChange={handleCommentChange}
                      />{" "}
                      전체 공개
                    </label>
                    <div className={styles.actions}>
                      <button type="submit">수정</button>
                      <button
                        type="button"
                        onClick={() => setEditingComment(null)}
                      >
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <p>
                      {comment.is_public ? "" : "(비공개) "}
                      {comment.content}
                    </p>
                    <div className={styles.meta}>
                      <span>By {anonymizeName(comment.author_name, comment.author_is_staff, user?.is_staff)}</span>
                      <span>
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                      {canEditOrDeleteComment && (
                        <div className={styles.actions}>
                          <button onClick={() => handleCommentEdit(comment)}>
                            수정
                          </button>
                          <p>|</p>
                          <button
                            onClick={() => handleCommentDelete(comment.id)}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {user && !editingComment && (
            <div
              style={{
                borderTop: "solid #ccc",
                marginTop: "50px",
                padding: "50px 0",
              }}
            >
              <form
                onSubmit={handleCommentSubmit}
                className={styles.commentForm}
              >
                <label style={{ width: "15%" }}>
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={newComment.is_public}
                    onChange={handleCommentChange}
                  />{" "}
                  전체 공개
                </label>
                <div className={styles.commentline}>
                  <textarea
                    name="content"
                    value={newComment.content}
                    onChange={handleCommentChange}
                    placeholder="댓글을 입력하세요."
                    required
                  ></textarea>
                  <button className={styles.submit} type="submit">
                    등록
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
