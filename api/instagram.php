<?php
/**
 * Returns Maluba Blooms' Instagram posts as JSON, newest first.
 *
 *  - With an access token in instagram/config.php: fetches EVERY post from
 *    the Instagram API, caches the result for `cache_minutes`, and renews the
 *    token automatically (tokens last 60 days; renewed every 7 days here).
 *  - Without a token: returns the manual backup list (shown as embeds).
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=120');

$config    = require __DIR__ . '/../instagram/config.php';
$dataDir   = __DIR__ . '/../instagram/data';
$cacheFile = $dataDir . '/posts.json';
$tokenFile = $dataDir . '/token.json';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

const GRAPH = 'https://graph.instagram.com';

function respond(array $payload): void
{
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function manual_payload(array $urls, ?string $error = null): array
{
    $posts = [];
    foreach ($urls as $url) {
        if (!preg_match('~/(p|reel|tv)/([A-Za-z0-9_-]+)~', (string) $url, $m)) {
            continue;
        }
        $posts[] = [
            'id'        => $m[2],
            'type'      => $m[1] === 'p' ? 'image' : 'video',
            'permalink' => "https://www.instagram.com/{$m[1]}/{$m[2]}/",
        ];
    }
    $out = ['source' => 'manual', 'posts' => $posts];
    if ($error) {
        $out['error'] = $error;
    }
    return $out;
}

function http_get_json(string $url): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    $body = curl_exec($ch);
    $err  = curl_error($ch);
    curl_close($ch);
    if ($body === false) {
        throw new RuntimeException("Network error: $err");
    }
    $json = json_decode($body, true);
    if (!is_array($json)) {
        throw new RuntimeException('Instagram returned an unreadable response');
    }
    if (isset($json['error'])) {
        throw new RuntimeException('Instagram API: ' . ($json['error']['message'] ?? 'unknown error'));
    }
    return $json;
}

/** Current token: the auto-renewed one if it belongs to the token in config, else config's. */
function current_token(string $configToken, string $tokenFile): string
{
    if ($configToken === '') {
        return '';
    }
    $saved = is_file($tokenFile) ? json_decode((string) file_get_contents($tokenFile), true) : null;
    if (!is_array($saved) || ($saved['origin'] ?? '') !== hash('sha256', $configToken)) {
        $saved = ['origin' => hash('sha256', $configToken), 'token' => $configToken, 'refreshed_at' => time()];
        @file_put_contents($tokenFile, json_encode($saved));
    }

    // Renew every 7 days so the 60-day token never expires.
    if (time() - (int) $saved['refreshed_at'] > 7 * 86400) {
        try {
            $r = http_get_json(GRAPH . '/refresh_access_token?grant_type=ig_refresh_token&access_token=' . urlencode($saved['token']));
            if (!empty($r['access_token'])) {
                $saved['token'] = $r['access_token'];
            }
        } catch (RuntimeException $e) {
            error_log('Instagram access-token refresh failed: ' . $e->getMessage());
        }
        $saved['refreshed_at'] = time();
        @file_put_contents($tokenFile, json_encode($saved));
    }
    return (string) $saved['token'];
}

function normalise_item(array $m): ?array
{
    $isVideo = ($m['media_type'] ?? '') === 'VIDEO';
    $src     = $isVideo ? ($m['thumbnail_url'] ?? null) : ($m['media_url'] ?? null);
    if (!$src) {
        return null;
    }
    return [
        'type'  => $isVideo ? 'video' : 'image',
        'src'   => $src,
        'video' => $isVideo ? ($m['media_url'] ?? null) : null,
    ];
}

/** Fetch every post, following Instagram's pagination. */
function fetch_all_posts(string $token): array
{
    $base = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    $withChildren = $base . ',children{media_type,media_url,thumbnail_url}';

    try {
        $first = http_get_json(GRAPH . '/me/media?fields=' . urlencode($withChildren) . '&limit=50&access_token=' . urlencode($token));
    } catch (RuntimeException $e) {
        // Fall back to fetching without carousel children if expansion isn't allowed.
        $first = http_get_json(GRAPH . '/me/media?fields=' . urlencode($base) . '&limit=50&access_token=' . urlencode($token));
    }

    $raw  = $first['data'] ?? [];
    $next = $first['paging']['next'] ?? null;
    $seenPages = [];
    while ($next) {
        if (isset($seenPages[$next])) {
            throw new RuntimeException('Instagram pagination repeated a page');
        }
        $seenPages[$next] = true;
        $res  = http_get_json($next);
        $raw  = array_merge($raw, $res['data'] ?? []);
        $next = $res['paging']['next'] ?? null;
    }

    $posts = [];
    foreach ($raw as $m) {
        $type     = $m['media_type'] ?? '';
        $children = [];
        foreach ($m['children']['data'] ?? [] as $c) {
            if ($item = normalise_item($c)) {
                $children[] = $item;
            }
        }
        $cover = $type === 'CAROUSEL_ALBUM'
            ? ($children[0] ?? normalise_item(['media_type' => 'IMAGE', 'media_url' => $m['media_url'] ?? null]))
            : normalise_item($m);
        if (!$cover) {
            continue;
        }
        if (!$children) {
            $children = [$cover];
        }
        $hasVideo = (bool) array_filter($children, fn($c) => $c['type'] === 'video');

        $posts[] = [
            'id'        => (string) $m['id'],
            'type'      => $type === 'CAROUSEL_ALBUM' ? 'carousel' : $cover['type'],
            'has_video' => $hasVideo,
            'src'       => $cover['src'],
            'items'     => $children,
            'caption'   => (string) ($m['caption'] ?? ''),
            'permalink' => (string) ($m['permalink'] ?? ''),
            'timestamp' => (string) ($m['timestamp'] ?? ''),
        ];
    }
    usort($posts, fn($a, $b) => strcmp($b['timestamp'], $a['timestamp']));
    return $posts;
}

// ---------------------------------------------------------------------
$token = current_token(trim((string) ($config['access_token'] ?? '')), $tokenFile);
if ($token === '') {
    respond(manual_payload($config['manual_posts'] ?? []));
}

$maxAge = max(1, (int) ($config['cache_minutes'] ?? 30)) * 60;
if (is_file($cacheFile) && time() - filemtime($cacheFile) < $maxAge) {
    readfile($cacheFile);
    exit;
}

try {
    $payload = ['source' => 'api', 'updated' => date(DATE_ATOM), 'posts' => fetch_all_posts($token)];
    @file_put_contents($cacheFile, json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX);
    respond($payload);
} catch (Throwable $e) {
    error_log('Instagram media sync failed: ' . $e->getMessage());
    if (is_file($cacheFile)) {       // serve the last good copy
        readfile($cacheFile);
        exit;
    }
    respond(manual_payload($config['manual_posts'] ?? [], $e->getMessage()));
}
