import Navbar from "../../components/Navbar.Term";
import Footer from '../../components/Footer';
import styles from '../../styles/Terms.module.css';

export default function ServiceTerms() {
  return (
    <div className={styles.container}>
      <div className={styles.navFooter}>
        <Navbar />
      </div>
      <div style={{ height: "40px" }} />
      <div className={styles.main}>
        <h1>Voice Verity 통합서비스 약관</h1>
        <div className={styles.space}>
          <p>Voice Verity의 통합서비스를 이용해 주셔서 감사합니다. </p>
          <p>본 약관은 귀하와 Voice Verity 간의 법적 계약입니다. 서비스 이용에 앞서 본 약관을 주의 깊게 읽어주시기 바랍니다.</p>
          <div style={{ height: "30px" }} />
          <h2>제1조 (목적)</h2>
          <p>본 약관은 Voice Verity(이하 "회사")가 제공하는 모든 서비스(이하 "서비스")의 이용 조건 및 절차, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
          <div style={{ height: "30px" }} />
          <h2>제2조 (용어의 정의)</h2>
          <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
          <ul>
            <li>"회원"이란 본 약관에 따라 회사와 이용계약을 체결하고, 회사가 제공하는 서비스를 이용하는 고객을 말합니다.</li>
            <li>"서비스"란 회사가 제공하는 모든 온라인 및 오프라인 서비스를 의미합니다.</li>
          </ul>
          <div style={{ height: "30px" }} />
          <h2>제3조 (이용계약의 성립)</h2>
          <p>이용계약은 회원이 되고자 하는 자가 본 약관의 내용에 동의한 후 회원가입 신청을 하고, 회사가 이러한 신청에 대하여 승낙함으로써 성립합니다.</p>
          <div style={{ height: "30px" }} />
          <h2>제4조 (회원 정보의 변경)</h2>
          <p>회원은 개인정보관리 화면을 통해 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다. </p>
          <p>회원은 신청 시 기재한 사항이 변경되었을 경우 온라인으로 수정을 하여야 합니다. 변경사항을 수정하지 않아 발생한 불이익에 대해 회사는 책임지지 않습니다.</p>
          <div style={{ height: "30px" }} />
          <h2>제5조 (서비스의 제공 및 변경)</h2>
          <p>회사는 서비스의 내용과 종류를 변경할 수 있으며, 변경 사항은 사전에 공지합니다. </p>
          <p>회원은 변경된 서비스 내용에 동의하지 않을 경우 이용계약을 해지할 수 있습니다.</p>
          <div style={{ height: "30px" }} />
          <h2>제6조 (서비스의 중단)</h2>
          <p>회사는 시스템 점검, 교체 및 고장, 통신 두절 등의 사유가 발생한 경우 서비스의 제공을 일시적으로 중단할 수 있으며, 이 경우 사전 또는 사후에 이를 공지합니다.</p>
          <div style={{ height: "30px" }} />
          <h2>제7조 (회원의 의무)</h2>
          <p>회원은 다음 행위를 하여서는 안 됩니다:</p>
          <ul>
            <li>회원가입 신청 또는 변경 시 허위 내용의 등록</li>
            <li>타인의 정보 도용</li>
            <li>회사가 게시한 정보의 변경</li>
            <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
            <li>회사 및 기타 제3자의 저작권 등 지적 재산권에 대한 침해</li>
            <li>회사 및 기타 제3자의 명예를 손상하거나 업무를 방해하는 행위</li>
          </ul>
        </div>
      </div>
      <div className={styles.footer}>
        <Footer />
      </div>
    </div>
  );
}
