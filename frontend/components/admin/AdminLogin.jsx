export default function AdminLogin({
  login,
  setLogin,
  password,
  setPassword,
  handleLogin,
  isLoading,
  onBack,
}) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow space-y-4">
        <h1 className="text-xl font-bold text-center text-black">
          Вход администратора
        </h1>

        <input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="Логин"
          className="w-full rounded-lg border p-3 text-black"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="w-full rounded-lg border p-3 text-black"
        />

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full rounded-xl bg-black py-3 text-white disabled:opacity-60"
        >
          {isLoading ? "Загрузка..." : "Войти"}
        </button>

        <button
          onClick={onBack}
          className="w-full rounded-xl border py-3 text-black"
        >
          Назад
        </button>
      </div>
    </div>
  );
}