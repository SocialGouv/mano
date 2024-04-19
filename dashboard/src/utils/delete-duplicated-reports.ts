import type { ReportInstance } from "../types/report";

export function keepOnlyOneReportAndReturnReportToDelete(duplicatedReports: Array<ReportInstance>): Array<ReportInstance> {
  // keep only the one with the description OR collaborations
  // if both with description/collaboratinos, keep the last updated
  const reportsToDelete = [];
  let reportToKeep = null;
  let reportToKeepHasDescription = false;
  let reportToKeepHasCollaborations = false;
  for (const report of duplicatedReports) {
    if (!reportToKeep) {
      // init
      reportToKeep = report;
      reportToKeepHasDescription = report.description?.length > 0;
      reportToKeepHasCollaborations = report.collaborations?.length > 0;
      continue;
    }

    const hasDescription = report.description?.length > 0;
    const hasCollaborations = report.collaborations?.length > 0;

    // keep only the one with the description OR collaborations
    // if both with description/collaboratinos, keep the last updated
    if (hasDescription || hasCollaborations) {
      if (reportToKeepHasDescription || reportToKeepHasCollaborations) {
        if (report.updatedAt > reportToKeep.updatedAt) {
          reportsToDelete.push(reportToKeep);
          reportToKeep = report;
          reportToKeepHasDescription = true;
          reportToKeepHasCollaborations = false;
        } else {
          reportsToDelete.push(report);
        }
      }
      continue;
    }

    if (reportToKeepHasDescription || reportToKeepHasCollaborations) {
      reportsToDelete.push(report);
      continue;
    }

    // keep the last updated
    if (report.updatedAt > reportToKeep.updatedAt) {
      reportsToDelete.push(reportToKeep);
      reportToKeep = report;
    } else {
      reportsToDelete.push(report);
    }
  }
  return reportsToDelete;
}
