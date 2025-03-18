import type { FileStats, Statistics, TraceEvent } from "./types.ts";

/**
 * Analyze trace data and generate statistics
 */
export function analyzeTrace(events: TraceEvent[]): Statistics {
  // Initial statistics structure
  const stats: Statistics = {
    totalTime: 0,
    totalFiles: 0,
    operationTimes: {},
    categoryTimes: {},
    slowestFiles: [],
    filesByType: {},
    moduleResolution: {
      totalTime: 0,
      totalCount: 0,
      averageTime: 0,
    },
  };

  // Track begin events by their name and file path for matching with end events
  const beginEvents: Record<string, Record<string, TraceEvent>> = {};

  // Track all unique files
  const uniqueFiles = new Set<string>();

  // Track time spent on each file
  const fileTimings: Record<string, FileStats> = {};

  // Process events
  for (const event of events) {
    // Skip metadata events
    if (event.ph === "M") continue;

    // Handle complete events (ph="X") which include duration
    if (event.ph === "X" && event.dur !== undefined) {
      // Get operation name
      const operation = event.name;

      // Increment operation stats
      if (!stats.operationTimes[operation]) {
        stats.operationTimes[operation] = {
          totalTime: 0,
          count: 0,
          averageTime: 0,
        };
      }
      stats.operationTimes[operation].totalTime += event.dur;
      stats.operationTimes[operation].count++;

      // Increment category stats
      if (!stats.categoryTimes[event.cat]) {
        stats.categoryTimes[event.cat] = {
          totalTime: 0,
          count: 0,
          averageTime: 0,
        };
      }
      stats.categoryTimes[event.cat].totalTime += event.dur;
      stats.categoryTimes[event.cat].count++;

      // Track module resolution specifically
      if (operation === "resolveModuleNamesWorker") {
        stats.moduleResolution.totalTime += event.dur;
        stats.moduleResolution.totalCount++;
      }

      // Track file specific timing
      const filePath = getFilePath(event);
      if (filePath) {
        uniqueFiles.add(filePath);

        if (!fileTimings[filePath]) {
          fileTimings[filePath] = {
            path: filePath,
            totalTime: 0,
            operations: {},
          };
        }

        fileTimings[filePath].totalTime += event.dur;

        if (!fileTimings[filePath].operations[operation]) {
          fileTimings[filePath].operations[operation] = 0;
        }
        fileTimings[filePath].operations[operation] += event.dur;

        // Track file types
        const ext = getFileExtension(filePath);
        if (!stats.filesByType[ext]) {
          stats.filesByType[ext] = 0;
        }
        stats.filesByType[ext]++;
      }
    } // Handle begin events (ph="B")
    else if (event.ph === "B") {
      const filePath = getFilePath(event);
      const key = `${event.name}:${filePath || "unknown"}`;

      if (!beginEvents[key]) {
        beginEvents[key] = {};
      }

      // Use the timestamp as a unique identifier for this specific begin event
      const timeKey = event.ts.toString();
      beginEvents[key][timeKey] = event;
    } // Handle end events (ph="E")
    else if (event.ph === "E") {
      const filePath = getFilePath(event);
      const key = `${event.name}:${filePath || "unknown"}`;

      // Find the matching begin event
      if (beginEvents[key]) {
        // Get the most recent begin event
        const timeKeys = Object.keys(beginEvents[key]).sort();
        if (timeKeys.length > 0) {
          const timeKey = timeKeys[0]; // Get the earliest begin event
          const beginEvent = beginEvents[key][timeKey];

          // Calculate duration
          const duration = event.ts - beginEvent.ts;

          // Update operation stats
          const operation = event.name;
          if (!stats.operationTimes[operation]) {
            stats.operationTimes[operation] = {
              totalTime: 0,
              count: 0,
              averageTime: 0,
            };
          }
          stats.operationTimes[operation].totalTime += duration;
          stats.operationTimes[operation].count++;

          // Update category stats
          if (!stats.categoryTimes[event.cat]) {
            stats.categoryTimes[event.cat] = {
              totalTime: 0,
              count: 0,
              averageTime: 0,
            };
          }
          stats.categoryTimes[event.cat].totalTime += duration;
          stats.categoryTimes[event.cat].count++;

          // Track file specific timing
          if (filePath) {
            uniqueFiles.add(filePath);

            if (!fileTimings[filePath]) {
              fileTimings[filePath] = {
                path: filePath,
                totalTime: 0,
                operations: {},
              };
            }

            fileTimings[filePath].totalTime += duration;

            if (!fileTimings[filePath].operations[operation]) {
              fileTimings[filePath].operations[operation] = 0;
            }
            fileTimings[filePath].operations[operation] += duration;

            // Track file types
            const ext = getFileExtension(filePath);
            if (!stats.filesByType[ext]) {
              stats.filesByType[ext] = 0;
            }
            stats.filesByType[ext]++;
          }

          // Remove the begin event so we don't match it again
          delete beginEvents[key][timeKey];
        }
      }
    }
  }

  // Calculate average time for all operations
  for (const op in stats.operationTimes) {
    const operation = stats.operationTimes[op];
    operation.averageTime = operation.totalTime / operation.count;
  }

  // Calculate average time for all categories
  for (const cat in stats.categoryTimes) {
    const category = stats.categoryTimes[cat];
    category.averageTime = category.totalTime / category.count;
  }

  // Calculate average time for module resolution
  if (stats.moduleResolution.totalCount > 0) {
    stats.moduleResolution.averageTime = stats.moduleResolution.totalTime /
      stats.moduleResolution.totalCount;
  }

  // Determine total build time (max timestamp - min timestamp)
  const timestamps = events
    .filter((e) => e.ph !== "M") // Skip metadata events
    .map((e) => e.ph === "E" ? e.ts : e.ts + (e.dur || 0));

  if (timestamps.length > 0) {
    stats.totalTime = Math.max(...timestamps) -
      Math.min(...events.map((e) => e.ts));
  }

  // Set total files count
  stats.totalFiles = uniqueFiles.size;

  // Get the slowest files (top 10)
  stats.slowestFiles = Object.values(fileTimings)
    .sort((a, b) => b.totalTime - a.totalTime)
    .slice(0, 10);

  return stats;
}

/**
 * Extract file extension from a file path
 */
function getFileExtension(filePath: string): string {
  const match = filePath.match(/\.([^\.]+)$/);
  return match ? match[1] : "unknown";
}

/**
 * Get the file path from a trace event
 */
function getFilePath(event: TraceEvent): string | null {
  return event.args.path || event.args.fileName || null;
}
