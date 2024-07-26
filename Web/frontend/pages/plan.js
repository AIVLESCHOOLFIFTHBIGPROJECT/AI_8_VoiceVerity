import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PlanCard from "../components/plancard";
import axios from "axios";
import styles from "../styles/Plan.module.css";
import { useRouter } from "next/router";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const plans = [
  {
    name: "Pay As You Go",
    options: [
      { id: 1, price: 9.99, credits: 10 },
      { id: 2, price: 45.99, credits: 65 },
    ],
    color: 'B29191',
    icon: "/images/moneyclip.png",
    description1: `  구독이 필요하지 않습니다. 
  사용할 만큼만 비용을 지불하세요.`,
    description2: `  오래 사용할 수 있습니다. 
  90일 동안 자유롭게 사용하세요.`,
  },
  {
    id: 3,
    color: 'cdcdcd',
    icon: "/images/b.png",
    name: "Basic",
    price: 9,
    dailyCalls: 10,
    description1: "0.9$ / 1회",
    description2: "30일 구독 상품",
    is_recurring: 1,
  },
  {
    id: 4,
    color: 'fffedc',
    icon:"/images/a.png",
    name: "Associate",
    price: 29,
    dailyCalls: 50,
    description1: "0.58$ / 1회",
    description2: "30일 구독 상품",
    is_recurring: 1,
  },
  {
    id: 5,
    color: '78dcff',
    icon:"/images/p.png",
    name: "Professional",
    price: 79,
    dailyCalls: 200,
    description1: "0.39$ / 1회",
    description2: "30일 구독 상품",
    is_recurring: 1,
  },
];

const Plans = () => {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { pg_token } = router.query;
  const [paymentDetails, setPaymentDetails] = useState(null);

  const fetchUserInfo = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/user-info/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user info", error);
      }
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    const approvePayment = async () => {
      const token = localStorage.getItem("token");
      if (pg_token && token) {
        try {
          const response = await axios.get(`${BACKEND_URL}/api/payments/approval/`, {
            params: { pg_token },
            headers: {
              Authorization: `Token ${token}`,
            },
            withCredentials: true, // 세션 인증을 위해 필요
          });
          setPaymentDetails(response.data);
        } catch (error) {
          console.error("Failed to approve payment:", error);
          router.push("/planfail"); // 결제 실패 페이지로 이동
        }
      }
    };

    approvePayment();
  }, [pg_token, router]);

  return (
    <div className={styles.container}>
      <div style={{ padding: "0 200px", background: "#fff" }}>
        <Navbar />
      </div>
      <div style={{ height: "150px" }} />
      <div className={styles.main}>
        <div style={{ height: "200px" }}>
          <h1>Voice Verity</h1>
          <p>Voice Verity에서는 실시간 통화 중 딥보이스를 감지할 수 있습니다.</p>
          <p>내게 맞는 Voice Verity 요금제를 선택하세요.</p>
        </div>
        <div className={styles.plansContainer}>
          {plans.map((plan, index) => (
            <PlanCard key={index} plan={plan} />
          ))}
        </div>
      </div>
      <div style={{ height: "200px" }} />
      <div className={styles.contactUs}>
        <h2>Voice Verity와 함께해요.</h2>
        <p style={{ margin: "20px" }}>당신의 든든한 파트너가 될 수 있습니다.</p>
        <button onClick={() => router.push("/contact/1")}>Contact Us</button>
      </div>
      <Footer />
    </div>
  );
};

export default Plans;