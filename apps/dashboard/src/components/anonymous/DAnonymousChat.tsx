import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import {
  GetGroupMessagesApi,
  SendGroupMessageApi,
  JoinGroupApi,
  GetGroupsApi,
} from "../../api/Groups.api";
import { QUERY_KEYS } from "../../configs/queryKeys.config";
import { formatMessageTime, groupMessagesByDate } from "../../utils/Date.utils";
import { useAuthStore } from "../../store/auth/useAuthStore";

const DateSeparator = ({ date }: { date: string }) => (
  <div className="flex justify-center items-center mb-4">
    <div className="bg-white rounded-full shadow-[inset_0px_0px_30px_0px_#FFFFFF33] backdrop-blur-[25px] px-4 py-1">
      <p className="text-gray-500 text-xs">{date}</p>
    </div>
  </div>
);

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

type MessageFormData = z.infer<typeof messageSchema>;

export default function DAnonymousChat() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore();

  const [joined, setJoined] = useState(false);

  const joinAbortRef = useRef<AbortController | null>(null);
  const { mutateAsync: joinGroup, isPending: isJoining } = useMutation({
    mutationFn: (data: { groupId: string }) => {
      const controller = new AbortController();
      joinAbortRef.current = controller;
      return JoinGroupApi(data.groupId, { signal: controller.signal });
    },
    onSuccess: () => setJoined(true),
    onError: (error) => {
      toast.error(error?.message || "Failed to join group");
      navigate("/anonymous");
    },
  });

  useEffect(() => {
    if (groupId) {
      joinGroup({ groupId });
    }
    return () => joinAbortRef.current?.abort();
  }, [groupId, joinGroup]);

  const { data: groupsData } = useQuery({
    queryKey: [QUERY_KEYS.groups.list],
    queryFn: () => GetGroupsApi(),
  });

  const group = useMemo(() => {
    const list = groupsData?.data || [];
    return list.find((g) => g._id === groupId || g._id === groupId);
  }, [groupsData, groupId]);

  const {
    data: messagesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: QUERY_KEYS.groups.messages(groupId!),
    queryFn: () => GetGroupMessagesApi({ groupId: groupId! }),
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled: !!groupId && joined,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    mode: "onChange",
  });

  const contentValue = watch("content");

  const mutation = useMutation({
    mutationFn: (content: string) => {
      const controller = new AbortController();
      const promise = SendGroupMessageApi(
        {
          groupId: groupId!,
          content,
        },
        { signal: controller.signal }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (promise as any).abort = () => controller.abort();
      return promise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.groups.messages(groupId!),
      });
      reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const messageGroups = useMemo(
    () => groupMessagesByDate(messagesData?.data || []),
    [messagesData]
  );

  const onSubmit = (data: MessageFormData) => {
    mutation.mutate(data.content);
  };

  if (!groupId) {
    navigate("/anonymous");
    return null;
  }

  if (isJoining || !joined) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Joining group...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading messages...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Error loading messages. Please try again later.</p>
      </div>
    );
  }

  if (!group) {
    navigate("/anonymous");
    return null;
  }

  return (
    <>
      <div className="border-b border-gray-200 relative">
        <img
          src={group?.image}
          className="object-cover h-full w-full object-center absolute top-0 bottom-0 left-0 right-0"
        />

        <div className="flex items-center bg-black/75 relative flex-1 p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-white hover:text-gray-700 md:hidden -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white flex-shrink-0 mr-2">
            <img
              src={group?.image}
              className="h-full w-full object-fit-cover rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white text-lg">{group.name}</h2>
            <p className="text-xs text-[#C2C2C2] mb-1 font-medium">
              {group.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-offwhite">
        {messageGroups.map((group) => (
          <div key={`group-${group.date}`}>
            <DateSeparator date={group.date} />
            <div className="space-y-4">
              {group.messages.map((msg, index) => (
                <div
                  key={msg.createdAt + index}
                  className={`flex ${
                    msg.userId === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs sm:max-w-sm lg:max-w-md px-4 py-3 rounded-2xl ${
                      msg.userId === user.id
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-white text-gray-800 rounded-bl-md shadow-sm"
                    }`}
                  >
                    {/* {!(msg.userId === user.id) && (
                      <div
                        className={`text-xs font-medium mb-1 ${
                          msg.role === "user"
                            ? "text-success-700"
                            : "text-primary"
                        }`}
                      >
                        {msg.name}
                      </div>
                    )} */}
                    <p className="text-sm leading-relaxed break-words ">
                      {msg.content}
                    </p>
                    <div
                      className={`text-xs mt-2 ${
                        msg.userId === user.id
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      {formatMessageTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#F7FAFF] p-4 border-t border-gray-200">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-center space-x-3"
        >
          <Input
            multiline
            maxRows={3}
            fullWidth
            disableUnderline
            {...register("content")}
            placeholder="Type a message"
            className="flex-1 px-4 py-3 bg-transparent border-0 focus:outline-none text-base lg:text-sm"
            error={!!errors.content}
          />
          <button
            type="submit"
            disabled={isSubmitting || !contentValue?.trim()}
            className="w-5 h-5 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-full h-full text-black rotate-45" />
          </button>
        </form>
      </div>
    </>
  );
}
