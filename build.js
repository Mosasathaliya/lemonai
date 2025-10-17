const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const CONFIG = {
    frontendDir: path.join(__dirname, 'frontend'),
    outputDir: path.join(__dirname, 'dist'),
    ignoreDirs: ['node_modules', '.git', '.DS_Store', 'dist', 'build', '.next'],
    maxBuffer: 10 * 1024 * 1024, // 10MB
    possibleOutputDirs: [
        path.join('dist'),
        path.join('build'),
        path.join('.vite', 'renderer', 'main_window'),
        path.join('out')
    ].map(dir => path.join(__dirname, 'frontend', dir))
};

// Colors for console output
const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m'
};

// Logger utility
const logger = {
    info: (msg) => console.log(`${COLORS.blue}[INFO]${COLORS.reset} ${msg}`),
    success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
    warn: (msg) => console.warn(`${COLORS.yellow}⚠ ${msg}${COLORS.reset}`),
    error: (msg) => console.error(`${COLORS.red}✖ ERROR: ${msg}${COLORS.reset}`),
    debug: (msg) => process.env.DEBUG && console.log(`${COLORS.yellow}[DEBUG]${COLORS.reset} ${msg}`)
};

// Execute command with better error handling
const execute = (command, options = {}) => {
    const { cwd = process.cwd(), exitOnError = true } = options;
    logger.debug(`Executing: ${command} in ${cwd}`);
    
    try {
        execSync(command, { 
            cwd, 
            stdio: 'inherit',
            maxBuffer: CONFIG.maxBuffer,
            shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
        });
        return true;
    } catch (error) {
        if (exitOnError) {
            logger.error(`Command failed: ${command}\n${error.message}`);
            process.exit(1);
        }
        return false;
    }
};

// Clean directory
const cleanDirectory = (dir) => {
    if (fs.existsSync(dir)) {
        logger.info(`Cleaning directory: ${path.relative(process.cwd(), dir)}`);
        fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
    }
    fs.mkdirSync(dir, { recursive: true });
};

// Recursive directory copy with progress
const copyRecursiveSync = (src, dest, level = 0) => {
    if (!fs.existsSync(src)) {
        throw new Error(`Source path does not exist: ${src}`);
    }

    const stats = fs.statSync(src);
    const isDirectory = stats.isDirectory();
    const relativePath = path.relative(process.cwd(), src);

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const files = fs.readdirSync(src);
        for (const file of files) {
            if (CONFIG.ignoreDirs.includes(file)) continue;
            copyRecursiveSync(
                path.join(src, file),
                path.join(dest, file),
                level + 1
            );
        }
    } else {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(src, dest);
        if (level <= 2) { // Only log top-level files for brevity
            logger.debug(`Copied: ${relativePath} -> ${path.relative(process.cwd(), dest)}`);
        }
    }
};

// Find build output directory
const findBuildOutput = () => {
    for (const dir of CONFIG.possibleOutputDirs) {
        if (fs.existsSync(dir)) {
            logger.success(`Found build output at: ${path.relative(process.cwd(), dir)}`);
            return dir;
        }
    }
    
    // If no standard output dir found, check for any non-ignored directories
    const files = fs.readdirSync(CONFIG.frontendDir);
    const possibleDirs = files
        .filter(file => {
            const fullPath = path.join(CONFIG.frontendDir, file);
            return fs.statSync(fullPath).isDirectory() && !CONFIG.ignoreDirs.includes(file);
        });
    
    if (possibleDirs.length > 0) {
        const foundDir = path.join(CONFIG.frontendDir, possibleDirs[0]);
        logger.warn(`No standard build directory found. Using: ${path.relative(process.cwd(), foundDir)}`);
        return foundDir;
    }
    
    throw new Error(
        'Could not find build output directory.\n' +
        `Searched in:\n${CONFIG.possibleOutputDirs.map(d => `- ${d}`).join('\n')}`
    );
};

// Main build process
const main = async () => {
    try {
        logger.info('🚀 Starting build process...');
        
        // Check for frontend directory
        if (!fs.existsSync(CONFIG.frontendDir)) {
            throw new Error(`Frontend directory not found at: ${CONFIG.frontendDir}`);
        }

        // Install dependencies
        logger.info('📦 Installing frontend dependencies...');
        execute('pnpm install --frozen-lockfile', { cwd: CONFIG.frontendDir });

        // Build frontend
        logger.info('🔨 Building frontend...');
        execute('pnpm run build', { cwd: CONFIG.frontendDir });

        // Clean and prepare output directory
        logger.info('🧹 Cleaning output directory...');
        cleanDirectory(CONFIG.outputDir);

        // Find and copy build output
        logger.info('📂 Locating build output...');
        const sourceDir = findBuildOutput();
        
        logger.info(`📤 Copying files to ${path.relative(process.cwd(), CONFIG.outputDir)}...`);
        copyRecursiveSync(sourceDir, CONFIG.outputDir);

        // Verify build
        const hasIndex = fs.existsSync(path.join(CONFIG.outputDir, 'index.html')) || 
                        fs.existsSync(path.join(CONFIG.outputDir, 'index.js'));
        
        if (!hasIndex) {
            logger.warn('No index.html or index.js found in build output. The build might be incomplete.');
        }

        // Print success message
        const buildSize = getDirectorySize(CONFIG.outputDir);
        logger.success(`✅ Build completed successfully! (${formatBytes(buildSize)})`);
        
    } catch (error) {
        logger.error(error.message);
        process.exit(1);
    }
};

// Helper: Get directory size
const getDirectorySize = (dir) => {
    let size = 0;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        size += stat.isDirectory() ? getDirectorySize(filePath) : stat.size;
    }
    
    return size;
};

// Helper: Format bytes
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Run the build
if (require.main === module) {
    main().catch(error => {
        logger.error(error);
        process.exit(1);
    });
}

module.exports = { execute, cleanDirectory, copyRecursiveSync };
