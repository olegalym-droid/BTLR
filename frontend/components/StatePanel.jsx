export default function StatePanel({
  title,
  text = "",
  detail = "",
  actionLabel = "",
  onAction,
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-8">
      <div className="w-full rounded-[28px] border border-gray-200 bg-white p-6 text-[#1f2933] shadow-sm">
        <h1 className="text-2xl font-bold">{title}</h1>

        {text ? <p className="mt-3 text-sm leading-6 text-gray-600">{text}</p> : null}

        {detail ? (
          <p className="mt-4 break-words rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
            {detail}
          </p>
        ) : null}

        {actionLabel && typeof onAction === "function" ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-5 rounded-2xl bg-[#6f9f72] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5f9557]"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
