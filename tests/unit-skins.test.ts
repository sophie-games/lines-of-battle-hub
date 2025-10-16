import unitSkins from "../game-data/unit-skins.json";

describe("Unit Skins", () => {
  it("should not have repeated skin ids", () => {
    const ids = new Set<number>();

    unitSkins.forEach((skin) => {
      expect(ids.has(skin.id)).toBe(false);
      ids.add(skin.id);
    });
  });
});
