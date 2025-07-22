<?php
header('Content-Type: application/json');

// 🔧 Configurações do canal
$youtubeApiKey = "AIzaSyDubEpb0TkgZjiyjA9-1QM_56Kwnn_SMPs";
$canalId = "UCh-ceOeY4WVgS8R0onTaXmw";

// Entrada do bot
$input = json_decode(file_get_contents('php://input'), true);
$nome = $input['number'] ?? 'Usuário';

// Buscar último vídeo
$url = "https://www.googleapis.com/youtube/v3/search?key=$youtubeApiKey&channelId=$canalId&order=date&part=snippet&type=video&maxResults=1";
$res = json_decode(file_get_contents($url), true);

// Se achou vídeo
if (isset($res["items"][0])) {
    $videoId = $res["items"][0]["id"]["videoId"];
    $titulo = $res["items"][0]["snippet"]["title"];
    $thumbnail = $res["items"][0]["snippet"]["thumbnails"]["high"]["url"];
    $link = "https://www.youtube.com/watch?v=$videoId";

    // Pega imagem da thumbnail e converte para base64
    $imgData = file_get_contents($thumbnail);
    $base64 = base64_encode($imgData);
    $ext = pathinfo($thumbnail, PATHINFO_EXTENSION);
    $filename = "thumbnail.$ext";

    echo json_encode([
        "reply" => "🚨 Olá, saiu vídeo novo no canal!\n🎬 *$titulo*\n👉 Assista agora: $link",
        "file_base64" => $base64,
        "filename" => $filename,
        "caption" => "🆕 $titulo\n🎥 Assista: $link"
    ]);
} else {
    echo json_encode([
        "reply" => "⚠️ Nenhum vídeo foi encontrado no canal."
    ]);
}