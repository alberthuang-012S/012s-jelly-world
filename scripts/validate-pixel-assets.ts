import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import {
  DEFAULT_VALIDATION_SPECS,
  validationSpecFromTerrainManifest,
  type AssetValidationKind,
  type AssetValidationSpec,
  type TerrainManifest,
} from "./pixel-assets/config.ts";
import {
  createGridDebugImage,
  decodePng,
  validateAsset,
  type ValidationReport,
  type ValidationStatus,
} from "./pixel-assets/validator.ts";

interface CliOptions {
  kind?: AssetValidationKind;
  strict: boolean;
  verbose: boolean;
  json: boolean;
  report: boolean;
  debugGrid: boolean;
  paths: string[];
}

const projectRoot = process.cwd();
const assetRoot = path.join(projectRoot, "public", "assets", "pixel");
const terrainPath = path.join(assetRoot, "tiles", "terrain", "terrain.png");
const terrainManifestPath = path.join(assetRoot, "tiles", "terrain", "terrain.manifest.json");
const validationOutputRoot = path.join(projectRoot, "validation-output");

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const options = parseArgs(argv);
  if (options.paths.length === 0 && argv.includes("--help")) {
    printHelp();
    return 0;
  }

  const terrainSpec = readTerrainSpec();
  const targets = await resolveTargets(options);
  if (targets.length === 0 && (options.kind === undefined || options.kind === "terrain")) {
    targets.push({ filePath: terrainPath, kind: "terrain", spec: terrainSpec });
  }

  const reports: ValidationReport[] = [];
  for (const target of targets) {
    const report = validateAsset(target.filePath, target.kind, target.spec, {
      strictMissing: options.strict,
      includeCells: options.verbose || options.report,
    });
    reports.push(report);
    if (options.debugGrid && report.image && report.overall !== "SKIP") {
      writeDebugGrid(target.filePath, target.kind, target.spec, report);
    }
  }

  const overall = combineReports(reports);
  const machineReport = { tool: "012S Pixel Asset Validator", overall, results: reports };
  let reportPath: string | undefined;
  if (options.report) {
    fs.mkdirSync(validationOutputRoot, { recursive: true });
    reportPath = path.join(validationOutputRoot, "report.json");
    fs.writeFileSync(reportPath, `${JSON.stringify(machineReport, null, 2)}\n`);
  }

  if (options.json) {
    process.stdout.write(`${JSON.stringify(machineReport, null, 2)}\n`);
  } else {
    for (const report of reports) {
      printReport(report, options.verbose);
    }
    process.stdout.write(`\nOverall:\n${overall}\n`);
    if (reportPath) {
      process.stdout.write(`Machine report: ${reportPath}\n`);
    }
  }

  return overall === "FAIL" ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().then((exitCode) => {
    process.exitCode = exitCode;
  }).catch((error: unknown) => {
    process.stderr.write(`Validator error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    strict: false,
    verbose: false,
    json: false,
    report: false,
    debugGrid: false,
    paths: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg || arg === "--") continue;
    if (arg === "--strict") {
      options.strict = true;
    } else if (arg === "--verbose") {
      options.verbose = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--report") {
      options.report = true;
    } else if (arg === "--debug-grid") {
      options.debugGrid = true;
    } else if (arg === "--kind" || arg === "-k") {
      const value = argv[++index];
      if (!isKind(value)) throw new Error(`Unknown asset kind: ${value ?? ""}`);
      options.kind = value;
    } else if (arg.startsWith("--kind=")) {
      const value = arg.slice("--kind=".length);
      if (!isKind(value)) throw new Error(`Unknown asset kind: ${value}`);
      options.kind = value;
    } else if (arg === "--help" || arg === "-h") {
      options.paths = [];
      return options;
    } else if (!arg.startsWith("-")) {
      options.paths.push(arg);
    }
  }
  return options;
}

async function resolveTargets(options: CliOptions): Promise<Array<{ filePath: string; kind: AssetValidationKind; spec: AssetValidationSpec }>> {
  if (options.paths.length > 0) {
    return options.paths.map((input) => {
      const filePath = path.resolve(projectRoot, input);
      const kind = options.kind ?? inferKind(filePath);
      return { filePath, kind, spec: kind === "terrain" ? readTerrainSpec() : DEFAULT_VALIDATION_SPECS[kind] };
    });
  }

  const discovered = await findPngFiles(assetRoot);
  const targets: Array<{ filePath: string; kind: AssetValidationKind; spec: AssetValidationSpec }> = [];
  if (fs.existsSync(terrainPath)) {
    targets.push({ filePath: terrainPath, kind: "terrain", spec: readTerrainSpec() });
  } else if (options.kind === undefined || options.kind === "terrain") {
    targets.push({ filePath: terrainPath, kind: "terrain", spec: readTerrainSpec() });
  }
  for (const filePath of discovered) {
    if (filePath.toLowerCase() === terrainPath.toLowerCase()) continue;
    const kind = options.kind ?? inferKind(filePath);
    if (options.kind && kind !== options.kind) continue;
    targets.push({ filePath, kind, spec: kind === "terrain" ? readTerrainSpec() : DEFAULT_VALIDATION_SPECS[kind] });
  }
  return targets;
}

async function findPngFiles(root: string): Promise<string[]> {
  if (!fs.existsSync(root)) return [];
  const entries = await fs.promises.readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findPngFiles(entryPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      files.push(entryPath);
    }
  }
  return files.sort();
}

function readTerrainSpec(): AssetValidationSpec {
  if (!fs.existsSync(terrainManifestPath)) return DEFAULT_VALIDATION_SPECS.terrain;
  const manifest = JSON.parse(fs.readFileSync(terrainManifestPath, "utf8")) as TerrainManifest;
  return validationSpecFromTerrainManifest(manifest);
}

function inferKind(filePath: string): AssetValidationKind {
  const normalized = filePath.split("\\").join("/").toLowerCase();
  if (normalized.includes("/tiles/")) return "terrain";
  if (normalized.includes("/characters/")) return "character";
  if (normalized.includes("/buildings/")) return "building";
  return "prop";
}

function writeDebugGrid(filePath: string, kind: AssetValidationKind, spec: AssetValidationSpec, report: ValidationReport): void {
  if (!report.image || !report.grid) return;
  const input = fs.readFileSync(filePath);
  const image = decodePng(input);
  fs.mkdirSync(validationOutputRoot, { recursive: true });
  const basename = path.basename(filePath, path.extname(filePath));
  const outputPath = path.join(validationOutputRoot, `${basename}-${kind}-grid-debug.png`);
  fs.writeFileSync(outputPath, createGridDebugImage(image, spec.frameWidth ?? 16, spec.frameHeight ?? 16));
  report.grid.diagnostic.debugGridPath = outputPath;
}

function printReport(report: ValidationReport, verbose: boolean): void {
  process.stdout.write(`\n012S Pixel Asset Validator\n\nFile:\n${report.file}\nType: ${report.kind}\n\n`);
  for (const check of report.checks) {
    process.stdout.write(`${check.name.padEnd(20)} ${check.status.padEnd(5)} ${check.message}\n`);
  }
  if (report.grid && verbose && report.grid.cells) {
    process.stdout.write("\nCells:\n");
    for (const cell of report.grid.cells) {
      process.stdout.write(`Tile ${cell.index}\n  col=${cell.column} row=${cell.row} visible=${cell.visible} occupancy=${cell.occupancy}%\n`);
    }
  }
  if (report.grid) {
    process.stdout.write("\nVertical boundaries:\n");
    for (const boundary of report.grid.diagnostic.vertical) {
      process.stdout.write(`x=${boundary.position} crossingPixels=${boundary.crossingPixels}\n`);
    }
    process.stdout.write("Horizontal boundaries:\n");
    for (const boundary of report.grid.diagnostic.horizontal) {
      process.stdout.write(`y=${boundary.position} crossingPixels=${boundary.crossingPixels}\n`);
    }
  }
  if (report.warnings.length > 0) {
    process.stdout.write(`\nWarning:\n${report.warnings.map((warning) => `${warning}\n`).join("")}`);
  }
  if (report.errors.length > 0) {
    process.stdout.write(`\nError:\n${report.errors.map((error) => `${error}\n`).join("")}`);
  }
  process.stdout.write(`\nOverall:\n${report.overall}\n`);
}

function combineReports(reports: ValidationReport[]): ValidationStatus {
  if (reports.some((report) => report.overall === "FAIL")) return "FAIL";
  if (reports.some((report) => report.overall === "WARN")) return "WARN";
  if (reports.some((report) => report.overall === "PASS")) return "PASS";
  return "SKIP";
}

function isKind(value: string | undefined): value is AssetValidationKind {
  return value === "terrain" || value === "character" || value === "building" || value === "prop";
}

function printHelp(): void {
  process.stdout.write(`012S Pixel Asset Validator\n\n` +
    `Commands:\n` +
    `  pnpm validate:assets\n` +
    `  pnpm validate:terrain -- path/to/terrain.png\n\n` +
    `Options:\n` +
    `  --kind terrain|character|building|prop\n` +
    `  --strict       Missing files become FAIL\n` +
    `  --verbose      Print per-cell occupancy\n` +
    `  --json         Print machine-readable JSON\n` +
    `  --report       Write validation-output/report.json\n` +
    `  --debug-grid   Write validation-output/*-grid-debug.png\n`);
}
