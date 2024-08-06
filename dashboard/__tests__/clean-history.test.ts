import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { cleanHistory } from "../src/utils/person-history";
import type { PersonHistoryEntry } from "../src/types/person";
dayjs.extend(utc);

// Mock the capture function from Sentry service
jest.mock("../src/services/sentry", () => ({
  capture: jest.fn(),
}));

describe("Clean history", () => {
  const minimalHistory: Array<PersonHistoryEntry> = [
    {
      date: new Date("2022-01-01T00:00:00.000Z"),
      user: "a-user-id",
      userName: "Michael Kel",
      data: {
        merge: { _id: "another-person-id", name: "Doe" },
        name: { oldValue: "John", newValue: "Doe" },
        age: { oldValue: 25, newValue: 30 },
        outOfTeamsInformations: [
          { team: "team-id", reasons: ["reason1", "reason2"] },
          { team: "team-id-2", reasons: ["reason1", "reason2"] },
        ],
      },
    },
  ];
  test("should not clean a good history", async () => {
    const cleanedHistory = cleanHistory(minimalHistory);
    expect(cleanedHistory).toEqual(minimalHistory);
  });
  test("should clean a not good history", async () => {
    const history: Array<PersonHistoryEntry> = [
      {
        date: new Date("2022-01-01T00:00:00.000Z"),
        user: "a-user-id",
        userName: "Michael Kel",
        data: {
          documents: { oldValue: "plif", newValue: "plaf" }, // forbidden field
          history: { oldValue: "plif", newValue: "plaf" }, // forbidden field
          createdAt: { oldValue: "plif", newValue: "plaf" }, // forbidden field
          updatedAt: { oldValue: "plif", newValue: "plaf" }, // forbidden field
          gender: { newValue: "" }, // change from falsy to falsy is ignored
          email: { newValue: null }, // change from falsy to falsy is ignored
          phone: { oldValue: undefined, newValue: "" }, // change from falsy to falsy is ignored
          assignedTeams: { oldValue: undefined, newValue: [] }, // change from falsy to falsy is ignored
          merge: { _id: "another-person-id", name: "Doe" }, // kept
          name: { oldValue: "John", newValue: "Doe" }, // kept
          age: { oldValue: 25, newValue: 30 }, // kept
          outOfTeamsInformations: [
            // kept
            { team: "team-id", reasons: ["reason1", "reason2"] },
            { team: "team-id-2", reasons: ["reason1", "reason2"] },
          ],
        },
      },
      {
        date: new Date("2022-01-03T00:00:00.000Z"),
        user: "a-user-id",
        userName: "Michael Kel",
        data: {
          // FIX: there was a bug in history at some point, where the whole person was saved in the history
          // below it's removed
          encryptedEntityKey: { oldValue: "plif", newValue: "plaf" }, // forbidden field
        },
      },
    ];
    const cleanedHistory = cleanHistory(history);
    expect(cleanedHistory).toEqual(minimalHistory);
  });
});
