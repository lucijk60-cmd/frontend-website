import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createOperatorCallClient, type CallState } from "../lib/calling";

const labels = {
  en: { title: "PPFStudio Operator", subtitle: "Secure incoming voice calls", callId: "Call ID", connect: "Connect to call", disconnect: "Disconnect", idle: "Waiting for a call", connecting: "Connecting…", ringing: "Incoming call", connected: "Voice channel connected", ended: "Call ended", error: "Connection error", language: "العربية" },
  ar: { title: "مشغل PPFStudio", subtitle: "مكالمات صوتية واردة آمنة", callId: "معرّف المكالمة", connect: "الاتصال بالمكالمة", disconnect: "قطع الاتصال", idle: "بانتظار مكالمة", connecting: "جارٍ الاتصال…", ringing: "مكالمة واردة", connected: "تم اتصال الصوت", ended: "انتهت المكالمة", error: "خطأ في الاتصال", language: "English" },
} as const;

export default function OperatorHome() {
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [callId, setCallId] = useState("");
  const [status, setStatus] = useState<CallState>("offline");
  const [client, setClient] = useState<ReturnType<typeof createOperatorCallClient> | null>(null);
  const c = labels[language];
  const statusLabel = useMemo(() => c[status === "offline" ? "idle" : status], [c, status]);

  const connect = () => {
    if (!callId.trim()) return;
    const next = createOperatorCallClient({
      baseUrl: process.env.EXPO_PUBLIC_PPFSTUDIO_API_URL ?? "https://frontendweb-ewq8pgsm.manus.space",
      callId: callId.trim(),
      operatorToken: process.env.EXPO_PUBLIC_PPF_OPERATOR_TOKEN ?? "",
      onState: setStatus,
    });
    setClient(next);
    next.connect();
  };

  const disconnect = () => {
    client?.disconnect();
    setClient(null);
    setStatus("offline");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#080909", padding: 24 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={{ color: "#e0c995", fontSize: 11, letterSpacing: 2 }}>PPF / OPERATOR</Text>
          <Text style={{ color: "#f4f2ed", fontSize: 28, fontWeight: "700", marginTop: 8 }}>{c.title}</Text>
        </View>
        <Pressable onPress={() => setLanguage(value => value === "en" ? "ar" : "en")} style={{ borderColor: "#c8a56b", borderWidth: 1, padding: 10 }}>
          <Text style={{ color: "#e0c995" }}>{c.language}</Text>
        </Pressable>
      </View>
      <Text style={{ color: "#a8aaa8", marginTop: 10, fontSize: 15 }}>{c.subtitle}</Text>
      <View style={{ backgroundColor: "#151718", borderColor: "#3b3428", borderWidth: 1, padding: 20, marginTop: 42 }}>
        <Text style={{ color: "#a8aaa8", fontSize: 12, marginBottom: 8 }}>{c.callId}</Text>
        <TextInput value={callId} onChangeText={setCallId} editable={!client} placeholder="call-…" placeholderTextColor="#6f706c" autoCapitalize="none" style={{ borderColor: "#4a4439", borderWidth: 1, color: "#f4f2ed", padding: 14 }} />
        <Text style={{ color: status === "error" ? "#ef8c8c" : "#c8a56b", marginTop: 22, fontSize: 16 }}>{statusLabel}</Text>
        <Pressable onPress={client ? disconnect : connect} style={{ backgroundColor: "#c8a56b", padding: 16, marginTop: 22, alignItems: "center" }}>
          <Text style={{ color: "#080909", fontWeight: "700" }}>{client ? c.disconnect : c.connect}</Text>
        </Pressable>
      </View>
      <Text style={{ color: "#6f706c", fontSize: 12, lineHeight: 18, marginTop: 22, textAlign: language === "ar" ? "right" : "left" }}>
        {language === "ar" ? "تحتاج المكالمات الصوتية الفعلية إلى صلاحية الميكروفون وإعداد TURN إنتاجي عند الحاجة." : "Real voice requires microphone permission and production TURN configuration when peer-to-peer connectivity is unavailable."}
      </Text>
    </SafeAreaView>
  );
}
