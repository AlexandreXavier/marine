import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Remove o histórico de posições com mais de 48h.
crons.interval(
  "purge-old-positions",
  { hours: 1 },
  internal.positions.deleteOld,
  {},
);

export default crons;
