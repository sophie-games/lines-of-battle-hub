import fs from "fs";
import path from "path";

describe("Locales JSON Validation", () => {
  const localesDir = path.join(__dirname, "./locales");

  // Get all language directories
  const languageDirs = fs
    .readdirSync(localesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  // Helper function to safely read and parse JSON with encoding handling
  const safeReadJson = (filePath: string) => {
    try {
      let content = fs.readFileSync(filePath, "utf8");

      // Remove BOM if present
      if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1);
      }

      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON file ${filePath}: ${error}`);
    }
  };

  describe("JSON File Validation", () => {
    languageDirs.forEach((language) => {
      describe(`Language: ${language}`, () => {
        const languageDir = path.join(localesDir, language);

        // Get all JSON files in this language directory
        const jsonFiles = fs
          .readdirSync(languageDir)
          .filter((file) => file.endsWith(".json"));

        // Test that all JSON files are valid and not broken
        jsonFiles.forEach((jsonFile) => {
          it(`${jsonFile} should be valid JSON`, () => {
            const filePath = path.join(languageDir, jsonFile);

            expect(() => {
              const parsed = safeReadJson(filePath);
              expect(typeof parsed).toBe("object");
              expect(parsed).not.toBeNull();
            }).not.toThrow();
          });
        });
      });
    });
  });
});
