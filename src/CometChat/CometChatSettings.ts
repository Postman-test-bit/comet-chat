export const CometChatSettings = {
  chatFeatures: {
    coreMessagingExperience: {
      typingIndicator: false,
      threadConversationAndReplies: true,
      photosSharing: false,
      videoSharing: false,
      audioSharing: false,
      fileSharing: false,
      editMessage: true,
      deleteMessage: true,
      messageDeliveryAndReadReceipts: true,
      userAndFriendsPresence: false,
      conversationAndAdvancedSearch: true,
    },
    deeperUserEngagement: {
      mentions: false,
      reactions: true,
      messageTranslation: false,
      polls: false,
      collaborativeWhiteboard: false,
      collaborativeDocument: false,
      voiceNotes: false,
      emojis: true,
      stickers: true,
      userInfo: true,
      groupInfo: false,
    },
    aiUserCopilot: {
      conversationStarter: false,
      conversationSummary: false,
      smartReply: false,
    },
    groupManagement: {
      createGroup: true,
      addMembersToGroups: true,
      joinLeaveGroup: true,
      deleteGroup: true,
      viewGroupMembers: true,
    },
    moderatorControls: {
      kickUsers: true,
      banUsers: true,
      promoteDemoteMembers: true,
    },
    privateMessagingWithinGroups: {
      sendPrivateMessageToGroupMembers: true,
    },
  },
  callFeatures: {
    voiceAndVideoCalling: {
      oneOnOneVoiceCalling: false,
      oneOnOneVideoCalling: false,
      groupVideoConference: false,
      groupVoiceConference: false,
    },
  },
  layout: {
    withSideBar: true,
    tabs: ["chats", "users"],
    chatType: "user",
  },
  style: {
    theme: "system",
    color: {
      brandColor: "#6852D6",
      primaryTextLight: "#141414",
      primaryTextDark: "#FFFFFF",
      secondaryTextLight: "#727272",
      secondaryTextDark: "#989898",
    },
    typography: {
      font: "roboto",
      size: "default",
    },
  },
  noCode: {
    docked: false,
    styles: {
      buttonBackGround: "#141414",
      buttonShape: "rounded",
      openIcon:
        "https://cdn.jsdelivr.net/npm/@cometchat/chat-embed@latest/dist/icons/docked_open_icon.svg",
      closeIcon:
        "https://cdn.jsdelivr.net/npm/@cometchat/chat-embed@latest/dist/icons/docked_close_icon.svg",
      customJs: "",
      customCss: "",
      dockedAlignment: "right",
    },
  },
  agent: {
    chatHistory: true,
    newChat: true,
    agentIcon: "",
    showAgentIcon: true,
  },
};
