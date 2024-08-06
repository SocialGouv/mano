import dayjs from "dayjs";
import { filterPersonByAssignedTeamDuringQueryPeriod } from "../src/utils/person-merge-assigned-team-periods-with-query-period";

type TeamId = "TEAM_ID_A" | "TEAM_ID_B" | "TEAM_ID_C";

function addToDate(date: string, numberToAdd: number = 0, type: "day" | "month" | "year" = "day"): string {
  return dayjs(date).add(numberToAdd, type).startOf("day").toISOString();
}

describe("Filter person by assigned teams within a period - Jan 2023 until dec 2023", () => {
  const startDate = "2023-01-01";
  const endDate = addToDate(startDate, 1, "year");
  const period = {
    isoStartDate: addToDate(startDate),
    isoEndDate: addToDate(endDate),
  };
  describe("case: view all organisation date", () => {
    const viewAllOrganisationData = true;
    const selectedTeamsObjectWithOwnPeriod = {}; // we don't care about the period in this case
    test("the person should be included if period crosses person's lifetime", () => {
      const all = [
        {
          isoStartDate: addToDate(startDate, 1, "month"),
          isoEndDate: null,
        },
      ];
      const assignedTeamsPeriods = { all };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(true);
    });
    test("the person should NOT be included if period crosses person's lifetime", () => {
      const all = [
        {
          isoStartDate: addToDate(endDate, 1, "month"),
          isoEndDate: null,
        },
      ];
      const assignedTeamsPeriods = { all };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(false);
    });
  });
  const viewAllOrganisationData = false;
  const selectedTeamsObjectWithOwnPeriod: Partial<Record<TeamId, typeof period>> = {
    TEAM_ID_A: period,
    TEAM_ID_B: period,
  };
  test("person has no assigned team", () => {
    const assignedTeamsPeriods = { all: [] };
    expect(
      filterPersonByAssignedTeamDuringQueryPeriod({
        viewAllOrganisationData,
        selectedTeamsObjectWithOwnPeriod,
        assignedTeamsPeriods,
        isoEndDate: period.isoEndDate,
        isoStartDate: period.isoStartDate,
      })
    ).toBe(false);
  });

  describe("case: assigned team period is accross the start date of the selected period IS included", () => {
    test("person didn't change assigned team since creation", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoStartDate, -6, "month"),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(true);
    });

    test("person removed one assigned team since creation", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoStartDate, -6, "month"),
            isoEndDate: addToDate(period.isoStartDate, 7, "month"),
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: addToDate(period.isoStartDate, 7, "month"),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(true);
    });

    test("person added one assigned team since creation", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoStartDate, -6, "month"),
            isoEndDate: null,
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: addToDate(period.isoStartDate, 7, "month"),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(true);
    });
    test("person removed one assigned team since creation and put it back", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoStartDate, -6, "month"),
            isoEndDate: addToDate(period.isoStartDate, -3, "month"),
          },
          {
            isoStartDate: addToDate(period.isoStartDate, -1, "month"),
            isoEndDate: null,
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: addToDate(period.isoStartDate, -3, "month"),
            isoEndDate: addToDate(period.isoStartDate, -1, "month"),
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(true);
    });
  });
  describe("case: assigned team period is accross the end date of the selected period IS included", () => {
    test("person creation is after the start date of the selected period and no change since then", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoEndDate, -6, "month"),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(true);
    });

    test("person creation is after the start date of the selected period and team is removed after end date", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoEndDate, -6, "month"),
            isoEndDate: addToDate(period.isoEndDate, 7, "month"),
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: addToDate(period.isoEndDate, 7, "month"),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(true);
    });
    test("person removed one assigned team since creation and put it back", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoEndDate, -6, "month"),
            isoEndDate: addToDate(period.isoEndDate, -3, "month"),
          },
          {
            isoStartDate: addToDate(period.isoEndDate, -1, "month"),
            isoEndDate: null,
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: addToDate(period.isoEndDate, -3, "month"),
            isoEndDate: addToDate(period.isoEndDate, -1, "month"),
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(true);
    });
  });
  describe("case: assigned team period is included in the selected period IS included", () => {
    test("person creation is after the start date of the selected period and assigned team ends before the end of the period", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoStartDate, 1, "month"),
            isoEndDate: addToDate(period.isoEndDate, -1, "month"),
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: addToDate(period.isoEndDate, -1, "month"),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(true);
    });
    test("person creation is after the start date of the selected period and assigned team ends before the end of the period but restarts after again", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoStartDate, 1, "month"),
            isoEndDate: addToDate(period.isoEndDate, -1, "month"),
          },
          {
            isoStartDate: addToDate(period.isoEndDate, 1, "month"),
            isoEndDate: null,
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: addToDate(period.isoEndDate, -1, "month"),
            isoEndDate: addToDate(period.isoEndDate, 1, "month"),
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(true);
    });

    test("person creation is before the start date of the selected period and assigned team ends before the start of the period but restarts again after the start of the period and ends before the end of the period", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoStartDate, -2, "month"),
            isoEndDate: addToDate(period.isoStartDate, -1, "month"),
          },
          {
            isoStartDate: addToDate(period.isoStartDate, 2, "month"),
            isoEndDate: addToDate(period.isoStartDate, 3, "month"),
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: addToDate(period.isoStartDate, -1, "month"),
            isoEndDate: addToDate(period.isoStartDate, 2, "month"),
          },
          {
            isoStartDate: addToDate(period.isoStartDate, 3, "month"),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(true);
    });
  });
  describe("selected period is included in the assigned team period IS included", () => {
    test("person removed one assigned team since creation after the end of the selected period", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoStartDate, -6, "month"),
            isoEndDate: addToDate(period.isoEndDate, 7, "month"),
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: addToDate(period.isoEndDate, 7, "month"),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(true);
    });
    test("person creation is before the start date of the selected period and assigned team ends before the start of the period but restarts again before the start of the period and ends after the end of the period", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoStartDate, -3, "month"),
            isoEndDate: addToDate(period.isoStartDate, -2, "month"),
          },
          {
            isoStartDate: addToDate(period.isoStartDate, -1, "month"),
            isoEndDate: addToDate(period.isoStartDate, 3, "month"),
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: addToDate(period.isoStartDate, -2, "month"),
            isoEndDate: addToDate(period.isoStartDate, -1, "month"),
          },
          {
            isoStartDate: addToDate(period.isoStartDate, 3, "month"),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(true);
    });
  });
  describe("period doesn't matter (isoStartDate === null and isoEndDate === null) and assigned team has been included in history IS included", () => {
    const selectedTeamsObjectWithOwnPeriodEmpty: Partial<Record<TeamId, typeof period>> = {
      TEAM_ID_A: { isoStartDate: null, isoEndDate: null },
    };
    test("person's creation is after the end of the selected period", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: dayjs().add(20, "year").toISOString(),
            isoEndDate: dayjs().add(21, "year").toISOString(),
          },
        ],
        TEAM_ID_B: [
          {
            isoStartDate: dayjs().add(21, "year").toISOString(),
            isoEndDate: dayjs().add(22, "year").toISOString(),
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: dayjs().add(22, "year").toISOString(),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod: selectedTeamsObjectWithOwnPeriodEmpty,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(true);
    });
  });
  describe("assigned team period is before the start date of the selected period IS NOT included", () => {
    test("person removed one assigned team since creation before the start of the selected period", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoStartDate, -6, "month"),
            isoEndDate: addToDate(period.isoStartDate, -3, "month"),
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: addToDate(period.isoStartDate, -3, "month"),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(false);
    });

    test("person removed one assigned team since creation before the start of the selected period and put it back after the end of the period", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoStartDate, -6, "month"),
            isoEndDate: addToDate(period.isoStartDate, -3, "month"),
          },
          {
            isoStartDate: addToDate(period.isoEndDate, 6, "month"),
            isoEndDate: null,
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: addToDate(period.isoStartDate, -3, "month"),
            isoEndDate: addToDate(period.isoEndDate, 6, "month"),
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(false);
    });
  });
  describe("assigned team period is after the end date of the selected period IS NOT included", () => {
    test("person's creation is after the end of the selected period", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoEndDate, 3, "month"),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(false);
    });
    test("person's removed one assigned team since creation before the start of the selected period", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoEndDate, 3, "month"),
            isoEndDate: addToDate(period.isoEndDate, 4, "month"),
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: addToDate(period.isoStartDate, -6, "month"),
            isoEndDate: addToDate(period.isoEndDate, 3, "month"),
          },
          {
            isoStartDate: addToDate(period.isoEndDate, 4, "month"),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(false);
    });
  });
  describe("no assigned team period is found in the selected period IS NOT included", () => {
    const selectedTeamsObjectWithOwnPeriodEmpty: Partial<Record<TeamId, typeof period>> = {};
    test("person's creation is after the end of the selected period", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_A: [
          {
            isoStartDate: addToDate(period.isoStartDate, 3, "month"),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod: selectedTeamsObjectWithOwnPeriodEmpty,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(false);
    });
  });
  describe("period doesn't matter (isoStartDate === null and isoEndDate === null) and assigned team has NOT been included in history IS NOT included", () => {
    const selectedTeamsObjectWithOwnPeriodEmpty: Partial<Record<TeamId, typeof period>> = {
      TEAM_ID_A: { isoStartDate: null, isoEndDate: null },
    };
    test("person's creation is after the end of the selected period", () => {
      const assignedTeamsPeriods = {
        TEAM_ID_B: [
          {
            isoStartDate: dayjs().add(21, "year").toISOString(),
            isoEndDate: dayjs().add(22, "year").toISOString(),
          },
        ],
        TEAM_ID_C: [
          {
            isoStartDate: dayjs().add(22, "year").toISOString(),
            isoEndDate: null,
          },
        ],
      };
      expect(
        filterPersonByAssignedTeamDuringQueryPeriod({
          viewAllOrganisationData,
          selectedTeamsObjectWithOwnPeriod: selectedTeamsObjectWithOwnPeriodEmpty,
          assignedTeamsPeriods,
          isoEndDate: period.isoEndDate,
          isoStartDate: period.isoStartDate,
        })
      ).toBe(false);
    });
  });
  describe("filter filterByStartFollowBySelectedTeamDuringPeriod", () => {
    describe("viewAllOrganisationData is true", () => {
      test("if person start to be followed within the period, it should be included", () => {
        const assignedTeamsPeriods = {
          all: [
            {
              isoStartDate: addToDate(startDate, 1, "month"),
              isoEndDate: dayjs().add(22, "year").toISOString(),
            },
          ],
        };
        expect(
          filterPersonByAssignedTeamDuringQueryPeriod({
            viewAllOrganisationData: true,
            selectedTeamsObjectWithOwnPeriod: {},
            assignedTeamsPeriods,
            isoEndDate: period.isoEndDate,
            isoStartDate: period.isoStartDate,
            filterByStartFollowBySelectedTeamDuringPeriod: [{ field: "startFollowBySelectedTeamDuringPeriod", value: "Oui", type: "boolean" }],
          })
        ).toBe(true);
      });
      test("if person start to be followed before the period, it should NOT be included", () => {
        const assignedTeamsPeriods = {
          all: [
            {
              isoStartDate: addToDate(startDate, -1, "month"),
              isoEndDate: dayjs().add(22, "year").toISOString(),
            },
          ],
        };
        expect(
          filterPersonByAssignedTeamDuringQueryPeriod({
            viewAllOrganisationData: true,
            selectedTeamsObjectWithOwnPeriod: {},
            assignedTeamsPeriods,
            isoEndDate: period.isoEndDate,
            isoStartDate: period.isoStartDate,
            filterByStartFollowBySelectedTeamDuringPeriod: [{ field: "startFollowBySelectedTeamDuringPeriod", value: "Oui", type: "boolean" }],
          })
        ).toBe(false);
      });

      test("if person start to be followed after the period, it should NOT be included", () => {
        const assignedTeamsPeriods = {
          all: [
            {
              isoStartDate: addToDate(endDate, 1, "month"),
              isoEndDate: dayjs().add(22, "year").toISOString(),
            },
          ],
        };
        expect(
          filterPersonByAssignedTeamDuringQueryPeriod({
            viewAllOrganisationData: true,
            selectedTeamsObjectWithOwnPeriod: {},
            assignedTeamsPeriods,
            isoEndDate: period.isoEndDate,
            isoStartDate: period.isoStartDate,
            filterByStartFollowBySelectedTeamDuringPeriod: [{ field: "startFollowBySelectedTeamDuringPeriod", value: "Oui", type: "boolean" }],
          })
        ).toBe(false);
      });
    });
    describe("viewAllOrganisationData is false", () => {
      const selectedTeamsObjectWithOwnPeriod: Partial<Record<TeamId, typeof period>> = {
        TEAM_ID_A: period,
      };
      test("if person start to be followed within the period, it should be included", () => {
        const assignedTeamsPeriods = {
          TEAM_ID_A: [
            {
              isoStartDate: addToDate(startDate, 1, "month"),
              isoEndDate: dayjs().add(22, "year").toISOString(),
            },
          ],
        };
        expect(
          filterPersonByAssignedTeamDuringQueryPeriod({
            viewAllOrganisationData: false,
            selectedTeamsObjectWithOwnPeriod,
            assignedTeamsPeriods,
            isoEndDate: period.isoEndDate,
            isoStartDate: period.isoStartDate,
            filterByStartFollowBySelectedTeamDuringPeriod: [{ field: "startFollowBySelectedTeamDuringPeriod", value: "Oui", type: "boolean" }],
          })
        ).toBe(true);
      });
      test("if person start to be followed before the period, it should NOT be included", () => {
        const assignedTeamsPeriods = {
          TEAM_ID_A: [
            {
              isoStartDate: addToDate(startDate, -1, "month"),
              isoEndDate: dayjs().add(22, "year").toISOString(),
            },
          ],
        };
        expect(
          filterPersonByAssignedTeamDuringQueryPeriod({
            viewAllOrganisationData: false,
            selectedTeamsObjectWithOwnPeriod,
            assignedTeamsPeriods,
            isoEndDate: period.isoEndDate,
            isoStartDate: period.isoStartDate,
            filterByStartFollowBySelectedTeamDuringPeriod: [{ field: "startFollowBySelectedTeamDuringPeriod", value: "Oui", type: "boolean" }],
          })
        ).toBe(false);
      });

      test("if person start to be followed after the period, it should NOT be included", () => {
        const assignedTeamsPeriods = {
          TEAM_ID_A: [
            {
              isoStartDate: addToDate(endDate, 1, "month"),
              isoEndDate: dayjs().add(22, "year").toISOString(),
            },
          ],
        };
        expect(
          filterPersonByAssignedTeamDuringQueryPeriod({
            viewAllOrganisationData: false,
            selectedTeamsObjectWithOwnPeriod,
            assignedTeamsPeriods,
            isoEndDate: period.isoEndDate,
            isoStartDate: period.isoStartDate,
            filterByStartFollowBySelectedTeamDuringPeriod: [{ field: "startFollowBySelectedTeamDuringPeriod", value: "Oui", type: "boolean" }],
          })
        ).toBe(false);
      });
    });
  });
});
