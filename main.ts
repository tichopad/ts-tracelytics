#!/usr/bin/env deno

import { parseArgs } from "@std/cli";
import { resolve } from "@std/path";
import { analyzeTrace } from "./analyzer.ts";
import { printTerminalStats } from "./print-stats.ts";
import type { TraceEvent } from "./types.ts";

/** CLI arguments type */
interface Args {
  output: string;
  help: boolean;
  _: (string | number)[];
}

// Parse command line arguments
const cliArgs = parseArgs(Deno.args, {
  string: ["output"],
  boolean: ["help"],
  alias: {
    h: "help",
    o: "output",
  },
  default: {
    output: "cli",
    help: false,
  },
}) as Args;

// Show help
if (cliArgs.help) {
  console.log("TypeScript Build Trace Analyzer");
  console.log("");
  console.log("Usage:");
  console.log(
    "  ts-tracelytics [input-file-path]     Analyze TypeScript trace file",
  );
  console.log("  ts-tracelytics --help               Show this help message");
  console.log(
    "  ts-tracelytics --output <format>    Specify output format (json|cli)",
  );
  console.log("");
  console.log("Examples:");
  console.log("  ts-tracelytics ~/project/trace.json");
  console.log(
    "  ts-tracelytics ~/project/trace.json --output json > stats.json",
  );
  console.log("  ts-tracelytics ~/project/trace.json --output cli");
  Deno.exit(0);
}

// Validate input file
if (cliArgs._.length !== 1) {
  console.error("Error: Please provide exactly one input trace file path");
  console.error("Use --help for usage information");
  Deno.exit(1);
}

// Validate output format
if (cliArgs.output && !["json", "cli"].includes(cliArgs.output)) {
  console.error("Error: Output format must be either 'json' or 'cli'");
  console.error("Use --help for usage information");
  Deno.exit(1);
}

// Do the thing!
async function main() {
  try {
    const inputPath = resolve(String(cliArgs._[0]));

    verboseLog(`Reading trace file: ${inputPath}`);
    const traceContent = await Deno.readTextFile(inputPath);
    const traceData = JSON.parse(traceContent) as TraceEvent[];

    verboseLog("Analyzing trace data...");
    const statistics = analyzeTrace(traceData);

    // Output based on format
    if (cliArgs.output === "json") {
      console.log(JSON.stringify(statistics, null, 2));
    } else {
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

/**
 * Print out information to the terminal if the output mode allows it
 */
function verboseLog(...args: unknown[]) {
  // Don't log stuff in JSON mode to avoid malforming the output
  if (cliArgs.output === "cli") {
    console.log(...args);
  }
}
