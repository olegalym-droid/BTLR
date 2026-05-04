import { useCallback, useEffect, useState } from "react";
import { loadOrdersRequest } from "../lib/orders";
import { getStoredAuthUser } from "../lib/auth";

const USER_ORDERS_POLL_INTERVAL_MS = 10000;

export default function useUserOrdersData() {
  const [orders, setOrders] = useState(() => {
    const authUser = getStoredAuthUser();
    return authUser?.id && authUser.role === "user" ? [] : [];
  });

  const loadOrders = useCallback(async () => {
    const authUser = getStoredAuthUser();

    if (!authUser?.id || authUser.role !== "user") {
      return;
    }

    try {
      const data = await loadOrdersRequest();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Ошибка загрузки заявок:", error);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    const authUser = getStoredAuthUser();

    if (!authUser?.id || authUser.role !== "user") {
      return;
    }

    let isMounted = true;

    const runLoadOrders = async () => {
      try {
        const data = await loadOrdersRequest();

        if (!isMounted) {
          return;
        }

        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Ошибка загрузки заявок:", error);
        setOrders([]);
      }
    };

    runLoadOrders();

    const interval = setInterval(() => {
      runLoadOrders();
    }, USER_ORDERS_POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return {
    orders,
    setOrders,
    loadOrders,
  };
}
