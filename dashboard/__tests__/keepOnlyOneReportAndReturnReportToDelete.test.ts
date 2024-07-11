import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
import type { ReportInstance } from "../src/types/report";
import { reportMock } from "./mocks";
import { keepOnlyOneReportAndReturnReportToDelete } from "../src/utils/delete-duplicated-reports";

// Mock the capture function from Sentry service
jest.mock("../src/services/sentry", () => ({
  capture: jest.fn(),
}));

const teamId = "TEAM_A_ID";

describe("Duplicated reports: keep only one report and return the reports to delete", () => {
  test("Keep the lastest one if reports are both empty", async () => {
    const reports: Array<ReportInstance> = [
      {
        ...reportMock,
        _id: "1",
        date: "2024-01-01",
        team: teamId,
        updatedAt: "2024-01-02T00:00:00.000Z",
      },
      {
        ...reportMock,
        _id: "2",
        date: "2024-01-01",
        team: teamId,
        updatedAt: "2024-01-03T00:01:00.000Z",
      },
    ];
    const reportsToDelete = keepOnlyOneReportAndReturnReportToDelete(reports);
    expect(reportsToDelete).toHaveLength(1);
    expect(reportsToDelete[0]._id).toBe("1");
  });
  test("Keep the report with the description if the other one is empty", async () => {
    const reports: Array<ReportInstance> = [
      {
        ...reportMock,
        _id: "1",
        date: "2024-01-01",
        team: teamId,
        updatedAt: "2024-01-02T00:00:00.000Z",
        description: "Report with description",
      },
      {
        ...reportMock,
        _id: "2",
        date: "2024-01-01",
        team: teamId,
        updatedAt: "2024-01-02T00:01:00.000Z",
      },
    ];
    const reportsToDelete = keepOnlyOneReportAndReturnReportToDelete(reports);
    expect(reportsToDelete).toHaveLength(1);
    expect(reportsToDelete[0]._id).toBe("2");
  });
  test("Keep the report with the collaborations if the other one is empty", async () => {
    const reports: Array<ReportInstance> = [
      {
        ...reportMock,
        _id: "1",
        date: "2024-01-01",
        team: teamId,
        updatedAt: "2024-01-02T00:00:00.000Z",
        collaborations: ["collaboration 1", "collaboration 2"],
      },
      {
        ...reportMock,
        _id: "2",
        date: "2024-01-01",
        team: teamId,
        updatedAt: "2024-01-02T00:01:00.000Z",
      },
    ];
    const reportsToDelete = keepOnlyOneReportAndReturnReportToDelete(reports);
    expect(reportsToDelete).toHaveLength(1);
    expect(reportsToDelete[0]._id).toBe("2");
  });
  test("Keep the latest one if both as description", async () => {
    const reports: Array<ReportInstance> = [
      {
        ...reportMock,
        _id: "1",
        date: "2024-01-01",
        team: teamId,
        updatedAt: "2024-01-02T00:00:00.000Z",
        description: "Report with description",
      },
      {
        ...reportMock,
        _id: "2",
        date: "2024-01-01",
        team: teamId,
        updatedAt: "2024-01-02T00:01:00.000Z",
        description: "Report also with description",
      },
    ];
    const reportsToDelete = keepOnlyOneReportAndReturnReportToDelete(reports);
    expect(reportsToDelete).toHaveLength(1);
    expect(reportsToDelete[0]._id).toBe("1");
  });
  test("Keep the latest one if both as collaborations", async () => {
    const reports: Array<ReportInstance> = [
      {
        ...reportMock,
        _id: "1",
        date: "2024-01-01",
        team: teamId,
        updatedAt: "2024-01-02T00:00:00.000Z",
        collaborations: ["collaboration 1", "collaboration 2"],
      },
      {
        ...reportMock,
        _id: "2",
        date: "2024-01-01",
        team: teamId,
        updatedAt: "2024-01-02T00:01:00.000Z",
        collaborations: ["collaboration 3", "collaboration 4"],
      },
    ];
    const reportsToDelete = keepOnlyOneReportAndReturnReportToDelete(reports);
    expect(reportsToDelete).toHaveLength(1);
    expect(reportsToDelete[0]._id).toBe("1");
  });
  test("Keep the latest one if both as either description or collaboration", async () => {
    const reports: Array<ReportInstance> = [
      {
        ...reportMock,
        _id: "1",
        date: "2024-01-01",
        team: teamId,
        updatedAt: "2024-01-02T00:00:00.000Z",
        description: "Report with description",
      },
      {
        ...reportMock,
        _id: "2",
        date: "2024-01-01",
        team: teamId,
        updatedAt: "2024-01-02T00:01:00.000Z",
        collaborations: ["collaboration 3", "collaboration 4"],
      },
    ];
    const reportsToDelete = keepOnlyOneReportAndReturnReportToDelete(reports);
    expect(reportsToDelete).toHaveLength(1);
    expect(reportsToDelete[0]._id).toBe("1");
  });
});
