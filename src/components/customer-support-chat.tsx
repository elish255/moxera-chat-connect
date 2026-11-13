import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  ImagePlus,
  MessageCircle,
  Mic,
  Send,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import type { MoxeraUser } from "@/lib/moxera";

type SupportMessage = {
  id: string;
  user_id: string;
  username: string;
  sender_id: string;
  sender_role: "user" | "admin";
  body: string;
  attachment_path: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  attachment_url?: string | null;
  created_at: string;
  read_at: string | null;
};

const BUCKET = "moxera-support";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
];

async function fetchMessages(userId: string) {
  if (!supabase) return [] as SupportMessage[];
  const { data, error } = await supabase
    .from("moxera_support_messages")
    .select(
      "id,user_id,username,sender_id,sender_role,body,attachment_path,attachment_type,attachment_name,created_at,read_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return Promise.all(
    (data ?? []).map(async (message) => {
      if (!message.attachment_path) return message as SupportMessage;
      const { data: signed } = await supabase!.storage
        .from(BUCKET)
        .createSignedUrl(message.attachment_path, 3600);
      return {
        ...message,
        attachment_url: signed?.signedUrl ?? null,
      } as SupportMessage;
    }),
  );
}

function useIncomingMessages(userId: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["support-messages", userId], [userId]);
  const query = useQuery({
    queryKey,
    queryFn: () => fetchMessages(userId!),
    enabled: Boolean(userId && enabled),
  });

  useEffect(() => {
    if (!supabase || !userId) return;
    const channel = supabase
      .channel(`support-user-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "moxera_support_messages",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
          void queryClient.invalidateQueries({
            queryKey: ["support-unread", userId],
          });
        },
      )
      .subscribe();
    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [queryClient, queryKey, userId]);

  return query;
}

function useMessageComposer(
  userId: string,
  username: string,
  role: "user" | "admin",
  onSent?: () => void,
) {
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);

  useEffect(
    () => () => {
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    if (!ACCEPTED_FILE_TYPES.includes(selected.type)) {
      toast.error("Chagua picha au faili la sauti linalokubalika.");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      toast.error("Faili lisizidi MB 10.");
      return;
    }
    setFile(selected);
  }

  async function toggleRecording() {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      stream.current?.getTracks().forEach((track) => track.stop());
      return;
    }
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      toast.error(
        "Kifaa hiki hakiwezi kurekodi sauti. Tumia kitufe cha kuambatisha faili.",
      );
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/webm",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const mediaRecorder = new MediaRecorder(
        media,
        mimeType ? { mimeType } : undefined,
      );
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const recordedType =
          mediaRecorder.mimeType.split(";")[0] || "audio/webm";
        const blob = new Blob(chunks, { type: recordedType });
        const extension = recordedType.includes("mp4") ? "m4a" : "webm";
        const recorded = new File([blob], `voice-message.${extension}`, {
          type: blob.type,
        });
        if (recorded.size <= MAX_FILE_BYTES) setFile(recorded);
        else toast.error("Sauti imezidi MB 10. Rekodi ujumbe mfupi zaidi.");
        media.getTracks().forEach((track) => track.stop());
      };
      recorder.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
    } catch {
      toast.error("Ruhusu matumizi ya microphone ili kurekodi sauti.");
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || sending || (!body.trim() && !file)) return;
    setSending(true);
    let uploadedPath: string | null = null;
    try {
      if (file) {
        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, "") || "bin";
        uploadedPath = `${userId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(uploadedPath, file, {
            contentType: file.type,
            upsert: false,
          });
        if (uploadError) throw uploadError;
      }
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData.user)
        throw new Error("Ingia tena kabla ya kutuma ujumbe.");
      const { error } = await supabase.from("moxera_support_messages").insert({
        user_id: userId,
        username,
        sender_id: authData.user.id,
        sender_role: role,
        body: body.trim(),
        attachment_path: uploadedPath,
        attachment_type: file?.type ?? null,
        attachment_name: file?.name ?? null,
      });
      if (error) throw error;
      setBody("");
      setFile(null);
      onSent?.();
    } catch (error) {
      if (uploadedPath)
        await supabase.storage.from(BUCKET).remove([uploadedPath]);
      toast.error(
        error instanceof Error
          ? error.message
          : "Ujumbe haukutumwa. Jaribu tena.",
      );
    } finally {
      setSending(false);
    }
  }

  return {
    body,
    setBody,
    file,
    setFile,
    sending,
    recording,
    chooseFile,
    toggleRecording,
    send,
  };
}

