#!/usr/bin/env node

/**
 * Migration script to replace @ path aliases with # imports and eliminate barrel files
 *
 * This script:
 * 1. Parses barrel files (index.ts) to map exports to source files
 * 2. Updates tsconfig.json to remove path aliases
 * 3. Adds imports field to package.json with # prefix
 * 4. Converts multi-imports from barrels to individual file imports
 * 5. Deletes barrel files (index.ts) in alias directories
 *
 * Usage:
 *   node scripts/migrate-to-hash-imports.js [options]
 *
 * Options:
 *   --dry-run          Preview changes without modifying files
 *   --module=NAME      Only process specific module
 *   --backup           Create backups before modifying
 *   --keep-barrels     Keep barrel files (don't delete them)
 *   --help             Show this help message
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  backup: args.includes('--backup'),
  help: args.includes('--help'),
  keepBarrels: args.includes('--keep-barrels'),
  module: args.find(arg => arg.startsWith('--module='))?.split('=')[1],
};

if (options.help) {
  console.log(`
Migration Script: Replace @ path aliases with # imports and eliminate barrel files

Usage:
  node scripts/migrate-to-hash-imports.js [options]

Options:
  --dry-run          Preview changes without modifying files
  --module=NAME      Only process specific module (e.g., --module=order)
  --backup           Create .backup files before modifying
  --keep-barrels     Keep barrel files (don't delete them)
  --help             Show this help message

Examples:
  node scripts/migrate-to-hash-imports.js --dry-run
  node scripts/migrate-to-hash-imports.js --module=order
  node scripts/migrate-to-hash-imports.js --backup
  `);
  process.exit(0);
}

const MODULES_DIR = path.join(__dirname, '..', 'packages', 'modules');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findModules() {
  const modules = [];
  const entries = fs.readdirSync(MODULES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const moduleName = entry.name;
    const modulePath = path.join(MODULES_DIR, moduleName);
    const tsconfigPath = path.join(modulePath, 'tsconfig.json');
    const packageJsonPath = path.join(modulePath, 'package.json');

    // Skip if no tsconfig or package.json
    if (!fs.existsSync(tsconfigPath) || !fs.existsSync(packageJsonPath)) {
      continue;
    }

    // Check if module has path aliases
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    const hasPaths = tsconfig.compilerOptions?.paths;

    if (hasPaths) {
      modules.push({
        name: moduleName,
        path: modulePath,
        tsconfigPath,
        packageJsonPath,
        paths: tsconfig.compilerOptions.paths,
      });
    }
  }

  return modules;
}

function extractAliasesFromPaths(paths) {
  const aliases = {};

  for (const [alias, targets] of Object.entries(paths)) {
    const key = alias.replace(/^@/, '');
    const target = targets[0];

    const match = target.match(/\.\/src\/([^/]+)/);
    if (match) {
      aliases[key] = {
        original: alias,
        hashImport: `#${key}`,
        srcDir: match[1],
      };
    }
  }

  return aliases;
}

/**
 * Parse a barrel file (index.ts) to extract export mappings
 * Returns a map of exported name -> source file
 */
