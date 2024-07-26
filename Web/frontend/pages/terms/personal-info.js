import Navbar from "../../components/Navbar.Term";
import Footer from "../../components/Footer";
import styles from "../../styles/Terms.module.css";

export default function PersonalInfoTerms() {
  return (
    <div className={styles.container}>
      <div className={styles.navFooter}>
        <Navbar />
      </div>
      <div style={{ height: "40px" }} />
      <div className={styles.main}>
        <h1>개인정보 수집 및 이용 동의</h1>
        <div className={styles.space}>
          <p>
            Voice Verity는 회원님의 개인정보를 중요시하며, "정보통신망 이용촉진
            및 정보보호 등에 관한 법률"을 준수하고 있습니다.{" "}
          </p>
          <p>
            Voice Verity는 개인정보 취급 방침을 통하여 회원님께서 제공하시는
            개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보 보호를
            위해 어떠한 조치가 취해지고 있는지 알려드립니다.
          </p>
          <div style={{ height: "30px" }} />
          <h2>수집하는 개인정보 항목</h2>
          <p>
            회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를
            수집하고 있습니다:
          </p>
          <ul>
            <li>수집 항목: 이름, 닉네임, 이메일, 비밀번호, 회사명, 연락처</li>
            <li>개인정보 수집 방법: 홈페이지(회원가입)</li>
          </ul>
          <div style={{ height: "30px" }} />
          <h2>개인정보의 수집 및 이용 목적</h2>
          <p>Voice Verity는 수집한 개인정보를 다음의 목적을 위해 활용합니다:</p>
          <ul>
            <li>서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금 정산</li>
            <li>회원 관리</li>
            <li>마케팅 및 광고에 활용(추후 약관 동의 시)</li>
          </ul>
          <div style={{ height: "30px" }} />
          <h2>개인정보의 보유 및 이용 기간</h2>
          <p>
            회원 탈퇴 시까지 보유하며, 탈퇴 후에는 해당 정보를 지체 없이
            파기합니다.{" "}
          </p>
          <p>
            다만, 관계 법령에 따라 보관할 필요가 있는 경우에는 법령에서 정한
            일정 기간 동안 회원 정보를 보관합니다.
          </p>
          <div style={{ height: "30px" }} />
          <h2>동의 거부 권리</h2>
          <p>
            회원님은 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있으며,
            동의를 거부할 경우 회원가입이 제한될 수 있습니다.
          </p>
        </div>
      </div>
      <div className={styles.footer}>
        <Footer />
      </div>
    </div>
  );
}
