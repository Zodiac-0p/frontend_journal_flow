import { useEffect, useState } from "react";
import { 
  CheckCheck, Bell, MessageSquare, CheckCircle2, 
  ShieldCheck, UserCheck, XCircle, Info, RefreshCw, 
  FilePlus, ClipboardList
} from "lucide-react";
import toast from "react-hot-toast";
import AppLayout from "../layout/layout";
import notificationService from "../services/notificationService";
import api from "../services/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      const rawItems = Array.isArray(response) ? response : (response?.results || response?.data || []);
      
      const mapped = rawItems.map((item) => {
        const rawType = (item.notification_type || "").toLowerCase();
        const rawTitle = (item.title || "").toLowerCase();
        
        // ----------------------------------------------------
        // INTELLIGENT CLASSIFICATION LOGIC
        // ----------------------------------------------------
        let type = "other"; 
        
        if (rawType.includes("resubmission") || rawTitle.includes("resubmit") || rawTitle.includes("revised")) {
          type = "resubmission";
        } 
        else if (rawType.includes("new submission") || rawTitle.includes("new submission") || rawType === "submission") {
          type = "new_submission";
        } 
        else if (rawType.includes("report") || rawTitle.includes("report")) {
          type = "report";
        } 
        else if (rawType.includes("accepted") || rawTitle.includes("accepted")) {
          type = "accepted";
        } 
        else if (rawType.includes("rejected") || rawTitle.includes("rejected")) {
          type = "rejected";
        } 
        else if (rawType.includes("assignment") || rawTitle.includes("assigned")) {
          type = "assignment";
        } 
        else if (rawType.includes("review") || rawTitle.includes("review")) {
          type = "review";
        }

        // ----------------------------------------------------
        // TIME FORMATTING (Includes Date + AM/PM Time)
        // ----------------------------------------------------
        let formattedTime = "Just now";
        if (item.created_at) {
          formattedTime = new Date(item.created_at).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });
        }

        return {
          id: item.id,
          type: type,
          title: item.title || "Notification Update",
          message: item.message || "",
          time: formattedTime, // <--- Now uses the new Date + Time format
          read: item.is_read ?? false,
          isAssignment: rawType.includes("assignment") || rawType === "reviewer_assignment",
          assignment_id: item.related_object_id, 
        };
      });
      setNotifications(mapped);
    } catch (err) {
      console.error("Could not fetch notifications:", err);
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  }, []);

  const handleAction = async (assignmentId, action) => {
    try {
      await api.post(`/journals/reviewer-assignments/${assignmentId}/${action}/`);
      toast.success(`Assignment ${action}ed successfully`);
      fetchNotifications();
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
      toast.error(`Could not ${action} assignment`);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error("Failed to mark read:", err);
      toast.error("Failed to mark as read");
    }
  };

  // ----------------------------------------------------
  // DYNAMIC STYLES & ICONS MAP
  // ----------------------------------------------------
  const getTypeStyles = (type) => {
    switch (type) {
      case "new_submission": return { icon: FilePlus, color: "text-[#00A8CC]", bg: "bg-[#E5F7FB]" };
      case "resubmission": return { icon: RefreshCw, color: "text-orange-500", bg: "bg-orange-50" };
      case "report": return { icon: ClipboardList, color: "text-purple-600", bg: "bg-purple-50" };
      case "review": return { icon: MessageSquare, color: "text-indigo-500", bg: "bg-indigo-50" };
      case "accepted": return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" };
      case "rejected": return { icon: XCircle, color: "text-red-500", bg: "bg-red-50" };
      case "assignment": return { icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50" };
      case "security": return { icon: ShieldCheck, color: "text-slate-600", bg: "bg-slate-100" };
      case "other":
      default: return { icon: Bell, color: "text-slate-500", bg: "bg-slate-100" };
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <button onClick={fetchNotifications} className="text-xs font-bold text-[#0077B6] hover:underline">
            Refresh
          </button>
        </div>
        
        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="text-center py-16 text-slate-400 font-sans">Loading your updates...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Info className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-slate-500 font-sans">No new notifications.</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const styles = getTypeStyles(notification.type);
              const Icon = styles.icon;

              return (
                <div 
                  key={notification.id} 
                  className={`p-5 flex items-start gap-4 rounded-2xl border transition relative ${
                    notification.read 
                      ? "bg-white border-slate-200 opacity-75 hover:opacity-100" 
                      : "bg-[#F4F9FF] border-[#B8D8F8] shadow-sm"
                  }`}
                >
                  {/* Unread dot indicator */}
                  {!notification.read && (
                    <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-[var(--primary)] border-4 border-white rounded-full"></div>
                  )}

                  <div className={`p-2 rounded-full ${styles.bg} shrink-0 mt-1`}>
                    <Icon className={styles.color} size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <h3 className={`text-[15px] font-sans ${notification.read ? "font-semibold text-[var(--navy-mid)]" : "font-bold text-[var(--navy)]"}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-[var(--primary)] text-white">
                            New
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase font-sans shrink-0">{notification.time}</span>
                    </div>
                    
                    <p className={`text-sm mt-1.5 leading-relaxed font-sans ${notification.read ? "text-slate-500" : "text-slate-700 font-medium"}`}>
                      {notification.message}
                    </p>
                    
                    <div className="mt-4 flex flex-wrap gap-3 items-center">
                      {!notification.read && (
                        <button 
                          onClick={() => handleMarkAsRead(notification.id)} 
                          className="text-[12px] text-slate-500 font-bold flex items-center gap-1.5 hover:text-[var(--blue)] transition-colors px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[var(--blue)] hover:bg-blue-50"
                        >
                          <CheckCheck size={14} /> Mark as read
                        </button>
                      )}
                      
                      {notification.isAssignment && !notification.read && (
                        <>
                          <button onClick={() => handleAction(notification.assignment_id, 'accept')} className="text-[12px] bg-[#1A7A38] text-white px-4 py-1.5 rounded-lg font-bold hover:bg-[#135d29] transition-colors shadow-sm">Accept</button>
                          <button onClick={() => handleAction(notification.assignment_id, 'reject')} className="text-[12px] bg-white text-[#B52626] px-4 py-1.5 rounded-lg font-bold hover:bg-red-50 border border-red-200 transition-colors">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}