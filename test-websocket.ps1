# PowerShell WebSocket Client Script
param(
    [string]$OrderId = "59da5861-cbd2-4789-bbed-986c0bffc94d",
    [string]$Server = "localhost:3000"
)

$url = "ws://$Server/api/orders/status/$OrderId"
Write-Host "Connecting to WebSocket: $url" -ForegroundColor Cyan

# Create WebSocket client
$ws = New-Object System.Net.WebSockets.ClientWebSocket
$cancellationToken = New-Object System.Threading.CancellationToken

try {
    # Connect to WebSocket
    $uri = New-Object System.Uri($url)
    $connectTask = $ws.ConnectAsync($uri, $cancellationToken)
    $connectTask.Wait()
    
    Write-Host "Connected! Waiting for messages..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to disconnect`n" -ForegroundColor Yellow
    
    # Buffer for receiving messages
    $buffer = New-Object byte[] 4096
    
    while ($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        # Receive message
        $arraySegment = New-Object System.ArraySegment[byte]($buffer, 0, $buffer.Length)
        $result = $ws.ReceiveAsync($arraySegment, $cancellationToken)
        $result.Wait()
        
        if ($result.Result.MessageType -eq [System.Net.WebSockets.WebSocketMessageType]::Text) {
            $message = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $result.Result.Count)
            Write-Host "Received: $message" -ForegroundColor Green
            
            # Parse and display formatted JSON if possible
            try {
                $json = $message | ConvertFrom-Json
                $json | Format-List
            } catch {
                Write-Host $message
            }
        } elseif ($result.Result.MessageType -eq [System.Net.WebSockets.WebSocketMessageType]::Close) {
            Write-Host "Connection closed by server" -ForegroundColor Yellow
            break
        }
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
} finally {
    if ($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        $closeTask = $ws.CloseAsync(
            [System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure,
            "Client closing",
            $cancellationToken
        )
        $closeTask.Wait()
    }
    $ws.Dispose()
    Write-Host "`nDisconnected" -ForegroundColor Yellow
}

