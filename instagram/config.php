<?php
// =====================================================================
//  Instagram settings for the Maluba Blooms gallery
// =====================================================================
return [

    // 1) ACCESS TOKEN
    // Paste your Instagram access token between the quotes to sync ALL
    // posts (new and old) automatically. See SETUP-INSTAGRAM.txt.
    // The site renews this token by itself, so you only paste it once.
    'access_token' => '',

    // 2) HOW OFTEN TO CHECK INSTAGRAM FOR NEW POSTS (minutes)
    'cache_minutes' => 30,

    // 3) BACKUP LIST -> edit api/instagram-posts.json
    // Used while 'access_token' above is empty (or if Instagram can't be
    // reached), and always on hosts without PHP such as GitHub Pages.
    // Newest first. On Instagram: open a post, tap ... > Copy link, and
    // paste it into that file in quotes, with a comma between links.
    'manual_posts' => json_decode((string) @file_get_contents(__DIR__ . '/../api/instagram-posts.json'), true) ?: [],
];
