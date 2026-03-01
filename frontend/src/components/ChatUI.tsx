import { motion } from "framer-motion";

type ChatUIProps = {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function ChatUI({ role, text, timestamp }: ChatUIProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, x: role === "user" ? 8 : -8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`inline-block max-w-[92%] min-w-0 rounded-xl border px-3 py-2.5 text-sm shadow-card ${
        role === "user"
          ? "border-primary/20 bg-primary text-white"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      <p className="whitespace-pre-wrap break-words leading-relaxed">{text}</p>
      <p className={`mt-1 text-[10px] ${role === "user" ? "text-white/70" : "text-muted"}`}>
        {formatTime(timestamp)}
      </p>
    </motion.div>
  );
}
