```
# Generate icons
$ curl https://fonts.gstatic.com/s/i/materialicons/rss_feed/v1/24px.svg > rss_feed.svg
$ cp rss_feed.svg rss_feed-512.svg
$ # Edit rss_feed-512.svg from `width="512" height="512" viewBox="0 0 24 24"` to `width="512" height="512" viewBox="0 0 24 24"`
$ for px in 32 192 1024; do convert -resize "${px}x${px}" -background none rss_feed-512.svg "icon-${px}.png"; done
```
