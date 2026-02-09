$files = @(
    "c:\Users\ADMIN\source\smarty\editor\src\components\ElementRenderer.jsx",
    "c:\Users\ADMIN\source\smarty\client\src\components\Preview\ElementRenderer.jsx"
)

foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        Write-Host "File not found: $file"
        continue
    }

    Write-Host "Processing $file"
    $content = Get-Content -Raw $file

    # Vertical Gauge Regex
    # Matches <Text [whitespace] text={val.toFixed(1)} [whitespace] x={0} [whitespace] y={...-15} [whitespace] width={width} [whitespace] align="center"
    $patternV = '(?s)(<Text\s+text=\{val\.toFixed\(1\)\}\s+x=\{0\}\s+y=\{.*?\-15\}\s+width=\{width\}\s+align="center")'
    $reV = [regex]$patternV
    $matchV = $reV.Match($content)
    
    if ($matchV.Success) {
        Write-Host "  Found Vertical Gauge Pattern"
        # Perform replacement on the matched string
        $oldStr = $matchV.Value
        $newStr = $oldStr -replace 'x=\{0\}', 'x={(width / 2) - 100}'
        $newStr = $newStr -replace 'width=\{width\}', 'width={200}'
        
        $content = $content.Replace($oldStr, $newStr)
    } else {
        Write-Host "  Vertical Gauge Pattern NOT Found"
    }

    # Horizontal Gauge Regex
    $patternH = '(?s)(<Text\s+text=\{val\.toFixed\(1\)\}\s+x=\{ratio\s*\*\s*width\s*-\s*15\}\s+y=\{.*?\+5\}\s+width=\{30\}\s+align="center")'
    $reH = [regex]$patternH
    $matchH = $reH.Match($content)
    
    if ($matchH.Success) {
        Write-Host "  Found Horizontal Gauge Pattern"
        $oldStrH = $matchH.Value
        # Replace x using regex to handle spaces
        $newStrH = $oldStrH -replace 'x=\{ratio\s*\*\s*width\s*-\s*15\}', 'x={(ratio * width) - 50}'
        $newStrH = $newStrH -replace 'width=\{30\}', 'width={100}'
        
        $content = $content.Replace($oldStrH, $newStrH)
    } else {
        Write-Host "  Horizontal Gauge Pattern NOT Found"
    }
    
    Set-Content -Path $file -Value $content -NoNewline -Encoding UTF8
    Write-Host "  Updated $file"
}
