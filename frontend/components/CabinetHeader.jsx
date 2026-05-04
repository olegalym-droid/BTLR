import { LayoutDashboard, LogOut, UserRound } from "lucide-react";

export default function CabinetHeader({
  title,
  subtitle = "",
  roleLabel = "",
  accountName = "",
  activeLabel = "",
  onLogout,
  children,
}) {
  return (
    <header className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {roleLabel ? (
              <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#d9ead8] bg-[#f0f7ef] px-3 text-xs font-bold uppercase text-[#4f7f56]">
                <UserRound size={15} />
                {roleLabel}
              </span>
            ) : null}

            {activeLabel ? (
              <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-gray-200 bg-[#fbfcfb] px-3 text-xs font-bold text-gray-600">
                <LayoutDashboard size={15} />
                {activeLabel}
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 text-2xl font-bold leading-tight text-[#111827] sm:text-3xl">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-gray-500 sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          {accountName ? (
            <div className="min-h-[52px] rounded-[18px] border border-gray-200 bg-[#fbfcfb] px-4 py-2 text-left shadow-sm">
              <div className="text-[11px] font-bold uppercase text-gray-400">
                Аккаунт
              </div>
              <div className="max-w-[240px] truncate text-sm font-bold text-[#111827]">
                {accountName}
              </div>
            </div>
          ) : null}

          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[18px] border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#4f7f56] shadow-sm transition hover:bg-[#f8faf8]"
            >
              <LogOut size={18} />
              Выйти
            </button>
          ) : null}
        </div>
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
    </header>
  );
}
