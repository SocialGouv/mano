import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
import { computeEvolutiveStatsForPersons } from "../src/recoil/evolutiveStats";
import { mockedEvolutiveStatsIndicatorsBase, personBase } from "./mocks";
import * as SentryService from "../src/services/sentry";

// Mock the capture function from Sentry service
jest.mock("../src/services/sentry", () => ({
  capture: jest.fn(),
}));
const mockedCapture = SentryService.capture as jest.MockedFunction<typeof SentryService.capture>;

describe("Stats evolutives", () => {
  test("simple example should work properly", () => {
    const computed = computeEvolutiveStatsForPersons({
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-04-01T00:00:00.000Z",
      evolutiveStatsIndicatorsBase: mockedEvolutiveStatsIndicatorsBase,
      evolutiveStatsIndicators: [
        {
          fieldName: "gender",
          fromValue: "Homme",
          toValue: "Femme",
          type: "enum",
        },
      ],
      persons: [
        {
          ...personBase,
          gender: "Femme",
          history: [
            {
              date: dayjs("2024-02-01").toDate(),
              data: {
                gender: {
                  oldValue: "Homme",
                  newValue: "Femme",
                },
              },
              user: "XXX",
            },
          ],
        },
      ],
    });
    expect(computed.valueStart).toBe("Homme");
    expect(computed.countStart).toBe(1);
    expect(computed.valueEnd).toBe("Femme");
    expect(computed.countEnd).toBe(1);
    expect(dayjs(computed.startDateConsolidated).format("YYYY-MM-DD")).toBe("2024-01-01");
    expect(dayjs(computed.endDateConsolidated).format("YYYY-MM-DD")).toBe("2024-04-01");
  });

  test("should call capture with the correct errors when history is incoherent", () => {
    const computed = computeEvolutiveStatsForPersons({
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-04-01T00:00:00.000Z",
      evolutiveStatsIndicatorsBase: mockedEvolutiveStatsIndicatorsBase,
      evolutiveStatsIndicators: [
        {
          fieldName: "gender",
          fromValue: "Homme",
          toValue: "Femme",
          type: "enum",
        },
      ],
      persons: [
        {
          ...personBase,
          gender: "Homme",
          history: [
            {
              date: dayjs("2024-01-01").toDate(),
              data: {
                gender: {
                  oldValue: "Homme",
                  newValue: "Femme",
                },
              },
              user: "XXX",
            },
          ],
        },
      ],
    });
    expect(computed.valueStart).toBe("Homme");
    expect(computed.countStart).toBe(1);
    expect(computed.valueEnd).toBe("Femme");
    expect(computed.countEnd).toBe(0);
    expect(dayjs(computed.startDateConsolidated).format("YYYY-MM-DD")).toBe("2024-01-01");
    expect(dayjs(computed.endDateConsolidated).format("YYYY-MM-DD")).toBe("2024-04-01");

    // Verify capture was called with "Incoherent snapshot history"
    const incoherentSnapshotHistoryCall = mockedCapture.mock.calls.find((call) => call[0].message === "Incoherent snapshot history");
    expect(incoherentSnapshotHistoryCall).toBeTruthy();

    // Verify mockedCapture was called with "Incoherent history"
    const incoherentHistoryCall = mockedCapture.mock.calls.find((call) => call[0].message === "Incoherent history");
    expect(incoherentHistoryCall).toBeTruthy();

    // Verify total number of calls
    expect(mockedCapture).toHaveBeenCalledTimes(2);
  });

  test("multiple changes example should work properly", () => {
    const computed = computeEvolutiveStatsForPersons({
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-04-01T00:00:00.000Z",
      evolutiveStatsIndicatorsBase: mockedEvolutiveStatsIndicatorsBase,
      evolutiveStatsIndicators: [
        {
          fieldName: "gender",
          fromValue: "Homme",
          toValue: "Femme",
          type: "enum",
        },
      ],
      persons: [
        {
          ...personBase,
          gender: "Femme",
          history: [
            {
              date: dayjs("2023-10-01").toDate(),
              data: {
                gender: {
                  oldValue: "Femme",
                  newValue: "Femme transgenre",
                },
              },
              user: "XXX",
            },
            {
              date: dayjs("2023-12-01").toDate(),
              data: {
                gender: {
                  oldValue: "Femme transgenre",
                  newValue: "Homme",
                },
              },
              user: "XXX",
            },
            {
              date: dayjs("2024-04-02").toDate(),
              data: {
                gender: {
                  oldValue: "Homme",
                  newValue: "Femme",
                },
              },
              user: "XXX",
            },
          ],
        },
      ],
    });
    expect(computed.valueStart).toBe("Homme");
    expect(computed.countStart).toBe(1);
    expect(computed.valueEnd).toBe("Femme");
    expect(computed.countEnd).toBe(1);
    expect(dayjs(computed.startDateConsolidated).format("YYYY-MM-DD")).toBe("2024-01-01");
    expect(dayjs(computed.endDateConsolidated).format("YYYY-MM-DD")).toBe("2024-04-01");
  });

  test("checking the exact value for the `fromValue`: 'Homme' and 'Homme transgenre' is not the same", () => {
    const computed = computeEvolutiveStatsForPersons({
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-04-01T00:00:00.000Z",
      evolutiveStatsIndicatorsBase: mockedEvolutiveStatsIndicatorsBase,
      evolutiveStatsIndicators: [
        {
          fieldName: "gender",
          fromValue: "Homme",
          toValue: "Femme",
          type: "enum",
        },
      ],
      persons: [
        {
          ...personBase,
          gender: "Femme",
          history: [
            {
              date: dayjs("2024-02-02").toDate(),
              data: {
                gender: {
                  oldValue: "Homme transgenre",
                  newValue: "Femme",
                },
              },
              user: "XXX",
            },
          ],
        },
      ],
    });
    expect(computed.valueStart).toBe("Homme");
    expect(computed.countStart).toBe(0);
    expect(computed.valueEnd).toBe("Femme");
    expect(computed.countEnd).toBe(0);
    expect(dayjs(computed.startDateConsolidated).format("YYYY-MM-DD")).toBe("2024-01-01");
    expect(dayjs(computed.endDateConsolidated).format("YYYY-MM-DD")).toBe("2024-04-01");
  });

  test("'Non renseigné' should work", () => {
    const computed = computeEvolutiveStatsForPersons({
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-04-01T00:00:00.000Z",
      evolutiveStatsIndicatorsBase: mockedEvolutiveStatsIndicatorsBase,
      evolutiveStatsIndicators: [
        {
          fieldName: "gender",
          fromValue: "Non renseigné",
          toValue: "Femme",
          type: "enum",
        },
      ],
      persons: [
        {
          ...personBase,
          gender: "Femme",
          history: [
            {
              date: dayjs("2024-02-02").toDate(),
              data: {
                gender: {
                  oldValue: "",
                  newValue: "Femme",
                },
              },
              user: "XXX",
            },
          ],
        },
      ],
    });
    expect(computed.valueStart).toBe("Non renseigné");
    expect(computed.countStart).toBe(1);
    expect(computed.valueEnd).toBe("Femme");
    expect(computed.countEnd).toBe(1);
    expect(dayjs(computed.startDateConsolidated).format("YYYY-MM-DD")).toBe("2024-01-01");
    expect(dayjs(computed.endDateConsolidated).format("YYYY-MM-DD")).toBe("2024-04-01");
  });

  test("Multi values should work", () => {
    const computed = computeEvolutiveStatsForPersons({
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-04-01T00:00:00.000Z",
      evolutiveStatsIndicatorsBase: mockedEvolutiveStatsIndicatorsBase,
      evolutiveStatsIndicators: [
        {
          fieldName: "resources",
          fromValue: "Non renseigné",
          toValue: "RSA",
          type: "enum",
        },
      ],
      persons: [
        {
          ...personBase,
          resources: ["RSA"],
          history: [
            {
              date: dayjs("2024-02-02").toDate(),
              data: {
                resources: {
                  oldValue: null,
                  newValue: ["RSA", "Autre"],
                },
              },
              user: "XXX",
            },
            {
              date: dayjs("2024-02-03").toDate(),
              data: {
                resources: {
                  oldValue: ["RSA", "Autre"],
                  newValue: ["RSA"],
                },
              },
              user: "XXX",
            },
          ],
        },
      ],
    });
    expect(computed.valueStart).toBe("Non renseigné");
    expect(computed.countStart).toBe(1);
    expect(computed.valueEnd).toBe("RSA");
    expect(computed.countEnd).toBe(1);
    expect(dayjs(computed.startDateConsolidated).format("YYYY-MM-DD")).toBe("2024-01-01");
    expect(dayjs(computed.endDateConsolidated).format("YYYY-MM-DD")).toBe("2024-04-01");
  });
});
