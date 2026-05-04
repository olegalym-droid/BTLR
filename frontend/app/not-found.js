import StatePanel from "../components/StatePanel";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-100 text-[#111827]">
      <StatePanel
        title="Страница не найдена"
        text="Такого адреса нет или раздел больше недоступен. Вернитесь на главную и откройте нужный кабинет."
        actionLabel="На главную"
        actionHref="/"
      />
    </main>
  );
}
