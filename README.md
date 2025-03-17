# ts-tracelytics

A Deno CLI tool to analyze TypeScript build trace files and identify performance
bottlenecks.

## Features

- Parse TypeScript build trace files (generated with `--generateTrace` flag)
- Calculate total time spent in each compilation phase
- Identify files and modules that took the longest to process
- Count the total number of files processed
- Output statistics in JSON format or as colorful terminal output

## Installation

This is a Deno application, so you need to have
[Deno installed](https://deno.land/manual/getting_started/installation) on your
system.

No additional installation steps are required; you can run the application
directly with Deno.

## Usage

### Generate a TypeScript Build Trace

First, you need to generate a trace file from your TypeScript build:

```bash
npx tsc --generateTrace trace_output_dir
```

This will create a `trace.json` file in the specified directory.

### Analyze the Trace

Then, use ts-tracelytics to analyze the trace:

```bash
# Output to terminal (colorful, formatted output)
deno run main.ts --input=path/to/trace.json

# Output to JSON file
deno run main.ts --input=path/to/trace.json --output=./output
```

Or use the predefined tasks:

```bash
# Display in terminal
deno task analyze --input=path/to/trace.json

# Save to JSON file
deno task analyze --input=path/to/trace.json --output=./output
```

### Options

- `--input`, `-i`: Path to the TypeScript trace file (required)
- `--output`, `-o`: Directory to output statistics file (optional, if not
  provided, prints to console)
- `--help`, `-h`: Show help information

## Example

Analyze the example trace file and display in terminal:

```bash
deno task analyze:example
```

This will analyze the example trace file in `example_data/trace.json` and
either:

- Print a formatted analysis to the terminal (default)
- Output the statistics to `./output/trace_stats.json` if the `--output` flag is
  provided

## Output

### Terminal Output (Default)

When no `--output` flag is specified, the tool displays a colorful, formatted
analysis in the terminal, including:

- Overall build statistics
- Top 5 slowest operations with timing details
- Top 5 slowest files with their primary operations
- File type distribution
- Module resolution statistics

This format is designed for quick analysis and diagnosis of build performance
issues.

### JSON Output

When the `--output` flag is specified, the tool generates a JSON file with
detailed statistics:

- Total build time
- Time spent on each operation type (createProgram, createSourceFile, etc.)
- Time spent in each category (parse, program, bind, etc.)
- List of the 10 slowest files with detailed timing information
- File type statistics
- Module resolution statistics
- Total number of files processed

This format is suitable for further processing or integration with other tools.

## Development

### Available tasks

- `deno task dev`: Run the application in watch mode
- `deno task analyze`: Run the application
- `deno task analyze:example`: Analyze the example trace file
- `deno task test`: Run tests
- `deno task check`: Type-check the code

## License

MIT