function parseBarrelFile(barrelPath) {
  if (!fs.existsSync(barrelPath)) {
    return {};
  }

  const content = fs.readFileSync(barrelPath, 'utf8');
  const exportMap = {};

  // Match: export { default as Name } from "./file"
  const defaultAsPattern = /export\s*{\s*default\s+as\s+(\w+)\s*}\s*from\s+['"](\.\/[\w-]+)['"]/g;
  let match;

  while ((match = defaultAsPattern.exec(content)) !== null) {
    const [, exportName, filePath] = match;
    // Remove ./ prefix and get just the filename
    const fileName = filePath.replace(/^\.\//, '');
    exportMap[exportName] = fileName;
  }

  // Match: export { Name } from "./file"
  const namedPattern = /export\s*{\s*(\w+)\s*}\s*from\s+['"](\.\/[\w-]+)['"]/g;
  while ((match = namedPattern.exec(content)) !== null) {
    const [, exportName, filePath] = match;
    const fileName = filePath.replace(/^\.\//, '');
    exportMap[exportName] = fileName;
  }

  // Match: export * from "./file" - this means all exports from that file
  // We can't easily resolve this without parsing the source file, skip for now

  return exportMap;
}

/**
 * Build export maps for all alias directories in a module
 */
function buildExportMaps(modulePath, aliases) {
  const exportMaps = {};

  for (const [key, info] of Object.entries(aliases)) {
    const barrelPath = path.join(modulePath, 'src', info.srcDir, 'index.ts');
    exportMaps[key] = parseBarrelFile(barrelPath);
  }

  return exportMaps;
}

/**
 * Convert barrel imports to individual file imports
 *
 * Example:
 *   import { Cart, Address } from "@models"
 * Becomes:
 *   import Cart from "#models/cart"
 *   import Address from "#models/address"
 */
function convertBarrelImports(content, aliases, exportMaps) {
  let modified = content;
  const changes = [];

  for (const [key, info] of Object.entries(aliases)) {
    const { original, hashImport } = info;
    const exportMap = exportMaps[key] || {};

    // Pattern to match: import { Name1, Name2, ... } from "@models"
    const multiImportPattern = new RegExp(
      `import\\s*{([^}]+)}\\s*from\\s+['"]${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`,
      'g'
    );

    modified = modified.replace(multiImportPattern, (match, imports) => {
      // Parse the imported names
      const importNames = imports
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      // Generate individual imports
      const individualImports = importNames.map(name => {
        // Check if we have a mapping for this export
        const sourceFile = exportMap[name];

        if (sourceFile) {
          // We know the source file, use it
          return `import ${name} from "${hashImport}/${sourceFile}"`;
        } else {
          // Fallback: Convert PascalCase to kebab-case
          // e.g., OrderAddress -> order-address
          const kebabCase = name
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .toLowerCase();
          return `import ${name} from "${hashImport}/${kebabCase}"`;
        }
      });

      changes.push(`${original} (multi-import) -> ${hashImport}/* (individual imports)`);
      return individualImports.join('\n');
    });
  }

  return { content: modified, changes, modified: content !== modified };
}

/**
 * Update simple @ imports to # imports (for already-specific imports)
 */
function updateSimpleImports(content, aliases) {
  let modified = content;
  const changes = [];

  for (const [, info] of Object.entries(aliases)) {
    const { original, hashImport } = info;

    // Pattern for subpath imports that are already specific
    // from "@models/file" -> from "#models/file"
    const subpathPattern = new RegExp(
      `from\\s+(['"])${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`,
      'g'
    );

    const oldContent = modified;
    modified = modified.replace(subpathPattern, (match) => {
      return match.replace(original, hashImport);
    });

    if (modified !== oldContent) {
      changes.push(`${original}/* -> ${hashImport}/*`);
    }
  }

  return { content: modified, changes, modified: content !== modified };
}

function updateTsconfig(tsconfigPath, dryRun) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

  if (!tsconfig.compilerOptions?.paths) {
    return false;
  }

  delete tsconfig.compilerOptions.paths;

  if (!tsconfig.compilerOptions.rootDir) {
    tsconfig.compilerOptions.rootDir = './src';
  }

  if (!dryRun) {
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n', 'utf8');
  }

  return true;
}

function updatePackageJson(packageJsonPath, aliases, dryRun) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const imports = {};
  for (const [key, info] of Object.entries(aliases)) {
    imports[`#${key}/*`] = `./dist/${info.srcDir}/*.js`;
  }

  const newPackageJson = {};
  for (const [key, value] of Object.entries(packageJson)) {
    newPackageJson[key] = value;
    if (key === 'types' && !packageJson.imports) {
      newPackageJson.imports = imports;
    }
  }

  if (!packageJson.imports && !newPackageJson.imports) {
    const result = {};
    for (const [key, value] of Object.entries(newPackageJson)) {
      result[key] = value;
      if (key === 'main') {
        result.imports = imports;
      }
    }
    Object.assign(newPackageJson, result);
  }

  if (!dryRun) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(newPackageJson, null, 2) + '\n', 'utf8');
  }

  return imports;
}

