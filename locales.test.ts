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

  describe("Key Validation", () => {
    // Helper function to get all keys from a nested object
    const getAllKeys = (obj: any, prefix = ""): string[] => {
      const keys: string[] = [];
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
            keys.push(...getAllKeys(obj[key], fullKey));
          } else {
            keys.push(fullKey);
          }
        }
      }
      return keys;
    };

    // Test for duplicate keys within each locale file
    languageDirs.forEach((language) => {
      describe(`Language: ${language}`, () => {
        const languageDir = path.join(localesDir, language);
        const jsonFiles = fs
          .readdirSync(languageDir)
          .filter((file) => file.endsWith(".json"));

        jsonFiles.forEach((jsonFile) => {
          it(`${jsonFile} should not have duplicate keys`, () => {
            const filePath = path.join(languageDir, jsonFile);
            const parsed = safeReadJson(filePath);
            const keys = getAllKeys(parsed);
            const uniqueKeys = new Set(keys);

            expect(keys.length).toBe(uniqueKeys.size);
          });
        });
      });
    });

    // Test that non-English locales don't have keys that English doesn't have
    describe("Key consistency with English", () => {
      const englishDir = path.join(localesDir, "en");
      
      // Get all English keys
      const englishKeys: { [filename: string]: string[] } = {};
      const englishJsonFiles = fs
        .readdirSync(englishDir)
        .filter((file) => file.endsWith(".json"));

      englishJsonFiles.forEach((jsonFile) => {
        const filePath = path.join(englishDir, jsonFile);
        const parsed = safeReadJson(filePath);
        englishKeys[jsonFile] = getAllKeys(parsed);
      });

      // Test each non-English locale
      languageDirs
        .filter((language) => language !== "en")
        .forEach((language) => {
          describe(`Language: ${language}`, () => {
            const languageDir = path.join(localesDir, language);
            const jsonFiles = fs
              .readdirSync(languageDir)
              .filter((file) => file.endsWith(".json"));

            jsonFiles.forEach((jsonFile) => {
              it(`${jsonFile} should not have keys that English doesn't have`, () => {
                const filePath = path.join(languageDir, jsonFile);
                const parsed = safeReadJson(filePath);
                const keys = getAllKeys(parsed);
                const englishKeysForFile = englishKeys[jsonFile] || [];

                const extraKeys = keys.filter((key) => !englishKeysForFile.includes(key));
                expect(extraKeys).toEqual([]);
              });
            });
          });
        });
    });
  });
});
