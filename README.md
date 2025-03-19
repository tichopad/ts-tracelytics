# ts-tracelytics

A Deno CLI tool to analyze Typescript build trace files and identify performance
bottlenecks.

## Features

- Parse Typescript (`tsc`) build trace files (generated with `--generateTrace` flag)
- Calculate build time metrics across various compilation phases
- Identify slowest operations, files, and module resolutions
- Categorize files by type and track processing statistics
- Output data as colorful terminal output or structured JSON

## Motivation

If you need a way to easily get basic statistics about your Typescript builds, this is the thing.
I'd also recommend checking out the official [`@typescript/analyze-trace` tool](https://www.npmjs.com/package/@typescript/analyze-trace).

## Installation

This is a Deno application, so you need to have
[Deno installed](https://deno.land/manual/getting_started/installation) on your
system.

To use ts-tracelytics directly:

```bash
# Run directly with Deno
deno run jsr:@tichopad/ts-tracelytics your-trace.json --output json > stats.json
```

Alternatively, clone the repository and compile:

```bash
git clone https://github.com/tichopad/ts-tracelytics.git
cd ts-tracelytics
deno task compile
./build/ts-tracelytics your-trace.json
```

## Usage

### Generate a TypeScript Build Trace

First, generate a trace file from your TypeScript build:

```bash
tsc --generateTrace trace_output_dir
```

This creates a `trace.json` file in the specified directory.

### Analyze the Trace

Analyze your trace file:

```bash
# Output to terminal (human-readable format)
deno run jsr:@tichopad/ts-tracelytics trace.json

# Output as JSON
deno run jsr:@tichopad/ts-tracelytics trace.json --output json > stats.json
```

### Command Line Options

- Input file path: First positional argument (required)
- `--output`, `-o`: Output format (`json` or `cli`, default: `cli`)
- `--help`, `-h`: Show help information

## Output Examples

### Terminal Output (Default)

The default terminal output provides a formatted analysis including:

- Overall build statistics (total time, files processed)
- Top 5 slowest operations with timing details
- Top 5 slowest files with their primary operations
- File type distribution
- Module resolution statistics

Example:
```
TypeScript Build Trace Analysis

Overall Statistics
=================
Total build time: 2s 345ms
Total files processed: 128
Total unique operations: 15

Top 5 Slowest Operations
=======================
createProgram
  Total time: 1s 234ms
  Count: 1
  Average time: 1s 234ms

typeCheck
  Total time: 563ms
  Count: 128
  Average time: 4.4ms

...
```

### JSON Output

When using `--output json`, the tool generates corresponding statistics as structured JSON:

```json
{
  "totalTime": 2345678,
  "totalFiles": 128,
  "operationTimes": {
    "createProgram": {
      "totalTime": 1234567,
      "count": 1,
      "averageTime": 1234567
    },
    "typeCheck": {
      "totalTime": 563200,
      "count": 128,
      "averageTime": 4400
    },
    ...
  },
  "categoryTimes": { ... },
  "slowestFiles": [ ... ],
  "filesByType": { ... },
  "moduleResolution": { ... }
}
```

## License

MIT
