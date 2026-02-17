
# MongoDB Setup and Start Script
# Tries to locate MongoDB installation and start the mongod process

$mongoPath = $null
$programFiles = $env:ProgramFiles
$programFilesX86 = ${env:ProgramFiles(x86)}

# Common MongoDB paths
$searchPaths = @(
    "$programFiles\MongoDB\Server\*\bin\mongod.exe",
    "$programFilesX86\MongoDB\Server\*\bin\mongod.exe",
    "C:\MongoDB\bin\mongod.exe"
)

Write-Host "Searching for MongoDB installation..." -ForegroundColor Cyan

foreach ($path in $searchPaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($found) {
        $mongoPath = $found.FullName
        break
    }
}

if ($mongoPath) {
    Write-Host "Found MongoDB at: $mongoPath" -ForegroundColor Green
    
    # Check if already running
    $running = Get-Process mongod -ErrorAction SilentlyContinue
    if ($running) {
        Write-Host "MongoDB is already running (PID: $($running.Id))" -ForegroundColor Yellow
        exit 0
    }

    # Create data directory if not exists
    $dataDir = "C:\data\db"
    if (!(Test-Path $dataDir)) {
        Write-Host "Creating data directory at $dataDir..."
        New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
    }

    Write-Host "Starting MongoDB..." -ForegroundColor Cyan
    try {
        # Start as background process
        $process = Start-Process -FilePath $mongoPath -ArgumentList "--dbpath `"$dataDir`" --bind_ip 127.0.0.1" -PassThru
        Write-Host "MongoDB started successfully (PID: $($process.Id))" -ForegroundColor Green
        
        # Verify port
        Start-Sleep -Seconds 2
        $connection = Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "Connectivity verified: Port 27017 is open." -ForegroundColor Green
        } else {
            Write-Host "Warning: Process started but port 27017 is not yet accessible." -ForegroundColor Yellow
        }
    } catch {
        Write-Error "Failed to start MongoDB: $_"
        exit 1
    }
} else {
    Write-Error "MongoDB installation not found. Please install MongoDB manually."
    Write-Host "Download from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    exit 1
}
