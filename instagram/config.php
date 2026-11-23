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

    // 3) BACKUP LIST
    // Used only while 'access_token' above is empty (or if Instagram
    // can't be reached). Newest first. On Instagram: open a post,
    // then tap ... and Copy link, and paste it below in quotes.
    'manual_posts' => [
        "https://www.instagram.com/maluba_blooms/p/DfhOpnFjcz4/",
        "https://www.instagram.com/maluba_blooms/p/Dfhqex_jZul/",
        "https://www.instagram.com/maluba_blooms/reel/Dfg3M0yN3CZ/",
        "https://www.instagram.com/maluba_blooms/p/Dfb37FGDX0z/",
        "https://www.instagram.com/maluba_blooms/p/DfR-WoujXkm/",
        "https://www.instagram.com/maluba_blooms/p/De_gZjkDYRc/",
        "https://www.instagram.com/maluba_blooms/p/DeZxM7YDRR7/",
        "https://www.instagram.com/maluba_blooms/reel/DeJV_4dtnCx/",
        "https://www.instagram.com/maluba_blooms/reel/Ddtm4XYNmny/",
        "https://www.instagram.com/maluba_blooms/reel/DcyVuMvti-c/",
        "https://www.instagram.com/maluba_blooms/p/DciRwXijZeh/",
        "https://www.instagram.com/maluba_blooms/p/DcIydkltoHO/",
        "https://www.instagram.com/maluba_blooms/p/DbQiypCjahh/",
        "https://www.instagram.com/maluba_blooms/p/DbU06XojZrH/",
    ],
];
