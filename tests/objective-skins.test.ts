import objectiveSkins from "../game-data/objective-skins.json";

describe("Objective Skins", () => {
  it("should not have repeated skin ids", () => {
    const ids = new Set<number>();

    objectiveSkins.forEach((skin) => {
      expect(ids.has(skin.id)).toBe(false);
      ids.add(skin.id);
    });
  });
});
