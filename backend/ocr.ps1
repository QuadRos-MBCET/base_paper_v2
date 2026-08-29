[CmdletBinding()]
Param(
    [string]$ImagePath
)

# Load WinRT types
[void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsRuntime]
[void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]

try {
    # Resolve absolute path
    $AbsolutePath = [System.IO.Path]::GetFullPath($ImagePath)

    # Get file async
    $fileTask = [Windows.Storage.StorageFile]::GetFileFromPathAsync($AbsolutePath)
    while (-not $fileTask.IsCompleted) { [System.Threading.Thread]::Sleep(10) }
    $file = $fileTask.GetResults()

    # Open read stream async
    $streamTask = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
    while (-not $streamTask.IsCompleted) { [System.Threading.Thread]::Sleep(10) }
    $stream = $streamTask.GetResults()

    # Create decoder async
    $decoderTask = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
    while (-not $decoderTask.IsCompleted) { [System.Threading.Thread]::Sleep(10) }
    $decoder = $decoderTask.GetResults()

    # Get software bitmap async
    $bitmapTask = $decoder.GetSoftwareBitmapAsync()
    while (-not $bitmapTask.IsCompleted) { [System.Threading.Thread]::Sleep(10) }
    $bitmap = $bitmapTask.GetResults()

    # Create OCR engine
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if ($null -eq $engine) {
        Write-Error "Could not initialize Windows OCR Engine."
        exit 1
    }

    # Recognize async
    $ocrTask = $engine.RecognizeAsync($bitmap)
    while (-not $ocrTask.IsCompleted) { [System.Threading.Thread]::Sleep(10) }
    $result = $ocrTask.GetResults()

    Write-Output $result.Text
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