function findAllSourceFiles(modulePath) {
  const files = [];
  const dirsToScan = ['src', 'integration-tests'];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!['__tests__', '__mocks__', 'node_modules', 'dist'].includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }

  for (const dir of dirsToScan) {
    walk(path.join(modulePath, dir));
  }

  return files;
}

function updateImportsInFile(filePath, aliases, exportMaps, dryRun) {
  let content = fs.readFileSync(filePath, 'utf8');
  const allChanges = [];

  // First: Convert barrel imports (multi-import from index)
  const barrelResult = convertBarrelImports(content, aliases, exportMaps);
  content = barrelResult.content;
  allChanges.push(...barrelResult.changes);

  // Second: Update simple subpath imports
  const simpleResult = updateSimpleImports(content, aliases);
  content = simpleResult.content;
  allChanges.push(...simpleResult.changes);

  const modified = barrelResult.modified || simpleResult.modified;

  if (modified && !dryRun) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return { modified, changes: allChanges };
}

function findBarrelFiles(modulePath, aliases) {
  const barrels = [];

  for (const [, info] of Object.entries(aliases)) {
    const barrelPath = path.join(modulePath, 'src', info.srcDir, 'index.ts');
    if (fs.existsSync(barrelPath)) {
      barrels.push(barrelPath);
    }
  }

  return barrels;
}

function deleteBarrelFiles(barrels, dryRun) {
  for (const barrelPath of barrels) {
    if (!dryRun) {
      fs.unlinkSync(barrelPath);
    }
  }
  return barrels.length;
}

