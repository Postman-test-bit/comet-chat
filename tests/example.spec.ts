import {
  test,
  expect,
  Browser,
  BrowserContext,
  Page,
  Locator,
} from "@playwright/test";

// Type Definitions
interface User {
  username: string;
  uid: string;
}

interface TestConfig {
  baseURL: string;
  timeout: number;
  users: {
    user1: User;
    user2: User;
    user3: User;
  };
}

interface MessageData {
  sender: CometChatHelper;
  text: string;
}

// Test configuration
const config: TestConfig = {
  baseURL: process.env.CHAT_APP_URL || "https://pre-comet-chat.netlify.app/",
  timeout: 30000,
  users: {
    user1: { username: "Personal", uid: "4711" },
    user2: { username: "user 2", uid: "4665" },
    user3: { username: "user 3", uid: "2997" },
  },
};

// Helper Class
class CometChatHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login(uid: string): Promise<void> {
    await this.page.goto(config.baseURL);
    await this.page.fill('[placeholder="Enter your UID"]', uid);
    await this.page.click('[class = "cometchat-login__submit-button"]');
    await this.page.waitForSelector('[class="cometchat-tab-component"]', {
      timeout: 10000,
    });
  }

  async sendMessage(message: string): Promise<void> {
    await this.page.fill(
      '[data-placeholder="Enter your message here"]',
      message
    );
    await this.page.locator('button[title="Send Message"]').click();
  }

  async sendThreadMessage(message: string): Promise<void> {
    await this.page.fill(
      'div.cometchat-threaded-message [data-placeholder="Enter your message here"]',
      message
    );
    await this.page
      .locator('div.cometchat-threaded-message button[title="Send Message"]')
      .click();
  }

  async selectConversation(
    senderUid: string,
    receiverUid: string
  ): Promise<void> {
    if (parseInt(senderUid) > parseInt(receiverUid)) {
      await this.page.click(`[id="${receiverUid}_user_${senderUid}"]`);
    } else {
      await this.page.click(`[id="${senderUid}_user_${receiverUid}"]`);
    }
  }

  async chooseConversation(
    senderUid: string,
    receiverUid: string
  ): Promise<Locator> {
    let ele;
    if (parseInt(senderUid) > parseInt(receiverUid)) {
      ele = await this.page.locator(`[id="${receiverUid}_user_${senderUid}"]`);
    } else {
      ele = await this.page.locator(`[id="${senderUid}_user_${receiverUid}"]`);
    }
    return ele;
  }

  async waitForMessage(
    messageText: string,
    timeout: number = 10000
  ): Promise<Locator> {
    const ele = await this.page
      .locator("p.cometchat-text-bubble__body-text")
      .filter({ hasText: messageText })
      .last();
    await ele.waitFor({ state: "visible", timeout });
    return ele;
  }

  async getLastMessage(): Promise<string | null> {
    const messages = await this.page.$$('[data-testid="message-bubble"]');
    if (messages.length === 0) return null;
    const lastMessage = messages[messages.length - 1];
    const textContent = await lastMessage.textContent();
    return textContent;
  }

  async getAllMessages(): Promise<string[]> {
    return await this.page.$$eval(
      'p[class="cometchat-text-bubble__body-text "]',
      (elements: Element[]) =>
        elements.map((el) => (el.textContent || "").trim())
    );
  }

  async logout(): Promise<void> {
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForSelector('[data-testid="login-button"]', {
      timeout: 8000,
    });
  }

  async openEmojiPicker(): Promise<void> {
    await this.page.waitForTimeout(1000);
    await this.page
      .locator(
        '(//div[@class="cometchat-message-bubble__options"]//div[@id="react"])[last()]'
      )
      .last()
      .click();
  }

  async selectEmoji(emoji: string): Promise<void> {
    await this.page.waitForTimeout(1000);
    await this.page
      .locator(
        `//div[@class="cometchat-emoji-keyboard"]//div[text()='${emoji}']`
      )
      .last()
      .click();
  }

  async verifyEmoji(emoji: string): Promise<void> {
    await this.page.waitForTimeout(1000);
    await expect(
      this.page
        .locator(
          `button.cometchat-reactions__reaction span.cometchat-reactions__reaction-emoji`
        )
        .last()
    ).toHaveText(emoji, { timeout: 10000 });
  }

  async uploadFile(filePath: string): Promise<void> {
    const fileInput = this.page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles(filePath);
  }

  async startNewConversation(users: { uid: string; username: string }) {
    await this.page.waitForTimeout(1000);
    await this.page.click(
      "div.chat-menu div.cometchat-menu-list__sub-menu-icon"
    );
    await this.page.waitForTimeout(2000);
    // await expect(this.page.locator("[id='logged-in-user']").textContent()).toBe(
    //   users.username
    // );
    // await this.page.waitForTimeout(1000);
    await this.page
      .locator('[id="create-conversation"] div[title="Create conversation"]')
      .click();
    await this.page.waitForTimeout(1500);
    await this.page
      .locator(`//div[@id="${users.uid}"]//div[text()='${users.username}']`)
      .click();
  }

  async searchMessages(searchTerm: string): Promise<void> {
    await this.page.waitForTimeout(1000);
    await this.page.click('button[title="Search"]');
    await this.page.waitForTimeout(1000);
    await this.page.fill(
      'div.cometchat-search input[placeholder="Search"]',
      searchTerm
    );
  }
}
test.setTimeout(200000);

