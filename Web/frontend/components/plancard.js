import React, { useEffect, useState } from "react";
import styles from "../styles/Plan.module.css";
import axios from "axios";
import { useRouter } from "next/router";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const PlanCard = ({ plan }) => {
  const router = useRouter();
  const [generalCredits, setGeneralCredits] = useState(null);
  const [dailyCredits, setDailyCredits] = useState(0);
  const [freeCredits, setFreeCredits] = useState(0);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchUserCredits(token);
      fetchCurrentPlan(token);
    }
  }, []);

  const fetchUserCredits = async (token) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/get-credits/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setGeneralCredits(Number(response.data.remaining_additional_credits));
      setDailyCredits(Number(response.data.remaining_daily_credits));
      setFreeCredits(Number(response.data.remaining_free_credits));
    } catch (error) {
      console.error("Failed to fetch user credits:", error);
    }
  };

  const fetchCurrentPlan = async (token) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/current-plan/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setCurrentPlan(response.data.plan);
    } catch (error) {
      console.error("Failed to fetch current plan:", error);
    }
  };

  const handlePayment = async (price, planId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      // Check if the plan is recurring and if the current plan exists
      if (plan.is_recurring && currentPlan) {
        if (currentPlan.id < 3 && planId > 2) {
          // Current plan is not a subscription plan, allow purchase
        } else if (planId <= currentPlan.id) {
          alert("현재 구독 중인 플랜보다 상위 플랜을 선택해야 합니다.");
          return;
        }
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/payments/create/`,
        { plan_id: planId },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
          withCredentials: true, // 세션 인증을 위해 필요
        }
      );
      const { next_redirect_pc_url, tid } = response.data;
      sessionStorage.setItem("tid", tid); // 세션 스토리지에 TID 저장
      window.location.href = next_redirect_pc_url;
    } catch (error) {
      console.error("결제 요청 실패:", error);
      alert("결제 요청에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className={styles.planCard}>
      <div style={{ height: "100px", marginTop: "50px" }}>
        <div style={{backgroundColor:`#${plan.color}`}} className={styles.circle}>
          <div
            className={styles.img}
            style={{ backgroundImage: `url(${plan.icon})` }}
          />
        </div>
      </div>
      <h2>{plan.name}</h2>
      {plan.options ? (
        <>
          {plan.options.map((option, index) => (
            <div key={index} className={styles.option}>
              <div
                className={styles.textbtn}
                onClick={() => handlePayment(option.price, option.id)}
              >
                <p>
                  {option.price.toLocaleString("ko-KR")} / {option.credits}{" "}
                  Credit 구매
                </p>
              </div>
            </div>
          ))}
          {isLoggedIn && (
            <div style={{ margin: "10px 5px" , fontSize:'15px'}}>
              <p>현재 {generalCredits}개의 Credit이 남았습니다.</p>
              <p>구매한 Credit은 90일 후 만료됩니다.</p>
            </div>
          )}
          <div style={{ width: "80%", marginTop: "10px" }}>
            <hr style={{ border: "solid 1px #A0A0A0", margin: "-2px" }} />
          </div>
          <ul
            style={{
              margin: "-1px",
              padding: "10px",
            }}
            className={styles.optli}
          >
            <li><pre>{plan.description1}</pre></li>
            <li><pre>{plan.description2}</pre></li>
          </ul>
        </>
      ) : (
        <>
          <div className={styles.daily}>
            <p>하루 API</p>
            <p>{plan.dailyCalls}회 호출</p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "baseline",
            }}
          >
            <p style={{ fontSize: "80px" }}>
              {plan.price.toLocaleString("ko-KR")}
            </p>
            <div className={styles.circle2}>$</div>
          </div>
          <button
            className={styles.button}
            onClick={() => handlePayment(plan.price, plan.id)}
          >
            Buy Now
          </button>
          {isLoggedIn && (
            <div style={{ margin: "3px 10px" }}>
              <p>현재 {dailyCredits + freeCredits}개의 Credit이 남았습니다.</p>
            </div>
          )}
          <ul>
            <li>{plan.description1}</li>
            <li>{plan.description2}</li>
          </ul>
        </>
      )}
    </div>
  );
};

export default PlanCard;