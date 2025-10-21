Add-Type -AssemblyName System.Drawing

# Create 192x192 icon
$bmp192 = New-Object System.Drawing.Bitmap(192,192)
$graphics192 = [System.Drawing.Graphics]::FromImage($bmp192)
$graphics192.Clear([System.Drawing.Color]::FromArgb(59,130,246))
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

# Draw lines for notes
$graphics192.FillRectangle($brush, 24, 48, 144, 6)
$graphics192.FillRectangle($brush, 24, 64, 144, 6)
$graphics192.FillRectangle($brush, 24, 80, 144, 6)
$graphics192.FillRectangle($brush, 24, 96, 96, 6)

# Draw circle
$graphics192.FillEllipse($brush, 128, 16, 32, 32)

$bmp192.Save("c:\Users\s-thakur00\my-app\public\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$graphics192.Dispose()
$bmp192.Dispose()

# Create 512x512 icon
$bmp512 = New-Object System.Drawing.Bitmap(512,512)
$graphics512 = [System.Drawing.Graphics]::FromImage($bmp512)
$graphics512.Clear([System.Drawing.Color]::FromArgb(59,130,246))

# Draw lines for notes
$graphics512.FillRectangle($brush, 64, 128, 384, 16)
$graphics512.FillRectangle($brush, 64, 160, 384, 16)
$graphics512.FillRectangle($brush, 64, 192, 384, 16)
$graphics512.FillRectangle($brush, 64, 224, 256, 16)

# Draw circle
$graphics512.FillEllipse($brush, 342, 43, 84, 84)

$bmp512.Save("c:\Users\s-thakur00\my-app\public\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$graphics512.Dispose()
$bmp512.Dispose()
$brush.Dispose()

Write-Host "Icons created successfully!"