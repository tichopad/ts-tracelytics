/**
 * Represents a single event in the TypeScript trace file
 */
export interface TraceEvent {
  name: string;           // Name of the event
  pid: number;            // Process ID
  tid: number;            // Thread ID
  ph: string;             // Phase: 'B' (begin), 'E' (end), 'X' (complete), 'M' (metadata)
  cat: string;            // Category of the event
  ts: number;             // Timestamp (microseconds)
  dur?: number;           // Duration for complete events (microseconds)
  args: {
    path?: string;        // For file operations
    fileName?: string;    // For file operations
    name?: string;        // For metadata events
    fileIncludeKind?: string; // Type of file inclusion (e.g., "RootFile", "Import")
    configFilePath?: string;  // Path to the tsconfig.json
    count?: number;       // For bulk operations
    containingFileName?: string; // For module resolution
    [key: string]: unknown; // Other arguments
  };
}

/**
 * Represents a processed operation with timing data
 */
export interface Operation {
  totalTime: number;     // Total time spent on this operation type
  count: number;         // Number of occurrences
  averageTime: number;   // Average time per operation
}

/**
 * Represents timing data for a specific file
 */
export interface FileStats {
  path: string;          // File path
  totalTime: number;     // Total time spent on this file
  operations: {          // Time spent on specific operations for this file
    [operation: string]: number;
  };
}

/**
 * Contains the analyzed statistics from the trace
 */
export interface Statistics {
  // Overall statistics
  totalTime: number;             // Total build time
  totalFiles: number;            // Total number of files processed

  // Time spent on each operation (e.g., createSourceFile, findSourceFile)
  operationTimes: {
    [operation: string]: Operation;
  };

  // Time spent per category (e.g., parse, program, bind)
  categoryTimes: {
    [category: string]: Operation;
  };

  // Files that took the longest processing time
  slowestFiles: FileStats[];      // Top N slowest files

  // Files grouped by type
  filesByType: {
    [type: string]: number;      // Count of files by type
  };

  // Module resolution statistics
  moduleResolution: {
    totalTime: number;
    totalCount: number;
    averageTime: number;
  };
}