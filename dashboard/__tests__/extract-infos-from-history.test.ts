import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { cleanHistory, extractInfosFromHistory } from "../src/utils/person-history";
import type { PersonHistoryEntry } from "../src/types/person";
import { personPopulated } from "./mocks";
dayjs.extend(utc);

// Mock the capture function from Sentry service
jest.mock("../src/services/sentry", () => ({
  capture: jest.fn(),
}));

describe("Extract infos from history", () => {
  const today = dayjs().startOf("day").toISOString();
  test("no team change, only one team", () => {
    const { assignedTeamsPeriods, interactions } = extractInfosFromHistory({
      ...personPopulated,
      createdAt: new Date("2022-01-01T00:00:00.000Z"),
      assignedTeams: ["TEAM_ID_A"],
      history: [],
    });
    expect(assignedTeamsPeriods).toEqual({
      TEAM_ID_A: [{ isoEndDate: today, isoStartDate: "2022-01-01T00:00:00.000Z" }],
      all: [{ isoStartDate: "2022-01-01T00:00:00.000Z", isoEndDate: today }],
    });
    expect(interactions).toEqual([new Date("2022-01-01T00:00:00.000Z")]);
  });
  test("one team change, from one team to another", () => {
    const { assignedTeamsPeriods, interactions } = extractInfosFromHistory({
      ...personPopulated,
      createdAt: new Date("2022-01-01T00:00:00.000Z"),
      assignedTeams: ["TEAM_ID_A"],
      history: [
        {
          date: new Date("2022-01-02T00:00:00.000Z"),
          user: "a-user-id",
          userName: "Michael Kel",
          data: {
            assignedTeams: { oldValue: ["TEAM_ID_B"], newValue: ["TEAM_ID_A"] },
          },
        },
      ],
    });
    expect(assignedTeamsPeriods).toEqual({
      TEAM_ID_A: [{ isoStartDate: "2022-01-02T00:00:00.000Z", isoEndDate: today }],
      TEAM_ID_B: [{ isoStartDate: "2022-01-01T00:00:00.000Z", isoEndDate: "2022-01-02T00:00:00.000Z" }],
      all: [{ isoStartDate: "2022-01-01T00:00:00.000Z", isoEndDate: today }],
    });
    expect(interactions).toEqual([new Date("2022-01-01T00:00:00.000Z"), new Date("2022-01-02T00:00:00.000Z")]);
  });
  test("one team change, adding one team", () => {
    const { assignedTeamsPeriods, interactions } = extractInfosFromHistory({
      ...personPopulated,
      createdAt: new Date("2022-01-01T00:00:00.000Z"),
      assignedTeams: ["TEAM_ID_B", "TEAM_ID_A"],
      history: [
        {
          date: new Date("2022-01-02T00:00:00.000Z"),
          user: "a-user-id",
          userName: "Michael Kel",
          data: {
            assignedTeams: { oldValue: ["TEAM_ID_B"], newValue: ["TEAM_ID_B", "TEAM_ID_A"] },
          },
        },
      ],
    });
    expect(assignedTeamsPeriods).toEqual({
      TEAM_ID_A: [{ isoStartDate: "2022-01-02T00:00:00.000Z", isoEndDate: today }],
      TEAM_ID_B: [{ isoStartDate: "2022-01-01T00:00:00.000Z", isoEndDate: today }],
      all: [{ isoStartDate: "2022-01-01T00:00:00.000Z", isoEndDate: today }],
    });
    expect(interactions).toEqual([new Date("2022-01-01T00:00:00.000Z"), new Date("2022-01-02T00:00:00.000Z")]);
  });
  test("one team change, removing one team", () => {
    const { assignedTeamsPeriods, interactions } = extractInfosFromHistory({
      ...personPopulated,
      createdAt: new Date("2022-01-01T00:00:00.000Z"),
      assignedTeams: ["TEAM_ID_A"],
      history: [
        {
          date: new Date("2022-01-02T00:00:00.000Z"),
          user: "a-user-id",
          userName: "Michael Kel",
          data: {
            assignedTeams: { oldValue: ["TEAM_ID_B", "TEAM_ID_A"], newValue: ["TEAM_ID_A"] },
          },
        },
      ],
    });
    expect(assignedTeamsPeriods).toEqual({
      TEAM_ID_A: [{ isoStartDate: "2022-01-01T00:00:00.000Z", isoEndDate: today }],
      TEAM_ID_B: [{ isoStartDate: "2022-01-01T00:00:00.000Z", isoEndDate: "2022-01-02T00:00:00.000Z" }],
      all: [{ isoStartDate: "2022-01-01T00:00:00.000Z", isoEndDate: today }],
    });
    expect(interactions).toEqual([new Date("2022-01-01T00:00:00.000Z"), new Date("2022-01-02T00:00:00.000Z")]);
  });
  test("two team changes", () => {
    const { assignedTeamsPeriods, interactions } = extractInfosFromHistory({
      ...personPopulated,
      createdAt: new Date("2022-01-01T00:00:00.000Z"),
      assignedTeams: ["TEAM_ID_A"],
      history: [
        // sorted by date from the oldest to the newest (ascending order) cause we PUSH a new entry
        {
          date: new Date("2022-01-02T00:00:00.000Z"),
          user: "a-user-id",
          userName: "Michael Kel",
          data: {
            assignedTeams: { oldValue: ["TEAM_ID_B"], newValue: ["TEAM_ID_A"] },
          },
        },
        {
          date: new Date("2022-01-03T00:00:00.000Z"),
          user: "a-user-id",
          userName: "Michael Kel",
          data: {
            assignedTeams: { oldValue: ["TEAM_ID_A"], newValue: ["TEAM_ID_B"] },
          },
        },
        {
          date: new Date("2022-01-04T00:00:00.000Z"),
          user: "a-user-id",
          userName: "Michael Kel",
          data: {
            assignedTeams: { oldValue: ["TEAM_ID_B"], newValue: ["TEAM_ID_A"] },
          },
        },
      ],
    });
    expect(assignedTeamsPeriods).toEqual({
      TEAM_ID_A: [
        { isoStartDate: "2022-01-02T00:00:00.000Z", isoEndDate: "2022-01-03T00:00:00.000Z" },
        { isoStartDate: "2022-01-04T00:00:00.000Z", isoEndDate: today },
      ],
      TEAM_ID_B: [
        { isoStartDate: "2022-01-01T00:00:00.000Z", isoEndDate: "2022-01-02T00:00:00.000Z" },
        { isoStartDate: "2022-01-03T00:00:00.000Z", isoEndDate: "2022-01-04T00:00:00.000Z" },
      ],
      all: [{ isoStartDate: "2022-01-01T00:00:00.000Z", isoEndDate: today }],
    });
    expect(interactions).toEqual([
      new Date("2022-01-01T00:00:00.000Z"),
      new Date("2022-01-04T00:00:00.000Z"),
      new Date("2022-01-03T00:00:00.000Z"),
      new Date("2022-01-02T00:00:00.000Z"),
    ]);
  });
});
