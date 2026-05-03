import { useEffect, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  MessageCircle,
  User,
  Wallet,
} from "lucide-react";
import MasterProfileSection from "./MasterProfileSection";
import MasterWalletSection from "./MasterWalletSection";
import MasterScheduleSection from "./MasterScheduleSection";
import MasterOrdersTabsSection from "./MasterOrdersTabsSection";
import ChatCenter from "../chat/ChatCenter";
import { loadChatConversations } from "../../lib/chats";

const SECTIONS = [
  {
    key: "profile",
    label: "Профиль",
    icon: User,
  },
  {
    key: "schedule",
    label: "График",
    icon: CalendarDays,
  },
  {
    key: "orders",
    label: "Заказы",
    icon: ClipboardList,
  },
  {
    key: "wallet",
    label: "Кошелёк",
    icon: Wallet,
  },
  {
    key: "chats",
    label: "Чаты",
    icon: MessageCircle,
  },
];

const MASTER_CHAT_POLL_INTERVAL_MS = 12000;

function SectionTabs({ activeSection, setActiveSection, chatUnreadCount = 0 }) {
  return (
    <nav className="rounded-[28px] border border-gray-200 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveSection(item.key)}
              className={`flex min-h-[68px] items-center justify-center gap-3 rounded-[22px] px-4 py-3 text-sm font-bold transition ${
                isActive
                  ? "bg-[#e6f1e5] text-[#4f8a55]"
                  : "bg-white text-[#344054] hover:bg-[#f7faf6]"
              }`}
            >
              <span
                className={`relative flex h-10 w-10 items-center justify-center rounded-2xl ${
                  isActive ? "bg-[#d7ead6]" : "bg-[#f2f5f2]"
                }`}
              >
                <Icon size={21} strokeWidth={2.2} />
                {item.key === "chats" && chatUnreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                    {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                  </span>
                ) : null}
              </span>

              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function MasterDashboard({
  masterProfile,
  aboutMe,
  setAboutMe,
  experienceYears,
  setExperienceYears,
  workCity,
  setWorkCity,
  workDistrict,
  setWorkDistrict,
  handleSaveMasterProfile,
  successText,
  logout,
  avatarFile,
  setAvatarFile,
  handleUploadAvatar,
  isAvatarLoading,
  idCardFront,
  setIdCardFront,
  idCardBack,
  setIdCardBack,
  selfiePhoto,
  setSelfiePhoto,
  handleUploadDocuments,
  hasUploadedAllDocuments,
  isDocumentsLoading,
  availableOrders,
  isAvailableLoading,
  loadAvailableOrders,
  handleTakeOrder,
  setAvailableOrders,
  masterOrders,
  isMasterOrdersLoading,
  loadMasterOrders,
  handleMasterStatusChange,
  reportPhotos,
  setReportPhotos,
  reportTargetOrderId,
  setReportTargetOrderId,
  handleUploadOrderReport,
  isReportUploading,
  openedPhoto,
  setOpenedPhoto,
  activeSection,
  setActiveSection,
  scheduleItems,
  scheduleForm,
  setScheduleForm,
  isScheduleLoading,
  isScheduleSaving,
  handleAddScheduleItem,
  handleSaveMasterSchedule,
  removeScheduleItem,
}) {
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  useEffect(() => {
    if (!masterProfile?.id) {
      return;
    }

    let isMounted = true;

    const loadUnreadChats = async () => {
      try {
        const conversations = await loadChatConversations({
          viewerRole: "master",
          accountId: masterProfile.id,
        });

        if (!isMounted) {
          return;
        }

        setChatUnreadCount(
          conversations.reduce(
            (sum, item) => sum + Number(item.unread_count || 0),
            0,
          ),
        );
      } catch (error) {
        console.error("Ошибка загрузки непрочитанных чатов мастера:", error);

        if (isMounted) {
          setChatUnreadCount(0);
        }
      }
    };

    loadUnreadChats();
    const intervalId = window.setInterval(
      loadUnreadChats,
      MASTER_CHAT_POLL_INTERVAL_MS,
    );

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [masterProfile?.id]);

  return (
    <>
      <div className="space-y-6">
        <SectionTabs
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          chatUnreadCount={masterProfile?.id ? chatUnreadCount : 0}
        />

        {activeSection === "profile" && (
          <MasterProfileSection
            masterProfile={masterProfile}
            aboutMe={aboutMe}
            setAboutMe={setAboutMe}
            experienceYears={experienceYears}
            setExperienceYears={setExperienceYears}
            workCity={workCity}
            setWorkCity={setWorkCity}
            workDistrict={workDistrict}
            setWorkDistrict={setWorkDistrict}
            handleSaveMasterProfile={handleSaveMasterProfile}
            successText={successText}
            logout={logout}
            avatarFile={avatarFile}
            setAvatarFile={setAvatarFile}
            handleUploadAvatar={handleUploadAvatar}
            isAvatarLoading={isAvatarLoading}
            idCardFront={idCardFront}
            setIdCardFront={setIdCardFront}
            idCardBack={idCardBack}
            setIdCardBack={setIdCardBack}
            selfiePhoto={selfiePhoto}
            setSelfiePhoto={setSelfiePhoto}
            handleUploadDocuments={handleUploadDocuments}
            hasUploadedAllDocuments={hasUploadedAllDocuments}
            isDocumentsLoading={isDocumentsLoading}
          />
        )}

        {activeSection === "schedule" && (
          <MasterScheduleSection
            scheduleItems={scheduleItems}
            scheduleForm={scheduleForm}
            setScheduleForm={setScheduleForm}
            isScheduleLoading={isScheduleLoading}
            isScheduleSaving={isScheduleSaving}
            handleAddScheduleItem={handleAddScheduleItem}
            handleSaveMasterSchedule={handleSaveMasterSchedule}
            removeScheduleItem={removeScheduleItem}
            successText={successText}
          />
        )}

        {activeSection === "orders" && (
          <MasterOrdersTabsSection
            masterProfile={masterProfile}
            availableOrders={availableOrders}
            isAvailableLoading={isAvailableLoading}
            loadAvailableOrders={loadAvailableOrders}
            handleTakeOrder={handleTakeOrder}
            setAvailableOrders={setAvailableOrders}
            masterOrders={masterOrders}
            isMasterOrdersLoading={isMasterOrdersLoading}
            loadMasterOrders={loadMasterOrders}
            handleMasterStatusChange={handleMasterStatusChange}
            reportPhotos={reportPhotos}
            setReportPhotos={setReportPhotos}
            reportTargetOrderId={reportTargetOrderId}
            setReportTargetOrderId={setReportTargetOrderId}
            handleUploadOrderReport={handleUploadOrderReport}
            isReportUploading={isReportUploading}
            setOpenedPhoto={setOpenedPhoto}
          />
        )}

        {activeSection === "wallet" && (
          <MasterWalletSection masterProfile={masterProfile} />
        )}

        {activeSection === "chats" && (
          <ChatCenter viewerRole="master" accountId={masterProfile?.id} />
        )}
      </div>

      {openedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpenedPhoto(null)}
        >
          <img
            src={openedPhoto}
            alt="Открытое фото"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl"
          />
        </div>
      )}
    </>
  );
}
