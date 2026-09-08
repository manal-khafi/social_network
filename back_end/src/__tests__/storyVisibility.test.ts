import { describe, it, expect } from "vitest";
import {
  RelationshipService,
  type StoryVisibilityContext,
} from "../services/relationship.service";

const ctx: StoryVisibilityContext = {
  blockedIds: new Set(["blocked"]),
  mutualFriendIds: new Set(["friend"]),
  closeFriendOwnerIds: new Set(["closeOwner"]),
};

const story = (user_id: string, visibility: "public" | "friends" | "close_friends") => ({
  user_id,
  visibility,
});

describe("RelationshipService.canViewStoryWithContext", () => {
  const can = (viewer: string, s: ReturnType<typeof story>) =>
    RelationshipService.canViewStoryWithContext(ctx, viewer, s);

  it("always shows your own stories", () => {
    expect(can("me", story("me", "close_friends"))).toBe(true);
  });

  it("never shows stories from someone in the block set", () => {
    expect(can("me", story("blocked", "public"))).toBe(false);
  });

  it("public stories are visible to anyone not blocked", () => {
    expect(can("me", story("stranger", "public"))).toBe(true);
  });

  it("friends stories require a mutual follow", () => {
    expect(can("me", story("friend", "friends"))).toBe(true);
    expect(can("me", story("stranger", "friends"))).toBe(false);
  });

  it("close_friends stories require being on that owner's list", () => {
    expect(can("me", story("closeOwner", "close_friends"))).toBe(true);
    expect(can("me", story("friend", "close_friends"))).toBe(false);
  });
});
