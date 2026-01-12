import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ---- Users ----
  await prisma.user.createMany({
    data: [
      {
        id: "u1",
        username: "user1",
        email: "user1@example.com",
        password_hash: "pass1",
        display_name: "User One",
      },
      {
        id: "u2",
        username: "user2",
        email: "user2@example.com",
        password_hash: "pass2",
        display_name: "User Two",
      },
      {
        id: "u3",
        username: "user3",
        email: "user3@example.com",
        password_hash: "pass3",
        display_name: "User Three",
      },
      {
        id: "u4",
        username: "user4",
        email: "user4@example.com",
        password_hash: "pass4",
        display_name: "User Four",
      },
    ],
  });

  // ---- Follow ----
  await prisma.follow.createMany({
    data: [
      { id: "f1", follower_id: "u1", followed_id: "u2", status: "accepted" },
      { id: "f2", follower_id: "u2", followed_id: "u3", status: "pending" },
      { id: "f3", follower_id: "u3", followed_id: "u4", status: "rejected" },
      { id: "f4", follower_id: "u4", followed_id: "u1", status: "accepted" },
    ],
  });

  // ---- Block ----
  await prisma.block.createMany({
    data: [
      { id: "b1", blocker_id: "u1", blocked_id: "u3" },
      { id: "b2", blocker_id: "u2", blocked_id: "u4" },
      { id: "b3", blocker_id: "u3", blocked_id: "u1" },
      { id: "b4", blocker_id: "u4", blocked_id: "u2" },
    ],
  });

  // ---- Posts ----
  await prisma.post.createMany({
    data: [
      { id: "p1", content: "Post 1", user_id: "u1" },
      { id: "p2", content: "Post 2", user_id: "u2" },
      { id: "p3", content: "Post 3", user_id: "u3" },
      { id: "p4", content: "Post 4", user_id: "u4" },
    ],
  });

  // ---- Comment ----
  await prisma.comment.createMany({
    data: [
      { id: "c1", content: "Comment 1", user_id: "u1", post_id: "p1" },
      { id: "c2", content: "Comment 2", user_id: "u2", post_id: "p2" },
      { id: "c3", content: "Comment 3", user_id: "u3", post_id: "p3" },
      { id: "c4", content: "Comment 4", user_id: "u4", post_id: "p4" },
    ],
  });

  // ---- Like ----
  await prisma.like.createMany({
    data: [
      { id: "l1", user_id: "u1", post_id: "p1" },
      { id: "l2", user_id: "u2", post_id: "p2" },
      { id: "l3", user_id: "u3", post_id: "p3" },
      { id: "l4", user_id: "u4", post_id: "p4" },
    ],
  });

  // ---- Share ----
  await prisma.share.createMany({
    data: [
      {
        id: "s1",
        user_id: "u1",
        post_id: "p1",
        shared_content: "Sharing Post 1",
      },
      {
        id: "s2",
        user_id: "u2",
        post_id: "p2",
        shared_content: "Sharing Post 2",
      },
      {
        id: "s3",
        user_id: "u3",
        post_id: "p3",
        shared_content: "Sharing Post 3",
      },
      {
        id: "s4",
        user_id: "u4",
        post_id: "p4",
        shared_content: "Sharing Post 4",
      },
    ],
  });

  // ---- Repost ----
  await prisma.repost.createMany({
    data: [
      { id: "r1", user_id: "u1", original_post_id: "p1", caption: "Repost 1" },
      { id: "r2", user_id: "u2", original_post_id: "p2", caption: "Repost 2" },
      { id: "r3", user_id: "u3", original_post_id: "p3", caption: "Repost 3" },
      { id: "r4", user_id: "u4", original_post_id: "p4", caption: "Repost 4" },
    ],
  });

  // ---- Save ----
  await prisma.save.createMany({
    data: [
      { id: "sv1", user_id: "u1", post_id: "p1" },
      { id: "sv2", user_id: "u2", post_id: "p2" },
      { id: "sv3", user_id: "u3", post_id: "p3" },
      { id: "sv4", user_id: "u4", post_id: "p4" },
    ],
  });

  // ---- Stories ----
  await prisma.story.createMany({
    data: [
      { id: "st1", content_url: "url1", content_type: "image", user_id: "u1" },
      { id: "st2", content_url: "url2", content_type: "video", user_id: "u2" },
      { id: "st3", content_url: "url3", content_type: "text", user_id: "u3" },
      { id: "st4", content_url: "url4", content_type: "image", user_id: "u4" },
    ],
  });

  // ---- StoryView ----
  await prisma.storyView.createMany({
    data: [
      { id: "svw1", story_id: "st1", viewer_id: "u2" },
      { id: "svw2", story_id: "st2", viewer_id: "u3" },
      { id: "svw3", story_id: "st3", viewer_id: "u4" },
      { id: "svw4", story_id: "st4", viewer_id: "u1" },
    ],
  });

  // ---- Conversations ----
  await prisma.conversation.createMany({
    data: [
      { id: "conv1", title: "Conversation 1", is_group: false },
      { id: "conv2", title: "Conversation 2", is_group: false },
      { id: "conv3", title: "Conversation 3", is_group: true },
      { id: "conv4", title: "Conversation 4", is_group: true },
    ],
  });

  // ---- ConversationParticipant ----
  await prisma.conversationParticipant.createMany({
    data: [
      { id: "cp1", conversation_id: "conv1", user_id: "u1" },
      { id: "cp2", conversation_id: "conv2", user_id: "u2" },
      { id: "cp3", conversation_id: "conv3", user_id: "u3" },
      { id: "cp4", conversation_id: "conv4", user_id: "u4" },
    ],
  });

  // ---- Messages ----
  await prisma.message.createMany({
    data: [
      {
        id: "m1",
        conversation_id: "conv1",
        sender_id: "u1",
        content: "Hello 1",
      },
      {
        id: "m2",
        conversation_id: "conv2",
        sender_id: "u2",
        content: "Hello 2",
      },
      {
        id: "m3",
        conversation_id: "conv3",
        sender_id: "u3",
        content: "Hello 3",
      },
      {
        id: "m4",
        conversation_id: "conv4",
        sender_id: "u4",
        content: "Hello 4",
      },
    ],
  });

  // ---- MessageStatus ----
  await prisma.messageStatus.createMany({
    data: [
      { id: "ms1", message_id: "m1", user_id: "u2", status: "delivered" },
      { id: "ms2", message_id: "m2", user_id: "u3", status: "read" },
      { id: "ms3", message_id: "m3", user_id: "u4", status: "sent" },
      { id: "ms4", message_id: "m4", user_id: "u1", status: "delivered" },
    ],
  });

  // ---- TypeNotification ----
  await prisma.typeNotification.createMany({
    data: [
      { id: "tn1", code: "NEW_POST", name: "New Post" },
      { id: "tn2", code: "NEW_COMMENT", name: "New Comment" },
      { id: "tn3", code: "NEW_LIKE", name: "New Like" },
      { id: "tn4", code: "NEW_FOLLOW", name: "New Follow" },
    ],
  });

  // ---- Notification ----
  await prisma.notification.createMany({
    data: [
      {
        id: "n1",
        user_id: "u1",
        type_notification_id: "tn1",
        title: "Post Created",
        message: "User1 created a post",
      },
      {
        id: "n2",
        user_id: "u2",
        type_notification_id: "tn2",
        title: "Comment Received",
        message: "User2 received a comment",
      },
      {
        id: "n3",
        user_id: "u3",
        type_notification_id: "tn3",
        title: "Liked",
        message: "User3 got a like",
      },
      {
        id: "n4",
        user_id: "u4",
        type_notification_id: "tn4",
        title: "Followed",
        message: "User4 got a new follower",
      },
    ],
  });

  console.log("Full database seeding completed ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