function Composer({
  composer,
  disabled = false,
}: {
  composer: ReturnType<typeof useMessageComposer>;
  disabled?: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <form
      onSubmit={composer.send}
      className="flex flex-col gap-2 border-t border-border pt-3"
    >
      {composer.file && (
        <div
          className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-xs"
          role="status"
        >
          <span className="truncate">{composer.file.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Ondoa faili"
            onClick={() => composer.setFile(null)}
          >
            <X />
          </Button>
        </div>
      )}
      <Textarea
        aria-label="Andika ujumbe"
        placeholder="Andika ujumbe…"
        value={composer.body}
        onChange={(event) => composer.setBody(event.target.value)}
        rows={2}
        className="max-h-28 min-h-14 resize-none"
        disabled={disabled || composer.sending}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <input
            ref={fileInput}
            type="file"
            accept="image/*,audio/*"
            className="sr-only"
            onChange={composer.chooseFile}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Ambatisha picha au sauti"
            onClick={() => fileInput.current?.click()}
            disabled={disabled || composer.sending}
          >
            <ImagePlus />
          </Button>
          <Button
            type="button"
            variant={composer.recording ? "destructive" : "ghost"}
            size="icon"
            aria-label={
              composer.recording ? "Simamisha kurekodi" : "Rekodi sauti"
            }
            onClick={() => void composer.toggleRecording()}
            disabled={disabled || composer.sending}
          >
            <Mic />
          </Button>
          <span className="text-xs text-muted-foreground">
            Picha/sauti hadi MB 10
          </span>
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={
            disabled ||
            composer.sending ||
            (!composer.body.trim() && !composer.file)
          }
        >
          <Send data-icon="inline-start" />
          {composer.sending ? "Inatuma…" : "Tuma"}
        </Button>
      </div>
    </form>
  );
}

function MessageList({
  messages,
  currentUserId,
  currentLabel = "Wewe",
}: {
  messages: SupportMessage[];
  currentUserId: string;
  currentLabel?: string;
}) {
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);
  if (!messages.length)
    return (
      <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
        Ujumbe wako utaonekana hapa. Tuandikie tukusaidie.
      </div>
    );
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-2"
      aria-live="polite"
      aria-label="Ujumbe wa mazungumzo"
    >
      {messages.map((message) => {
        const mine = message.sender_id === currentUserId;
        const senderLabel = mine
          ? currentLabel
          : message.sender_role === "admin"
            ? "Customer Service"
            : message.username;
        return (
          <article
            key={message.id}
            className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}
          >
            <span className={`text-xs font-semibold text-muted-foreground ${mine ? "text-right" : "text-left"}`}>
              {senderLabel}
            </span>
            <div
              className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border border-border bg-muted text-foreground"}`}
            >
              {message.body && (
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {message.body}
                </p>
              )}
              {message.attachment_url &&
                message.attachment_type?.startsWith("image/") && (
                  <a
                    href={message.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      className="mt-2 max-h-52 max-w-full rounded-lg object-contain"
                      src={message.attachment_url}
                      alt={message.attachment_name || "Picha iliyoambatishwa"}
                    />
                  </a>
                )}
              {message.attachment_url &&
                message.attachment_type?.startsWith("audio/") && (
                  <audio
                    className="mt-2 max-w-full"
                    controls
                    preload="none"
                    src={message.attachment_url}
                  >
                    Kifaa chako hakiwezi kucheza sauti hii.
                  </audio>
                )}
            </div>
            <time
              className="text-[10px] text-muted-foreground"
              dateTime={message.created_at}
            >
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </article>
        );
      })}
      <div ref={bottom} />
    </div>
  );
}

