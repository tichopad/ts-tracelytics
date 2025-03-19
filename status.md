# TypeScript Build Trace Analyzer

## Project Goal

The TypeScript Build Trace Analyzer is a Deno CLI tool designed to analyze
TypeScript compiler trace files. These trace files capture detailed information
about the TypeScript build process, including timing data for various
compilation stages like program creation, file parsing, type checking, and
module resolution.

The primary goal is to provide developers with insights into TypeScript build
performance, helping them identify bottlenecks and optimize build times. The
tool produces a comprehensive summary of build metrics either as a colorful
terminal output for quick analysis or in a structured JSON format that can be
easily consumed by other tools or visualization systems.

## Current Implementation

The project is implemented with the following components:

1. **CLI Interface**: A command-line interface that accepts a trace file path and optional output format parameter.
2. **Trace Parser**: Logic to parse and process TypeScript compiler trace events.
3. **Analyzer Engine**: Core system that processes trace events and computes meaningful statistics.
4. **Terminal Output Formatter**: Colorful, human-readable output formatting for the console.
5. **JSON Output Generator**: Structured JSON output for integration with other tools.

The analyzer extracts the following key metrics:

- **Total build time**: Overall duration of the compilation process
- **Operation timing**: Time spent on different compiler operations (createProgram, typeCheck, etc.)
- **Category timing**: Time spent in different categories (parse, program, bind)
- **File processing**: Identifies the slowest files to process with detailed stats
- **File type analysis**: Categorizes files by type and counts
- **Module resolution statistics**: Time spent resolving module imports
- **Overall counts**: Total files processed, operation counts, etc.

## Architecture

The project follows a modular architecture with these components:

### 1. Main CLI (`main.ts`)

- Parses command-line arguments using `@std/cli`
- Reads and parses the input trace file
- Orchestrates the analysis process
- Handles output format selection (terminal or JSON)
- Provides user feedback and error handling

### 2. Type Definitions (`types.ts`)

- Defines TypeScript interfaces for trace events (`TraceEvent`)
- Defines data structures for computed statistics (`Statistics`, `Operation`, `FileStats`)
- Ensures type safety throughout the application

### 3. Analyzer Engine (`analyzer.ts`)

- Contains the core analysis logic
- Processes trace events to extract meaningful statistics
- Handles both complete events (with duration) and begin/end event pairs
- Computes aggregated metrics across operations, files, and categories

### 4. Terminal Formatter (`print-stats.ts`)

- Formats statistics for human-readable terminal output
- Provides colorful output using `@std/fmt/colors`
- Creates organized sections for different types of metrics
- Formats durations in a readable way using `@std/fmt/duration`

### 5. Data Flow

```
Input Trace File → Parse JSON → Process Events (analyzer.ts) → Compute Stats → Output (Terminal/JSON)
```

## Usage

To analyze a TypeScript build trace:

```bash
# Output to terminal (human-readable format)
deno run -A main.ts path/to/trace.json

# Output as JSON
deno run -A main.ts path/to/trace.json --output json
```

You can also use the predefined tasks in deno.json:

```bash
# Analyze with terminal output
deno task analyze example_data/trace.json

# Analyze with JSON output
deno task analyze example_data/trace.json --output json
```

## Future Enhancements

Potential improvements for future development:

1. **HTML Report Generation**: Create visual reports with charts and graphs for better insights
2. **Trace Comparison**: Compare multiple trace files to track performance changes over time
3. **Optimization Recommendations**: Provide specific suggestions to improve build performance
4. **Codebase Analysis Integration**: Connect trace data with codebase structure analysis
5. **CI/CD Integration**: Automate build performance monitoring in continuous integration pipelines
6. **Support for Project References**: Analyze performance of TypeScript project references
7. **Live Monitoring**: Real-time processing of trace data during compilation
