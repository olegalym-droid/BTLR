import { useState } from "react";

export default function useOrderForm({ initialAddress = "" } = {}) {
  const [category, setCategory] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [clientPrice, setClientPrice] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [address, setAddress] = useState(initialAddress);

  const resetForm = (nextAddress = "") => {
    setCategory("");
    setServiceName("");
    setDescription("");
    setClientPrice("");
    setAddress(nextAddress);
    setSelectedDate("");
    setSelectedTime("");
  };

  return {
    category,
    setCategory,
    serviceName,
    setServiceName,
    description,
    setDescription,
    clientPrice,
    setClientPrice,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    address,
    setAddress,
    resetForm,
  };
}