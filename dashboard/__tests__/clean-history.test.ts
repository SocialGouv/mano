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
  test("should not clean a good history", async () => {
    const history: Array<PersonHistoryEntry> = [
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
    const cleanedHistory = cleanHistory(history);
    expect(cleanedHistory).toEqual(history);
  });
});