// Test Suite
test.describe("CometChat - Complete Test Suite", () => {
  let browser: Browser;
  let user1Context: BrowserContext;
  let user2Context: BrowserContext;
  let user3Context: BrowserContext;
  let user1Page: Page;
  let user2Page: Page;
  let user3Page: Page;
  let user1Chat: CometChatHelper;
  let user2Chat: CometChatHelper;
  let user3Chat: CometChatHelper;

  test.beforeAll(async ({ browser: b }) => {
    browser = b;
  });

  test.beforeEach(async () => {
    // Create contexts for multiple users
    user1Context = await browser.newContext();
    user2Context = await browser.newContext();
    user3Context = await browser.newContext();

    user1Page = await user1Context.newPage();
    user2Page = await user2Context.newPage();
    user3Page = await user3Context.newPage();

    user1Chat = new CometChatHelper(user1Page);
    user2Chat = new CometChatHelper(user2Page);
    user3Chat = new CometChatHelper(user3Page);
  });

  test.afterEach(async () => {
    await user1Context.close();
    await user2Context.close();
    await user3Context.close();
  });

  test("1. Initiate Chats", async () => {
    await user1Chat.login(config.users.user1.uid);
    await user2Chat.login(config.users.user2.uid);

    // User1 starts a conversation with User2
    await user1Chat.startNewConversation(config.users.user2);
    await user1Chat.sendMessage("Hello User2!, I am User1!");
    await user1Page.waitForTimeout(1500);
    await user1Chat.startNewConversation(config.users.user3);
    await user1Chat.sendMessage("Hello User3!, I am User1!");

    // User2 starts a conversation with User3
    await user2Chat.startNewConversation(config.users.user3);
    await user2Chat.sendMessage("Hello User3, I am User2!");
    await user2Page.waitForTimeout(1500);
  });

  test("2. Basic Message Send and Receive", async () => {
    // Login both users
    await user1Chat.login(config.users.user1.uid);
    await user2Chat.login(config.users.user2.uid);

    // User1 selects conversation with User2
    await user1Chat.selectConversation(
      config.users.user1.uid,
      config.users.user2.uid
    );

    // User2 selects conversation with User1
    await user2Chat.selectConversation(
      config.users.user2.uid,
      config.users.user1.uid
    );

    // User1 sends message
    const testMessage: string = `Test message ${Date.now()}`;
    await user1Chat.sendMessage(testMessage);

    // Verify User1 sees their own message
    const user1SentMessage: Locator = await user1Chat.waitForMessage(
      testMessage
    );
    expect(await user1SentMessage.isVisible({ timeout: 8000 })).toBeTruthy();

    // Verify User2 receives the message
    const user2ReceivedMessage: Locator = await user2Chat.waitForMessage(
      testMessage
    );
    expect(
      await user2ReceivedMessage.isVisible({ timeout: 8000 })
    ).toBeTruthy();
  });

  test("3. Bidirectional Conversation Flow", async () => {
    await user1Chat.login(config.users.user1.uid);
    await user2Chat.login(config.users.user2.uid);

    await user1Chat.selectConversation(
      config.users.user1.uid,
      config.users.user2.uid
    );
    await user2Chat.selectConversation(
      config.users.user2.uid,
      config.users.user1.uid
    );

    // Conversation flow
    const messages: MessageData[] = [
      { sender: user1Chat, text: "Hey, how are you?" },
      { sender: user2Chat, text: "I am good, thanks!" },
      { sender: user1Chat, text: "Great to hear!" },
      { sender: user2Chat, text: "How about you?" },
    ];

    for (const msg of messages) {
      await msg.sender.sendMessage(msg.text);

      // Both users should see the message
      await user1Chat.waitForMessage(msg.text);
      await user2Chat.waitForMessage(msg.text);
    }

    // Verify message order
    const user1Messages: string[] = await user1Chat.getAllMessages();
    const user2Messages: string[] = await user2Chat.getAllMessages();

    expect(user1Messages).toEqual(user2Messages);
  });

  test("4. Message Read Receipts", async () => {
    await user1Chat.login(config.users.user1.uid);

    await user1Chat.selectConversation(
      config.users.user1.uid,
      config.users.user3.uid
    );

    // User1 sends message
    const message: string = `Read receipt test ${Date.now()}`;
    await user1Chat.sendMessage(message);

    // Check for delivered status
    // const deliveredStatus = user1Page.locator(
    //   '(//div[@class="cometchat-message-bubble__status-info-view"]/div)[last()]'
    // );
    // await expect(deliveredStatus).toContainClass(
    //   "cometchat-receipts-delivered",
    //   {
    //     timeout: 8000,
    //   }
    // );

    // User3 opens conversation (marks as read)
    await user3Chat.login(config.users.user3.uid);
    await user3Chat.selectConversation(
      config.users.user3.uid,
      config.users.user1.uid
    );

    // Check for read status
    const readStatus = user1Page.locator(
      '(//div[@class="cometchat-message-bubble__status-info-view"]/div)[last()]'
    );
    await expect(readStatus).toContainClass("cometchat-receipts-read", {
      timeout: 8000,
    });
  });

  test("5. Message Reactions", async () => {
    await user1Chat.login(config.users.user1.uid);
    await user2Chat.login(config.users.user2.uid);

    await user1Chat.selectConversation(
      config.users.user1.uid,
      config.users.user2.uid
    );
    await user2Chat.selectConversation(
      config.users.user2.uid,
      config.users.user1.uid
    );

    // User1 sends message
    const message: string = "React to this message!";
    await user1Chat.sendMessage(message);

    // User2 adds reaction
    await user2Page.waitForTimeout(1000);
    const messageElement: Locator = await user2Chat.waitForMessage(message);
    await user2Page.waitForTimeout(1000);
    await messageElement.click();
    // await user2Page.click('(//div[title="React"])[last()]');
    // await user2Page.click('div[title="+1"]');

    // Open emoji picker
    await user2Chat.openEmojiPicker();

    // Select emoji
    await user2Chat.selectEmoji("😀");
    await user1Chat.verifyEmoji("😀");
  });

  test("6. Message Edit", async () => {
    await user1Chat.login(config.users.user1.uid);
    await user2Chat.login(config.users.user2.uid);

    await user1Chat.selectConversation(
      config.users.user1.uid,
      config.users.user2.uid
    );
    await user2Chat.selectConversation(
      config.users.user2.uid,
      config.users.user1.uid
    );

    // User1 sends message
    const originalMessage: string = "Original message";
    await user1Chat.sendMessage(originalMessage);

    // User1 edits message
    const messageElement: Locator = await user1Chat.waitForMessage(
      originalMessage
    );
    await messageElement.click();
    await user1Page
      .locator(
        "(//div[@class='cometchat-message-bubble__options']//div[@class='cometchat-menu-list__sub-menu']/div)[last()]"
      )
      .click({ force: true, timeout: 8000 });
    const subMenuOptions = await user1Page.locator('div[id="subMenuContext"]');
    await subMenuOptions.locator("div#edit").last().click();
    await user1Chat.sendMessage("Edited message");

    // Verify edit appears for both users
    await user1Chat.waitForMessage("Edited message");
    await user2Chat.waitForMessage("Edited message");

    // Check for edited indicator
    const editedIndicator = user2Page.locator(
      "(//span[@class='cometchat-message-bubble__status-info-view-helper-text'])[last()]"
    );
    await expect(editedIndicator).toBeVisible();
  });

  test("7. Message Delete", async () => {
    await user1Chat.login(config.users.user1.uid);
    await user2Chat.login(config.users.user2.uid);

    await user1Chat.selectConversation(
      config.users.user1.uid,
      config.users.user2.uid
    );
    await user2Chat.selectConversation(
      config.users.user2.uid,
      config.users.user1.uid
    );

    // User1 sends message
    const message: string = "This will be deleted";
    await user1Chat.sendMessage(message);

    // Wait for message to appear
    const messageElement: Locator = await user1Chat.waitForMessage(message);
    await user2Chat.waitForMessage(message);

    // User1 deletes message
    await messageElement.click();
    await user1Page
      .locator("(//div[@class='cometchat-menu-list__sub-menu']/div)[last()]")
      .click({ force: true, timeout: 8000 });
    const subMenuOptions = await user1Page.locator('div[id="subMenuContext"]');
    await subMenuOptions.locator("div#delete").last().click();

    // Verify message is deleted for both users
    await expect(user1Page.locator(`text="${message}"`).last()).toBeHidden({
      timeout: 5000,
    });
    await expect(user2Page.locator(`text="${message}"`).last()).toBeHidden({
      timeout: 5000,
    });

    // Check for deleted message indicator
    const deletedIndicator = user2Page
      .locator('div[class="cometchat-delete-bubble__body"]')
      .last();
    await expect(deletedIndicator).toBeVisible();
  });

  test("9. Search Messages", async () => {
    await user1Chat.login(config.users.user1.uid);
    await user2Chat.login(config.users.user2.uid);

    await user1Chat.selectConversation(
      config.users.user1.uid,
      config.users.user2.uid
    );
    await user2Chat.selectConversation(
      config.users.user2.uid,
      config.users.user1.uid
    );

    // Send various messages
    await user1Chat.sendMessage("Hello world");
    await user2Chat.sendMessage("Testing search functionality");
    await user1Chat.sendMessage("Important message here");
    await user2Chat.sendMessage("Random text");

    // Search for specific message
    await user1Chat.searchMessages("Important");

    // Verify search results
    const searchResults = await user1Page
      .locator("div.cometchat-search__results div.cometchat-list__item-wrapper")
      .all();
    await expect(searchResults[0]).toBeVisible({ timeout: 5000 });
  });

  test("10. Message Thread/Reply", async () => {
    await user1Chat.login(config.users.user1.uid);
    await user2Chat.login(config.users.user2.uid);

    await user1Chat.selectConversation(
      config.users.user1.uid,
      config.users.user2.uid
    );
    await user2Chat.selectConversation(
      config.users.user2.uid,
      config.users.user1.uid
    );

    // User1 sends original message
    const originalMessage: string = "Start a thread from this";
    await user1Chat.sendMessage(originalMessage);

    // User2 replies in thread
    const messageElement: Locator = await user2Chat.waitForMessage(
      originalMessage
    );
    await messageElement.click();
    await user2Page.waitForTimeout(1000);
    await user2Page
      .locator(
        "(//div[@class='cometchat-message-bubble__options']//div[@class='cometchat-menu-list__sub-menu']/div)[last()]"
      )
      .last()
      .click({ force: true, timeout: 5000 });
    await user2Page.waitForTimeout(1000);
    const subMenuOptions = await user2Page
      .locator('div[id="subMenuContext"]')
      .last();
    await user2Page.waitForTimeout(1000);
    await subMenuOptions.locator("div#replyInThread").last().click();
    await user2Page.waitForTimeout(1000);
    await user2Chat.sendThreadMessage("Reply in thread");

    // Both users should see thread indicator
    const user1Thread = user1Page.locator(
      '(//button[contains(@class, "cometchat-button") and contains(@title, "Reply")])[last()]'
    );
    const user2Thread = user2Page.locator(
      '(//button[contains(@class, "cometchat-button") and contains(@title, "Reply")])[last()]'
    );

    await expect(user1Thread).toBeVisible();
    await expect(user2Thread).toBeVisible();

    // Open thread view
    await user1Thread.click();
    const threadView = user1Page.locator("div.cometchat-threaded-message");
    await expect(threadView).toBeVisible();
  });
});

