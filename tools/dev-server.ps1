param(
  [int]$Port = 5173,
  [string]$Bind = "127.0.0.1",
  [string]$Root = (Resolve-Path "$PSScriptRoot\..").Path
)

$ErrorActionPreference = "Stop"

$bindAddress = if ($Bind -eq "0.0.0.0") {
  [System.Net.IPAddress]::Any
}
elseif ($Bind -eq "localhost") {
  [System.Net.IPAddress]::Loopback
}
else {
  [System.Net.IPAddress]::Parse($Bind)
}
$listener = [System.Net.Sockets.TcpListener]::new($bindAddress, $Port)
$displayHost = if ($Bind -eq "0.0.0.0") { "0.0.0.0" } else { "localhost" }
$prefix = "http://$displayHost`:$Port/"

$rootFull = [System.IO.Path]::GetFullPath($Root).TrimEnd("\", "/") + [System.IO.Path]::DirectorySeparatorChar
$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".webmanifest" = "application/manifest+json; charset=utf-8"
  ".svg" = "image/svg+xml"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
}

function Send-Response {
  param(
    [System.IO.Stream]$Stream,
    [int]$StatusCode,
    [string]$Reason,
    [string]$ContentType,
    [byte[]]$Bytes,
    [bool]$HeadOnly = $false
  )

  $headers = "HTTP/1.1 $StatusCode $Reason`r`nContent-Type: $ContentType`r`nContent-Length: $($Bytes.Length)`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if (-not $HeadOnly -and $Bytes.Length -gt 0) {
    $Stream.Write($Bytes, 0, $Bytes.Length)
  }
}

function Send-Text {
  param(
    [System.IO.Stream]$Stream,
    [int]$StatusCode,
    [string]$Reason,
    [string]$Body,
    [bool]$HeadOnly = $false
  )

  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
  Send-Response $Stream $StatusCode $Reason "text/plain; charset=utf-8" $bytes $HeadOnly
}

try {
  $listener.Start()
  Write-Host "Local Loop Golf dev server listening at $prefix"
  Write-Host "Serving $rootFull"

  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      while ($true) {
        $line = $reader.ReadLine()
        if ($null -eq $line -or $line.Length -eq 0) {
          break
        }
      }

      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        $client.Close()
        continue
      }

      $parts = $requestLine.Split(" ")
      $method = $parts[0]
      $target = if ($parts.Length -gt 1) { $parts[1] } else { "/" }
      $headOnly = $method -eq "HEAD"

      if ($method -ne "GET" -and $method -ne "HEAD") {
        Send-Text $stream 405 "Method Not Allowed" "Method not allowed" $headOnly
        $client.Close()
        continue
      }

      $requestPath = [System.Uri]::UnescapeDataString($target.Split("?")[0].TrimStart("/"))
      if ([string]::IsNullOrWhiteSpace($requestPath)) {
        $requestPath = "index.html"
      }

      $fullPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($rootFull, $requestPath))
      if (-not $fullPath.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        Send-Text $stream 403 "Forbidden" "Forbidden" $headOnly
        $client.Close()
        continue
      }

      if (-not [System.IO.File]::Exists($fullPath)) {
        Send-Text $stream 404 "Not Found" "Not found" $headOnly
        $client.Close()
        continue
      }

      $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
      $contentType = $mimeTypes[$extension]
      if (-not $contentType) {
        $contentType = "application/octet-stream"
      }

      $bytes = [System.IO.File]::ReadAllBytes($fullPath)
      Send-Response $stream 200 "OK" $contentType $bytes $headOnly
    }
    catch {
      try {
        if ($stream) {
          Send-Text $stream 400 "Bad Request" "Bad request" $false
        }
      }
      catch {
        # Some clients close speculative connections before sending a request.
      }
    }
    finally {
      $client.Close()
    }
  }
}
finally {
  $listener.Stop()
}
