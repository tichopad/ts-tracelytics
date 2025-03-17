#!/usr/bin/env deno

import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";
import { resolve, basename } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { type TraceEvent, type Statistics, type Operation, type FileStats } from "./types.ts";
import { analyzeTrace } from "./analyzer.ts";

// Parse command line arguments
const args = parse(Deno.args, {
  string: ["input", "output"],
  default: {},
  alias: {
    i: "input",
    o: "output",
    h: "help",
  },
});

// Show help
if (args.help) {
  console.log("TypeScript Build Trace Analyzer");
  console.log("");
  console.log("Usage:");
  console.log("  deno run main.ts --input=<trace_file> [--output=<output_directory>]");
  console.log("");
  console.log("Options:");
  console.log("  --input, -i    Path to the TypeScript trace file (required)");
  console.log("  --output, -o   Directory to output statistics file (default: prints to console)");
  console.log("  --help, -h     Show this help message");
  Deno.exit(0);
}

// Check if input file is provided
if (!args.input) {
  console.error("Error: Input trace file is required");
  console.error("Use --help for usage information");
  Deno.exit(1);
}

/**
 * Format duration in microseconds to a human-readable format
 */
function formatDuration(microseconds: number): string {
  if (microseconds < 1000) {
    return `${microseconds.toFixed(2)}µs`;
  } else if (microseconds < 1000000) {
    return `${(microseconds / 1000).toFixed(2)}ms`;
  } else {
    return `${(microseconds / 1000000).toFixed(2)}s`;
  }
}

/**
 * Formats a key-value table for terminal output
 */
function formatTable(data: Record<string, { value: string; color?: string }>, title: string): string {
  const keys = Object.keys(data);
  const maxKeyLength = Math.max(...keys.map(k => k.length));

  let output = `\n${title}\n${"=".repeat(title.length)}\n`;

  for (const key of keys) {
    const { value, color } = data[key];
    const paddedKey = key.padEnd(maxKeyLength);

    if (color) {
      output += `${paddedKey}: ${color}${value}\x1b[0m\n`;
    } else {
      output += `${paddedKey}: ${value}\n`;
    }
  }

  return output;
}

/**
 * Print statistics to the terminal in a readable format
 */
function printTerminalStats(stats: Statistics): void {
  // Terminal colors
  const colors = {
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
    blue: "\x1b[34m",
    gray: "\x1b[90m",
    reset: "\x1b[0m",
    bold: "\x1b[1m",
  };

  // Title
  console.log(`\n${colors.bold}${colors.cyan}TypeScript Build Trace Analysis${colors.reset}\n`);

  // Overall statistics
  const overallStats: Record<string, { value: string; color?: string }> = {
    "Total build time": {
      value: formatDuration(stats.totalTime),
      color: colors.green
    },
    "Total files processed": {
      value: stats.totalFiles.toString(),
      color: colors.blue
    },
    "Total unique operations": {
      value: Object.keys(stats.operationTimes).length.toString(),
      color: colors.magenta
    }
  };

  console.log(formatTable(overallStats, "Overall Statistics"));

  // Top 5 slowest operations
  console.log(`\n${colors.bold}Top 5 Slowest Operations${colors.reset}`);
  console.log("=======================");

  const sortedOperations = Object.entries(stats.operationTimes)
    .sort(([, a], [, b]) => b.totalTime - a.totalTime)
    .slice(0, 5);

  for (const [operation, stats] of sortedOperations) {
    console.log(`${colors.yellow}${operation}${colors.reset}`);
    console.log(`  Total time: ${formatDuration(stats.totalTime)}`);
    console.log(`  Count: ${stats.count}`);
    console.log(`  Average time: ${formatDuration(stats.averageTime)}`);
    console.log("");
  }

  // Top 5 slowest files
  console.log(`\n${colors.bold}Top 5 Slowest Files${colors.reset}`);
  console.log("===================");

  for (let i = 0; i < Math.min(5, stats.slowestFiles.length); i++) {
    const file = stats.slowestFiles[i];
    const filename = file.path.split("/").pop() || file.path;
    console.log(`${i + 1}. ${colors.red}${filename}${colors.reset} (${formatDuration(file.totalTime)})`);
    console.log(`   ${colors.gray}${file.path}${colors.reset}`);

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
    console.log(`\n${colors.bold}File Types${colors.reset}`);
    console.log("==========");

    for (const [ext, count] of fileTypes) {
      console.log(`${colors.blue}.${ext}${colors.reset}: ${count} files`);
    }
  }

  // Module resolution
  if (stats.moduleResolution.totalCount > 0) {
    const moduleStats: Record<string, { value: string; color?: string }> = {
      "Total modules resolved": {
        value: stats.moduleResolution.totalCount.toString(),
        color: colors.cyan
      },
      "Total resolution time": {
        value: formatDuration(stats.moduleResolution.totalTime),
        color: colors.yellow
      },
      "Average resolution time": {
        value: formatDuration(stats.moduleResolution.averageTime),
        color: colors.green
      }
    };

    console.log(formatTable(moduleStats, "Module Resolution"));
  }

  console.log(`\n${colors.gray}Note: All times are in microseconds (µs) unless otherwise specified${colors.reset}\n`);
}

async function main() {
  try {
    // At this point, args.input is guaranteed to be defined because of the check above
    const inputPath = resolve(args.input as string);

    console.log(`Reading trace file: ${inputPath}`);
    const traceContent = await Deno.readTextFile(inputPath);
    const traceData = JSON.parse(traceContent) as TraceEvent[];

    console.log("Analyzing trace data...");
    const statistics = analyzeTrace(traceData);

    // Check if output directory is provided
    if (args.output) {
      const outputDir = resolve(args.output);

      // Ensure output directory exists
      await ensureDir(outputDir);

      // Generate output filename based on input file
      const inputFileName = basename(inputPath).replace(/\.[^/.]+$/, "");
      const outputPath = `${outputDir}/${inputFileName}_stats.json`;

      // Write statistics to file
      await Deno.writeTextFile(
        outputPath,
        JSON.stringify(statistics, null, 2)
      );

      console.log(`Statistics written to: ${outputPath}`);
    } else {
      // Print statistics to terminal in a readable format
      printTerminalStats(statistics);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    Deno.exit(1);
  }
}

await main();
