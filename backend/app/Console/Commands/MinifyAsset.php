<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use MatthiasMullie\Minify;

class MinifyAsset extends Command
{
    protected $signature = 'asset:minify 
                            {path : Path to CSS/JS file} 
                            {output? : Optional output file path}';

    protected $description = 'Minify a CSS or JS file and create a .min.css or .min.js version';

    public function handle()
    {
        $path = $this->argument('path');
        $output = $this->argument('output');

        if (!file_exists($path)) {
            $this->error("File not found: $path");
            return Command::FAILURE;
        }

        $ext = pathinfo($path, PATHINFO_EXTENSION);
        $filename = pathinfo($path, PATHINFO_FILENAME);
        $dir = dirname($path);

        if (!in_array($ext, ['css', 'js'])) {
            $this->error("Only .css and .js files are supported.");
            return Command::FAILURE;
        }

        $this->info("Minifying $path ...");

        // Choose minifier
        if ($ext === 'css') {
            $minifier = new Minify\CSS($path);
            $defaultOutput = $dir . DIRECTORY_SEPARATOR . $filename . '.min.css';
        } else {
            $minifier = new Minify\JS($path);
            $defaultOutput = $dir . DIRECTORY_SEPARATOR . $filename . '.min.js';
        }

        // Use custom output if provided, else default
        $outputPath = $output ?: $defaultOutput;

        // Save to new file
        $minifier->minify($outputPath);

        $this->info("Minification complete. File created: $outputPath");
        return Command::SUCCESS;
    }
}
