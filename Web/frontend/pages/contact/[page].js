import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import styles from "../../styles/Contact.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Contact() {
  const [notices, setNotices] = useState([]);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [searchOption, setSearchOption] = useState("title");
  const [searchInitiated, setSearchInitiated] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);
  const router = useRouter();
  const { page } = router.query;

  const currentPage = parseInt(page) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      alert("없는 페이지입니다.");
      router.push(`/contact/${totalPages}`);
    } else {
      fetchPosts(currentPage, query, searchOption);
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
  }, [page]);

  const fetchPosts = (page, query, searchOption) => {
    axios
      .get(`${BACKEND_URL}/api/posts/`, {
        params: { page, query, searchOption },
      })
      .then((response) => {
        const { notices, posts, count } = response.data.results;
        setNotices(notices || []);
        setPosts(posts || []);
        setTotalPages(Math.ceil(count / 10));
        setTotalPosts(count);

        if (currentPage > Math.ceil(count / 10)) {
          alert("없는 페이지입니다.");
          router.push(`/contact/${Math.ceil(count / 10)}`);
        }
      })
      .catch((error) => console.error("Error fetching posts", error));
  };

  const handleWriteClick = () => {
    if (!user) {
      alert("로그인 후 이용해 주세요.");
      return;
    }
    router.push("/write");
  };

  const handlePostClick = (post) => {
    if (
      !post.is_public &&
      (!user || (user.id !== post.author_id && !user.is_staff))
    ) {
      alert("비공개 게시글입니다.");
      return;
    }
    router.push(`/posts/${post.id}`);
  };

  const handlePageChange = (page) => {
    router.push(`/contact/${page}`);
  };

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSearchOptionChange = (e) => {
    setSearchOption(e.target.value);
  };

  const handleSearchClick = () => {
    setSearchInitiated(true);
    handlePageChange(1); // 페이지 번호를 1로 설정하고 검색 시작
  };

  const anonymizeName = (name, isStaff, isAuthorStaff) => {
    if (isStaff || isAuthorStaff) return name;
    return name[0] + "*".repeat(name.length - 1);
  };

  const renderPagination = () => {
    const pages = [];
    const totalPagesToShow = 5;
    const startPage = Math.floor((currentPage - 1) / totalPagesToShow) * totalPagesToShow + 1;
    const endPage = Math.min(startPage + totalPagesToShow - 1, totalPages);

    if (startPage > 1) {
      pages.push(<button key="prevSet" onClick={() => handlePageChange(startPage - 1)}>&lt;</button>);
    }

    for (let page = startPage; page <= endPage; page++) {
      pages.push(
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={page === currentPage ? styles.active : ""}
        >
          {page}
        </button>
      );
    }

    if (endPage < totalPages) {
      pages.push(<button key="nextSet" onClick={() => handlePageChange(endPage + 1)}>&gt;</button>);
    }

    return pages;
  };

  return (
    <div className={styles.container}>
      <div style={{ padding: "0 200px", background: "#fff" }}>
        <Navbar />
      </div>
      <div className={styles.head}>
        <div style={{ width: "30%" }} />
        <div style={{ width: "40%" }}>
          <div>
            <h1>Contact Us</h1>
            <p>Voice Verity에 관한 비즈니스 문의를 남겨주세요.</p>
          </div>
        </div>
        <div style={{ width: "30%" }}>
          <div className={styles.searchContainer}>
            <select
              value={searchOption}
              onChange={handleSearchOptionChange}
              className={styles.searchSelect}
            >
              <option value="title">제목</option>
              <option value="author">글쓴이</option>
            </select>
            <input
              type="text"
              placeholder="검색"
              value={query}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
            <button onClick={handleSearchClick} className={styles.searchButton}>
              🔍
            </button>
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <button onClick={handleWriteClick} className={styles.writeButton}>
          글쓰기
        </button>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "10%" }}>No</th>
              <th style={{ width: "50%" }}>제목</th>
              <th>글쓴이</th>
              <th style={{ width: "10%" }}>작성시간</th>
              <th style={{ width: "10%" }}>조회수</th>
            </tr>
          </thead>
          <tbody>
            {notices.length > 0 &&
              notices.map((post) => (
                <tr
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  className={styles.notice}
                >
                  <td>공지</td>
                  <td>
                    {!post.is_public && <span>(비공개) </span>}
                    {post.title}
                    {post.comments_count > 0 && (
                      <span style={{ color: "#999" }}>
                        {" "}
                        [{post.comments_count}]
                      </span>
                    )}
                  </td>
                  <td>{anonymizeName(post.author_name, post.author_is_staff, user?.is_staff)}</td>
                  <td style={{ fontSize: "12px" }}>
                    {new Date(post.created_at).toLocaleString()}
                  </td>
                  <td>{post.views}</td>
                </tr>
              ))}
            {posts.length === 0 && searchInitiated ? (
              <tr>
                <td colSpan="5">일치하는 결과가 없습니다.</td>
              </tr>
            ) : (
              posts.map((post, index) => (
                <tr
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  className={post.is_notice ? styles.notice : ""}
                >
                  <td>{totalPosts - ((currentPage - 1) * 10) - index}</td>
                  <td>
                    {!post.is_public && <span>(비공개) </span>}
                    {post.title}
                    {post.comments_count > 0 && (
                      <span style={{ color: "#999" }}>
                        {" "}
                        [{post.comments_count}]
                      </span>
                    )}
                  </td>
                  <td>{anonymizeName(post.author_name, post.author_is_staff, user?.is_staff)}</td>
                  <td style={{ fontSize: "12px" }}>
                    {new Date(post.created_at).toLocaleString()}
                  </td>
                  <td>{post.views}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className={styles.pagination}>
          {renderPagination()}
        </div>
      </div>
      <div style={{ height: "100px" }} />
      <Footer />
    </div>
  );
}
