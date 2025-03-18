import * as colors from "@std/fmt/colors";
import { format } from "@std/fmt/duration";
import type { Statistics } from "./types.ts";

/**
 * Print statistics to the terminal in a readable format
 */
export function printTerminalStats(stats: Statistics): void {
  // Title
  console.log(
    `\n${colors.bold("")}${colors.cyan("TypeScript Build Trace Analysis")}${
      colors.reset("")
    }\n`,
  );

  // Overall statistics
  const overallStats: Record<
    string,
    { value: string; color?: (str: string) => string }
  > = {
    "Total build time": {
      value: formatDuration(stats.totalTime),
      color: colors.green,
    },
    "Total files processed": {
      value: stats.totalFiles.toString(),
      color: colors.blue,
    },
    "Total unique operations": {
      value: Object.keys(stats.operationTimes).length.toString(),
      color: colors.magenta,
    },
  };

  console.log(formatTable(overallStats, "Overall Statistics"));

  // Top 5 slowest operations
  console.log(
    `\n${colors.bold("")}Top 5 Slowest Operations${colors.reset("")}`,
  );
  console.log("=======================");

  const sortedOperations = Object.entries(stats.operationTimes)
    .sort(([, a], [, b]) => b.totalTime - a.totalTime)
    .slice(0, 5);

  for (const [operation, stats] of sortedOperations) {
    console.log(`${colors.yellow(operation)}${colors.reset("")}`);
    console.log(`  Total time: ${formatDuration(stats.totalTime)}`);
    console.log(`  Count: ${stats.count}`);
    console.log(`  Average time: ${formatDuration(stats.averageTime)}`);
    console.log("");
  }

  // Top 5 slowest files
  console.log(`\n${colors.bold("")}Top 5 Slowest Files${colors.reset("")}`);
  console.log("===================");

  for (let i = 0; i < Math.min(5, stats.slowestFiles.length); i++) {
    const file = stats.slowestFiles[i];
    const filename = file.path.split("/").pop() || file.path;
    console.log(
      `${i + 1}. ${colors.red(filename)}${colors.reset("")} (${
        formatDuration(file.totalTime)
      })`,
    );
    console.log(`   ${colors.gray(file.path)}${colors.reset("")}`);

    // Top 3 operations for this file
    const fileOps = Object.entries(file.operations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (fileOps.length > 0) {
      console.log("   Top operations:");
      for (const [op, time] of fileOps) {
        console.log(`     - ${op}: ${formatDuration(time)}`);
      }
    }
    console.log("");
  }

  // File type statistics
  const fileTypes = Object.entries(stats.filesByType)
    .sort(([, a], [, b]) => b - a);

  if (fileTypes.length > 0) {
    console.log(`\n${colors.bold("")}File Types${colors.reset("")}`);
    console.log("==========");

    for (const [ext, count] of fileTypes) {
      console.log(
        `${colors.blue("." + ext)}${colors.reset("")}: ${count} files`,
      );
    }
  }

  // Module resolution
  if (stats.moduleResolution.totalCount > 0) {
    const moduleStats: Record<
      string,
      { value: string; color?: (str: string) => string }
    > = {
      "Total modules resolved": {
        value: stats.moduleResolution.totalCount.toString(),
        color: colors.cyan,
      },
      "Total resolution time": {
        value: formatDuration(stats.moduleResolution.totalTime),
        color: colors.yellow,
      },
      "Average resolution time": {
        value: formatDuration(stats.moduleResolution.averageTime),
        color: colors.green,
      },
    };

    console.log(formatTable(moduleStats, "Module Resolution"));
  }

  console.log(
    `\n${
      colors.gray(
        "Note: All times are approximate. Use `--output` to get detailed statistics as JSON.",
      )
    }${colors.reset("")}\n`,
  );
}

/**
 * Format duration in microseconds to a human-readable format with microsecond precision
 */
function formatDuration(microseconds: number): string {
  const millisRounded = Math.round(microseconds) / 1000;
  return format(millisRounded, {
    style: "narrow",
    ignoreZero: true,
  });
}

/**
 * Formats a key-value table for terminal output
 */
function formatTable(
  data: Record<string, { value: string; color?: (str: string) => string }>,
  title: string,
): string {
  const keys = Object.keys(data);
  const maxKeyLength = Math.max(...keys.map((k) => k.length));

  let output = `\n${title}\n${"=".repeat(title.length)}\n`;

  for (const key of keys) {
    const { value, color } = data[key];
    const paddedKey = key.padEnd(maxKeyLength);

    if (color) {
      output += `${paddedKey}: ${color(value)}${colors.reset("")}\n`;
    } else {
      output += `${paddedKey}: ${value}\n`;
    }
  }

  return output;
}
