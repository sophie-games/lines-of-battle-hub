import avatars from "../game-data/avatars.json";

describe("Avatars", () => {
  it("should not have repeated avatar ids", () => {
    const ids = new Set<number>();

    avatars.forEach((avatar) => {
      expect(ids.has(avatar.id)).toBe(false);
      ids.add(avatar.id);
    });
  });
});