export function CustomerSupportChat({
  user,
  floating = false,
}: {
  user: MoxeraUser;
  floating?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const userId = user.id ?? "";
  const username = user.username ?? "Mteja";
  const unread = useQuery({
    queryKey: ["support-unread", userId],
    enabled: Boolean(supabase && userId),
    queryFn: async () => {
      const { count, error } = await supabase!
        .from("moxera_support_messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("sender_role", "admin")
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });
  const messages = useIncomingMessages(userId, open);
  const composer = useMessageComposer(userId, username, "user", () => {
    void queryClient.invalidateQueries({
      queryKey: ["support-messages", userId],
    });
  });

  useEffect(() => {
    if (!supabase || !open) return;
    const pending =
      messages.data?.filter(
        (message) => message.sender_role === "admin" && !message.read_at,
      ) ?? [];
    if (!pending.length) return;
    void supabase
      .from("moxera_support_messages")
      .update({ read_at: new Date().toISOString() })
      .in(
        "id",
        pending.map((message) => message.id),
      );
    void queryClient.invalidateQueries({
      queryKey: ["support-unread", userId],
    });
  }, [messages.data, open, queryClient, userId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={floating ? "icon" : "sm"}
          variant="outline"
          className={
            floating
              ? "customer-service-blink fixed bottom-5 right-4 z-50 flex size-18 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-card p-0 shadow-2xl ring-2 ring-primary/40 transition-transform hover:scale-105 focus-visible:ring-4 sm:right-6 sm:size-20"
              : "relative"
          }
          aria-label={`Fungua Customer Services${unread.data ? `, ${unread.data} ujumbe mpya` : ""}`}
          aria-haspopup="dialog"
        >
          {floating ? (
            <>
              <img
                src="/customer-care.png"
                alt=""
                aria-hidden="true"
                className="size-full object-cover"
              />
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
              >
                {unread.data ? (
                  <span className="text-[10px] font-bold">{unread.data}</span>
                ) : (
                  <MessageCircle />
                )}
              </span>
            </>
          ) : (
            <>
              <MessageCircle data-icon="inline-start" />
              Customer Services
              {Boolean(unread.data) && (
                <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-5 text-destructive-foreground">
                  {unread.data}
                </span>
              )}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[min(80dvh,640px)] max-w-lg flex-col gap-3 p-4 sm:p-5">
        <DialogHeader>
          <DialogTitle>Customer Service</DialogTitle>
          <DialogDescription>
            Tuma ujumbe, picha au sauti. Timu yetu itakujibu hapa.
          </DialogDescription>
        </DialogHeader>
        <MessageList messages={messages.data ?? []} currentUserId={userId} />
        <Composer composer={composer} />
      </DialogContent>
    </Dialog>
  );
}

export function CustomerSupportInbox({ adminId }: { adminId: string }) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const messagesQuery = useQuery({
    queryKey: ["support-admin-messages"],
    enabled: Boolean(supabase && adminId),
    queryFn: async () => {
      const { data, error } = await supabase!
        .from("moxera_support_messages")
        .select(
          "id,user_id,username,sender_id,sender_role,body,attachment_path,attachment_type,attachment_name,created_at,read_at",
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const messages = await Promise.all(
        (data ?? []).map(async (message) => {
          if (!message.attachment_path) return message as SupportMessage;
          const { data: signed } = await supabase!.storage
            .from(BUCKET)
            .createSignedUrl(message.attachment_path, 3600);
          return {
            ...message,
            attachment_url: signed?.signedUrl ?? null,
          } as SupportMessage;
        }),
      );
      const userIds = [...new Set(messages.map((message) => message.user_id))];
      if (!userIds.length) return messages.reverse();
      const { data: users, error: usersError } = await supabase!
        .from("moxera_users")
        .select("id,username")
        .in("id", userIds);
      if (usersError) throw usersError;
      const usernames = new Map(
        (users ?? []).map((user) => [user.id, user.username]),
      );
      return messages
        .map((message) => ({
          ...message,
          username: usernames.get(message.user_id) ?? message.username,
        }))
        .reverse();
    },
  });
  const allMessages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data]);
  const conversations = useMemo(() => {
    const latestByUser = new Map<string, SupportMessage>();
    for (const message of allMessages)
      latestByUser.set(message.user_id, message);
    return [...latestByUser.entries()]
      .map(([userId, latest]) => ({
        userId,
        username: latest.username,
        latest,
        unread: allMessages.filter(
          (message) =>
            message.user_id === userId &&
            message.sender_role === "user" &&
            !message.read_at,
        ).length,
      }))
      .sort((a, b) => b.latest.created_at.localeCompare(a.latest.created_at));
  }, [allMessages]);
  const selected =
    conversations.find(
      (conversation) => conversation.userId === selectedUserId,
    ) ?? null;
  const activeMessages = useMemo(
    () => allMessages.filter((message) => message.user_id === selectedUserId),
    [allMessages, selectedUserId],
  );
  const composer = useMessageComposer(
    selected?.userId ?? "",
    selected?.username ?? "Customer",
    "admin",
    () => {
      void queryClient.invalidateQueries({
        queryKey: ["support-admin-messages"],
      });
    },
  );

  useEffect(() => {
    if (!supabase || !adminId) return;
    const channel = supabase
      .channel("support-admin-inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "moxera_support_messages" },
        (payload) => {
          const inserted = payload.new as SupportMessage;
          void queryClient.invalidateQueries({
            queryKey: ["support-admin-messages"],
          });
          if (inserted.sender_role === "user") {
            toast.info("Ujumbe mpya kutoka kwa mteja");
            if (audioContext.current && soundOn) {
              const context = audioContext.current;
              const oscillator = context.createOscillator();
              const gain = context.createGain();
              oscillator.type = "sine";
              oscillator.frequency.setValueAtTime(880, context.currentTime);
              oscillator.frequency.setValueAtTime(
                660,
                context.currentTime + 0.12,
              );
              gain.gain.setValueAtTime(0.08, context.currentTime);
              gain.gain.exponentialRampToValueAtTime(
                0.001,
                context.currentTime + 0.3,
              );
              oscillator.connect(gain).connect(context.destination);
              oscillator.start();
              oscillator.stop(context.currentTime + 0.3);
            }
            if (
              soundOn &&
              typeof Notification !== "undefined" &&
              Notification.permission === "granted" &&
              document.hidden
            ) {
              new Notification(`Ujumbe mpya kutoka @${inserted.username}`, {
                body: inserted.body || "Ametuma kiambatisho cha sauti/picha.",
              });
            }
          }
        },
      )
      .subscribe();
    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [adminId, queryClient, soundOn]);

  useEffect(() => {
    if (!supabase || !selectedUserId) return;
    const unreadIds = activeMessages
      .filter((message) => message.sender_role === "user" && !message.read_at)
      .map((message) => message.id);
    if (!unreadIds.length) return;
    void supabase
      .from("moxera_support_messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
    void queryClient.invalidateQueries({
      queryKey: ["support-admin-messages"],
    });
  }, [activeMessages, queryClient, selectedUserId]);

  async function enableNotifications() {
    try {
      if (typeof window !== "undefined" && "AudioContext" in window) {
        audioContext.current = audioContext.current ?? new AudioContext();
        await audioContext.current.resume();
      }
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "default"
      )
        await Notification.requestPermission();
      setSoundOn(true);
      toast.success("Sauti ya ujumbe mpya imewashwa.");
    } catch {
      toast.error("Imeshindikana kuwasha sauti ya arifa.");
    }
  }

  return (
    <section className="mt-4 rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">Customer Service Inbox</h2>
          <p className="text-sm text-muted-foreground">
            Jibu ujumbe wa wateja moja kwa moja.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            soundOn ? setSoundOn(false) : void enableNotifications()
          }
        >
          {soundOn ? (
            <Volume2 data-icon="inline-start" />
          ) : (
            <VolumeX data-icon="inline-start" />
          )}
          {soundOn ? "Sauti imewashwa" : "Washa arifa za sauti"}
        </Button>
      </div>
      <div className="mt-4 grid min-h-[440px] overflow-hidden rounded-xl border md:grid-cols-[220px_minmax(0,1fr)]">
        <aside
          className="max-h-48 overflow-y-auto border-b bg-muted/30 md:max-h-[560px] md:border-b-0 md:border-r"
          aria-label="Mazungumzo ya wateja"
        >
          {conversations.length ? (
            conversations.map((conversation) => (
              <button
                key={conversation.userId}
                type="button"
                onClick={() => setSelectedUserId(conversation.userId)}
                className={`flex w-full flex-col gap-1 border-b px-3 py-3 text-left transition-colors hover:bg-muted ${selectedUserId === conversation.userId ? "bg-muted" : "bg-card"}`}
              >
                <span className="flex w-full items-center justify-between gap-2 text-sm font-semibold">
                  <span className="truncate">@{conversation.username}</span>
                  {conversation.unread > 0 && (
                    <span className="rounded-full bg-destructive px-2 text-xs text-destructive-foreground">
                      {conversation.unread}
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-xs text-muted-foreground">
                  {conversation.latest.body ||
                    (conversation.latest.attachment_type?.startsWith("audio/")
                      ? "Ujumbe wa sauti"
                      : "Picha")}
                </span>
                <time
                  className="text-[10px] text-muted-foreground"
                  dateTime={conversation.latest.created_at}
                >
                  {new Date(conversation.latest.created_at).toLocaleString()}
                </time>
              </button>
            ))
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              Bado hakuna ujumbe wa wateja.
            </p>
          )}
        </aside>
        <div className="flex min-h-[380px] min-w-0 flex-col gap-3 p-3 md:min-h-[560px] md:p-4">
          {messagesQuery.isError && (
            <p role="alert" className="text-sm text-destructive">
              Imeshindikana kupakia ujumbe. {messagesQuery.error.message}
            </p>
          )}
          {selected ? (
            <>
              <div className="flex items-center gap-2 border-b pb-3">
                <Bell className="size-4 text-primary" />
                <div>
                  <p className="text-sm font-bold">@{selected.username}</p>
                  <p className="text-xs text-muted-foreground">
                    Mazungumzo ya mteja
                  </p>
                </div>
              </div>
              <MessageList messages={activeMessages} currentUserId={adminId} currentLabel="Customer Service" />
              <Composer composer={composer} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
              Chagua mazungumzo ili ujibu mteja.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
