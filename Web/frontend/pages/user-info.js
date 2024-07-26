import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DeleteAccountModal from "../components/DeleteAccountModal"; // Import the modal component
import { useRouter } from "next/router";
import styles from "../styles/UserInfo.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];

export default function UserInfo() {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [smsMarketing, setSmsMarketing] = useState(false);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(
    "/images/userinfo/profile_default.png"
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // State to manage modal visibility
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get(`${BACKEND_URL}/api/user-info/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        })
        .then((response) => {
          setUser(response.data);
          setNickname(response.data.nickname);
          setCompany(response.data.company);
          setContact(response.data.contact);
          setSmsMarketing(response.data.sms_marketing);
          setEmailMarketing(response.data.email_marketing);
          setImagePreviewUrl(
            response.data.profile_image_url
              ? `${BACKEND_URL}${response.data.profile_image_url}`
              : "/images/userinfo/profile_default.png"
          );
        })
        .catch((error) => {
          console.error("사용자 정보 가져오기 오류", error);
          alert("사용자 정보를 가져오는데 실패했습니다.");
        });
    }
  }, []);

  const handleNicknameChange = (e) => {
    const { value } = e.target;
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value);

    if ((isKorean && value.length <= 4) || (!isKorean && value.length <= 6)) {
      setNickname(value);
    } else {
      alert("닉네임은 한글 4자 이하, 영어 6자 이하만 가능합니다.");
    }
  };

  const handleContactChange = (e) => {
    const { value } = e.target;
    const regex = /^[0-9]*$/;

    if (regex.test(value)) {
      setContact(value);
    } else {
      alert("연락처는 숫자만 입력 가능합니다.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname || !contact) {
      alert("닉네임과 연락처 필드를 비워둘 수 없습니다.");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${BACKEND_URL}/api/user-info/`,
        {
          nickname: nickname,
          company: company,
          contact: contact,
          sms_marketing: smsMarketing,
          email_marketing: emailMarketing,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      alert("사용자 정보가 성공적으로 업데이트되었습니다.");
    } catch (error) {
      console.error("사용자 정보 업데이트 오류", error);
      alert("사용자 정보 업데이트 오류: " + error.response.data.error);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("모든 비밀번호 필드를 입력해주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("새 비밀번호가 일치하지 않습니다.");
      setNewPassword("");
      setConfirmPassword("");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${BACKEND_URL}/api/change-password/`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      alert("비밀번호가 성공적으로 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("비밀번호 변경 오류", error);
      alert("비밀번호 변경 오류: " + error.response.data.error);
    }
  };

  const handleAccountDeletion = () => {
    setIsModalOpen(true); // Show the modal when delete account is clicked
  };

  const handleImageChange = async (e) => {
    e.preventDefault();
    let reader = new FileReader();
    let file = e.target.files[0];

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert("이미지 파일만 업로드해주세요 (jpg, jpeg, png, gif).");
      return;
    }

    if (file.size / 1024 / 1024 > MAX_FILE_SIZE_MB) {
      alert("파일 크기가 10MB를 초과합니다.");
      return;
    }

    reader.onloadend = () => {
      setProfileImage(file);
      setImagePreviewUrl(reader.result);
    };

    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("profile_image", file);

    const token = localStorage.getItem("token");
    try {
      await axios.put(`${BACKEND_URL}/api/user-info/`, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("프로필 이미지가 성공적으로 업데이트되었습니다.");
    } catch (error) {
      console.error("프로필 이미지 업데이트 오류", error);
      alert("프로필 이미지 업데이트 오류: " + error.response.data.error);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ padding: "0 200px", background: "#fff" }}>
        <Navbar />
      </div>
      <div className={styles.main}>
        <div style={{ height: "100px" }} />
        <div className={styles.userInfoBox}>
          <div className={styles.profileContainer}>
            <img
              src={imagePreviewUrl}
              alt="Profile Preview"
              className={styles.profileImage}
            />
            <p>{user?.username || "User Name"}</p>
            <label
              htmlFor="profile-upload"
              className={styles.profileUploadLabel}
            >
              Upload
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.profileUploadInput}
              />
            </label>
          </div>
          {user ? (
            <form className={styles.form}>
              <div className={styles.line}>
                <div
                  style={{ width: "10%", height: "2px", background: "#000" }}
                />
                <h2 style={{ width: "50%" }}>계정 정보</h2>
                <div
                  style={{ width: "100%", height: "2px", background: "#000" }}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label>닉네임</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={handleNicknameChange}
                  required
                  className={styles.inputField}
                  placeholder="닉네임 (한글 4자 이하, 영어 6자 이하)"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label>이메일</label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className={styles.inputField}
                />
              </div>
              <div className={styles.pwfield}>
                <div>
                  <label>비밀번호 변경</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={styles.inputField}
                    placeholder="현재 비밀번호"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.inputField}
                    placeholder="새 비밀번호 (4자리 이상)"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.inputField}
                    placeholder="비밀번호 다시 입력"
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  className={styles.button}
                >
                  비밀번호 변경
                </button>
              </div>

              <div className={styles.line}>
                <div
                  style={{ width: "10%", height: "2px", background: "#000" }}
                />
                <h2 style={{ width: "50%" }}>회원 정보</h2>
                <div
                  style={{ width: "100%", height: "2px", background: "#000" }}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label>이름</label>
                <input
                  type="text"
                  value={user.username}
                  readOnly
                  className={styles.inputField}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label>연락처</label>
                <input
                  type="text"
                  value={contact}
                  onChange={handleContactChange}
                  required
                  className={styles.inputField}
                  placeholder="연락처 (- 없이 입력)"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label>회사명</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={styles.inputField}
                  placeholder="선택"
                />
              </div>
              <div style={{ marginTop: "50px" }}>
                <p
                  style={{
                    color: "#868686",
                    textAlign: "left",
                  }}
                >
                  마케팅활용동의 및 광고수신동의(선택)
                </p>
              </div>
              <div className={styles.marketing}>
                <div className={styles.checkboxGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={smsMarketing}
                      onChange={() => setSmsMarketing(!smsMarketing)}
                    />
                    SMS 수신 동의
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={emailMarketing}
                      onChange={() => setEmailMarketing(!emailMarketing)}
                    />
                    E-mail 수신 동의
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className={styles.button}
                >
                  변경사항 저장
                </button>
              </div>
              <div className={styles.deleteContainer}>
                <span className={styles.deleteText} onClick={handleAccountDeletion}>
                  회원 탈퇴하기
                </span>
              </div>
            </form>
          ) : (
            <p>로딩 중...</p>
          )}
        </div>
      </div>
      <div style={{ height: "100px" }} />
      <Footer />
      <DeleteAccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
