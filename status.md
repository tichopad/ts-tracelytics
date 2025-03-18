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

## Current Progress

The project has been implemented with the following components:

1. **CLI Interface**: A command-line interface allowing users to specify input
   trace files and output destinations.
2. **Trace Parser**: A system to read and parse trace events from the TypeScript
   compiler.
3. **Analyzer**: Logic to process trace events and compute meaningful
   statistics.
4. **Terminal Formatter**: Colorful, human-readable output in the terminal for
   quick analysis.
5. **JSON Output Generator**: Functionality to output detailed statistics in
   JSON format.

The analyzer currently extracts the following key metrics:

- Total build time
- Time spent on different operations (e.g., createProgram, createSourceFile,
  findSourceFile)
- Time spent in different categories (e.g., parse, program, bind)
- Files that took the longest to process
- File type statistics
- Module resolution statistics
- Total number of files processed

## Architecture

The project follows a modular architecture with the following key components:

### 1. Main CLI (`main.ts`)

- Handles command-line argument parsing
- Orchestrates the overall workflow (read, analyze, output)
- Provides user feedback
- Formats and displays terminal output when no output file is specified

### 2. Type Definitions (`types.ts`)

- Defines interfaces for trace events
- Defines interfaces for computed statistics
- Ensures type safety throughout the application

### 3. Analyzer (`analyzer.ts`)

- Contains the core logic for processing trace events
- Computes various statistics from the trace data
- Groups and aggregates data by operations, files, and categories

### 4. Data Flow

```
Input Trace File → Parse JSON → Process Events → Compute Stats → Output (Terminal/JSON)
```

## Usage

To analyze a TypeScript build trace:

```bash
# Output to terminal (human-readable format)
deno run main.ts --input=path/to/trace.json

# Output to JSON file
deno run main.ts --input=path/to/trace.json --output=path/to/output/dir
```

## Future Enhancements

Potential future improvements include:

1. Visualization of build statistics through HTML reports
2. Comparison of multiple trace files to track build performance over time
3. More detailed analysis of specific build phases
4. Recommendations for optimizing build performance based on analysis
5. Integration with CI/CD pipelines for automatic build performance monitoring
6. Support for Project References
