#!/usr/bin/env deno

import { parseArgs } from "@std/cli";
import { ensureDir } from "@std/fs/ensure-dir";
import { basename, resolve } from "@std/path";
import { bold, cyan, green, yellow, red, magenta, blue, gray, reset } from "@std/fmt/colors";
import { format } from "@std/fmt/duration";
import { analyzeTrace } from "./analyzer.ts";
import { type Statistics, type TraceEvent } from "./types.ts";

interface Args {
  input?: string;
  output?: string;
  help?: boolean;
  h?: boolean;
  _: (string | number)[];
}

// Parse command line arguments
const args = parseArgs(Deno.args, {
  string: ["input", "output"],
  alias: {
    i: "input",
    o: "output",
    h: "help",
  },
}) as Args;

// Show help
if (args.help || args.h) {
  console.log("TypeScript Build Trace Analyzer");
  console.log("");
  console.log("Usage:");
  console.log(
    "  deno run main.ts --input=<trace_file> [--output=<output_directory>]",
  );
  console.log("");
  console.log("Options:");
  console.log("  --input, -i    Path to the TypeScript trace file (required)");
  console.log(
    "  --output, -o   Directory to output statistics file (default: prints to console)",
  );
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
  const ms = microseconds / 1000;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const remainingMs = Math.floor(ms % 1000);

  const parts: string[] = [];
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (remainingSeconds > 0 || minutes > 0) {
    parts.push(`${remainingSeconds}s`);
  }
  if (remainingMs > 0 || parts.length === 0) {
    parts.push(`${remainingMs}ms`);
  }

  return parts.join(" ");
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
      output += `${paddedKey}: ${color(value)}${reset("")}\n`;
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
  // Title
  console.log(
    `\n${bold("")}${cyan("TypeScript Build Trace Analysis")}${reset("")}\n`,
  );

  // Overall statistics
  const overallStats: Record<string, { value: string; color?: (str: string) => string }> = {
    "Total build time": {
      value: formatDuration(stats.totalTime),
      color: green,
    },
    "Total files processed": {
      value: stats.totalFiles.toString(),
      color: blue,
    },
    "Total unique operations": {
      value: Object.keys(stats.operationTimes).length.toString(),
      color: magenta,
    },
  };

  console.log(formatTable(overallStats, "Overall Statistics"));

  // Top 5 slowest operations
  console.log(`\n${bold("")}Top 5 Slowest Operations${reset("")}`);
  console.log("=======================");

  const sortedOperations = Object.entries(stats.operationTimes)
    .sort(([, a], [, b]) => b.totalTime - a.totalTime)
    .slice(0, 5);

  for (const [operation, stats] of sortedOperations) {
    console.log(`${yellow(operation)}${reset("")}`);
    console.log(`  Total time: ${formatDuration(stats.totalTime)}`);
    console.log(`  Count: ${stats.count}`);
    console.log(`  Average time: ${formatDuration(stats.averageTime)}`);
    console.log("");
  }

  // Top 5 slowest files
  console.log(`\n${bold("")}Top 5 Slowest Files${reset("")}`);
  console.log("===================");

  for (let i = 0; i < Math.min(5, stats.slowestFiles.length); i++) {
    const file = stats.slowestFiles[i];
    const filename = file.path.split("/").pop() || file.path;
    console.log(
      `${i + 1}. ${red(filename)}${reset("")} (${
        formatDuration(file.totalTime)
      })`,
    );
    console.log(`   ${gray(file.path)}${reset("")}`);

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
    console.log(`\n${bold("")}File Types${reset("")}`);
    console.log("==========");

    for (const [ext, count] of fileTypes) {
      console.log(`${blue("." + ext)}${reset("")}: ${count} files`);
    }
  }

  // Module resolution
  if (stats.moduleResolution.totalCount > 0) {
    const moduleStats: Record<string, { value: string; color?: (str: string) => string }> = {
      "Total modules resolved": {
        value: stats.moduleResolution.totalCount.toString(),
        color: cyan,
      },
      "Total resolution time": {
        value: formatDuration(stats.moduleResolution.totalTime),
        color: yellow,
      },
      "Average resolution time": {
        value: formatDuration(stats.moduleResolution.averageTime),
        color: green,
      },
    };

    console.log(formatTable(moduleStats, "Module Resolution"));
  }

  console.log(
    `\n${gray("Note: All times are in microseconds (µs) unless otherwise specified")}${reset("")}\n`,
  );
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
        JSON.stringify(statistics, null, 2),
      );

      console.log(`Statistics written to: ${outputPath}`);
    } else {
      // Print statistics to terminal in a readable format
      printTerminalStats(statistics);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(`Error: ${String(error)}`);
    }
    Deno.exit(1);
  }
}

await main();