test.describe("Comet Chat - Tests", async () => {
  let browser: Browser;
  let user1Context: BrowserContext;
  let user2Context: BrowserContext;
  let user1Page: Page;
  let user2Page: Page;
  let user1Chat: CometChatHelper;
  let user2Chat: CometChatHelper;
  test.beforeAll(async ({ browser: b }) => {
    browser = b;
  });
  test("8. Unread Message Count", async () => {
    user1Context = await test.step("Create user1 context", async () => {
      if (!browser) throw new Error("Browser not initialized");
      return await browser.newContext();
    });
    user1Page = await test.step("Create user1 page", async () => {
      if (!user1Context) throw new Error("User1 context not initialized");
      return await user1Context.newPage();
    });
    user1Chat = await test.step("Create user1 chat", async () => {
      if (!user1Page) throw new Error("User1 page not initialized");
      return new CometChatHelper(user1Page);
    });
    await user1Chat.login(config.users.user1.uid);
    // User1 sends multiple messages
    await user1Chat.selectConversation(
      config.users.user1.uid,
      config.users.user2.uid
    );
    await user1Chat.sendMessage("Message 1");
    await user1Chat.sendMessage("Message 2");
    await user1Chat.sendMessage("Message 3");
    await user1Page.waitForTimeout(1000);

    user2Context = await test.step("Create user2 context", async () => {
      if (!browser) throw new Error("Browser not initialized");
      return await browser.newContext();
    });
    user2Page = await test.step("Create user2 page", async () => {
      if (!user2Context) throw new Error("User2 context not initialized");
      return await user2Context.newPage();
    });
    user2Chat = await test.step("Create user2 chat", async () => {
      if (!user2Page) throw new Error("User2 page not initialized");
      return new CometChatHelper(user2Page);
    });
    await user2Chat.login(config.users.user2.uid);

    // Check unread count on User2's conversation list
    const convo = await user2Chat.chooseConversation(
      config.users.user2.uid,
      config.users.user1.uid
    );
    const unreadBadge = await convo.locator(
      "div.cometchat-conversations__trailing-view-badge-count"
    );
    await expect(unreadBadge).toBeVisible({ timeout: 5000 });
    const unreadCount: string | null = await unreadBadge.textContent();
    expect(unreadCount).not.toBe(null);

    // User2 opens conversation
    await user2Chat.selectConversation(
      config.users.user2.uid,
      config.users.user1.uid
    );

    // Unread count should be cleared
    await expect(unreadBadge).toBeHidden({ timeout: 3000 });
  });
});

// Export types for reuse
export type { User, TestConfig, MessageData };
export { CometChatHelper, config };
