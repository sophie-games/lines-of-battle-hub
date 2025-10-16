import { readFileSync, readdirSync } from "fs";
import { join } from "path";

describe("Game Data JSON Files", () => {
  const gameDataPath = join(__dirname, "../game-data");
  const gameDataFiles = readdirSync(gameDataPath)
    .filter((file) => file.endsWith(".json"))
    .sort();

  test.each(gameDataFiles)("should have valid JSON in %s", (filename) => {
    const filePath = join(gameDataPath, filename);

    expect(() => {
      const fileContent = readFileSync(filePath, "utf-8");
      JSON.parse(fileContent);
    }).not.toThrow();
  });

  test.each(gameDataFiles)("should not be empty in %s", (filename) => {
    const filePath = join(gameDataPath, filename);
    const fileContent = readFileSync(filePath, "utf-8");

    expect(fileContent.trim()).not.toBe("");
  });
});