function createBackup(filePath) {
  const backupPath = `${filePath}.backup`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

function processModule(module, dryRun, backup, keepBarrels) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Processing module: ${module.name}`, 'bright');
  log('='.repeat(60), 'cyan');

  const aliases = extractAliasesFromPaths(module.paths);
  log(`\nFound aliases: ${Object.keys(aliases).map(k => `@${k}`).join(', ')}`, 'blue');

  // Build export maps from barrel files
  log('\nParsing barrel files...', 'yellow');
  const exportMaps = buildExportMaps(module.path, aliases);

  let totalExports = 0;
  for (const [key, exportMap] of Object.entries(exportMaps)) {
    const count = Object.keys(exportMap).length;
    if (count > 0) {
      totalExports += count;
      log(`  ${key}: ${count} export(s) mapped`, 'blue');
    }
  }

  // Create backups if requested
  if (backup && !dryRun) {
    log('\nCreating backups...', 'yellow');
    createBackup(module.tsconfigPath);
    createBackup(module.packageJsonPath);
    log('  ✓ Backups created', 'green');
  }

  // Update tsconfig.json
  log('\nUpdating tsconfig.json...', 'yellow');
  if (updateTsconfig(module.tsconfigPath, dryRun)) {
    log('  ✓ Removed paths, added/kept rootDir', 'green');
  }

  // Update package.json
  log('\nUpdating package.json...', 'yellow');
  const imports = updatePackageJson(module.packageJsonPath, aliases, dryRun);
  log('  ✓ Added imports field:', 'green');
  for (const [key, value] of Object.entries(imports)) {
    log(`    ${key} -> ${value}`, 'blue');
  }

  // Update source files
  log('\nUpdating source files...', 'yellow');
  const sourceFiles = findAllSourceFiles(module.path);
  log(`  Found ${sourceFiles.length} TypeScript files (src/ + integration-tests/)`, 'blue');

  let filesModified = 0;
  const allChanges = [];

  for (const filePath of sourceFiles) {
    const result = updateImportsInFile(filePath, aliases, exportMaps, dryRun);
    if (result.modified) {
      filesModified++;
      const relativePath = path.relative(module.path, filePath);
      allChanges.push({ file: relativePath, changes: result.changes });
    }
  }

  if (filesModified > 0) {
    log(`  ✓ Modified ${filesModified} file(s)`, 'green');
    if (allChanges.length <= 10) {
      for (const { file, changes } of allChanges) {
        log(`    ${file}`, 'blue');
        for (const change of changes) {
          log(`      - ${change}`, 'blue');
        }
      }
    } else {
      for (let i = 0; i < 10; i++) {
        const { file } of allChanges[i];
        log(`    ${file}`, 'blue');
      }
      log(`    ... and ${allChanges.length - 10} more file(s)`, 'blue');
    }
  } else {
    log('  No files needed modification', 'yellow');
  }

  // Delete barrel files
  let barrelsDeleted = 0;
  if (!keepBarrels) {
    log('\nDeleting barrel files...', 'yellow');
    const barrels = findBarrelFiles(module.path, aliases);
    if (barrels.length > 0) {
      barrelsDeleted = deleteBarrelFiles(barrels, dryRun);
      log(`  ✓ Deleted ${barrelsDeleted} barrel file(s)`, 'green');
      for (const barrel of barrels) {
        log(`    ${path.relative(module.path, barrel)}`, 'blue');
      }
    } else {
      log('  No barrel files found', 'yellow');
    }
  } else {
    log('\n⚠️  Keeping barrel files (--keep-barrels flag)', 'yellow');
  }

  return {
    module: module.name,
    filesModified,
    aliasesUpdated: Object.keys(aliases).length,
    barrelsDeleted,
  };
}

// Main execution
async function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('Module Migration Script: @ -> # imports + Eliminate Barrels', 'bright');
  log('='.repeat(60), 'cyan');

  if (options.dryRun) {
    log('\n🔍 DRY RUN MODE - No files will be modified\n', 'yellow');
  }

  // Find all modules
  log('\nScanning for modules with path aliases...', 'blue');
  let modules = findModules();

  // Filter by specific module if requested
  if (options.module) {
    modules = modules.filter(m => m.name === options.module);
    if (modules.length === 0) {
      log(`\n❌ Module '${options.module}' not found or has no path aliases`, 'red');
      process.exit(1);
    }
  }

  log(`Found ${modules.length} module(s) to process\n`, 'green');

  // Process each module
  const results = [];
  for (const module of modules) {
    const result = processModule(module, options.dryRun, options.backup, options.keepBarrels);
    results.push(result);
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('Summary', 'bright');
  log('='.repeat(60), 'cyan');

  const totalFiles = results.reduce((sum, r) => sum + r.filesModified, 0);
  const totalAliases = results.reduce((sum, r) => sum + r.aliasesUpdated, 0);
  const totalBarrels = results.reduce((sum, r) => sum + r.barrelsDeleted, 0);

  log(`\nProcessed ${results.length} module(s)`, 'green');
  log(`Updated ${totalFiles} source file(s)`, 'green');
  log(`Migrated ${totalAliases} alias type(s)`, 'green');
  if (!options.keepBarrels) {
    log(`Deleted ${totalBarrels} barrel file(s)`, 'green');
  }

  if (options.dryRun) {
    log('\n💡 Run without --dry-run to apply changes', 'yellow');
  } else {
    log('\n✅ Migration complete!', 'green');
    log('\n📝 Next steps:', 'blue');
    log('  1. Run: npm run build (in affected modules)', 'blue');
    log('  2. Run: npm test (to verify nothing broke)', 'blue');
    log('  3. Remove tsc-alias from build scripts if present', 'blue');
  }
}

main().catch(err => {
  log(`\n❌ Error: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
