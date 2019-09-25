Podcastify

https://podcastify.hiogawa.now.sh


Motivation

- Create podcast-form of RSS feed endpoint from youtube channel or playlist url
- By loading such RSS into existing podcast app,
  it makes easy to handle audio version of youtube data.


TODO

- Overall, download is quite slow.
  - probably google's endpoint isn't optimized for bulk download.
  - probably client doesn't use "manually chunked range" requests as used in youtube-dl


Tested podcast clients

- https://nodetics.com/feedbro/
- https://github.com/CDrummond/cantata
- https://castbox.fm
- https://antennapod.org (streaming doesn't work)


```
# Development
$ npm run dev      # rss endpoint
$ npm run frontend # frontend html page

# Testing
$ npm test

# Deployment (hosted on Zeit Now)
$ npm run deploy
```


Example

```
[ channel ]
https://www.youtube.com/channel/UCklUqFEcJqFnWKEBozw5p4g
=>
https://www.youtube.com/feeds/videos.xml?channel_id=UCklUqFEcJqFnWKEBozw5p4g
=>
http://localhost:8080/rss?type=channel&id=UCklUqFEcJqFnWKEBozw5p4g


[ playlist ]
https://www.youtube.com/playlist?list=PLFPXn0FXBEuEiDDbjTh819LThGqUEWaYM
=>
https://www.youtube.com/feeds/videos.xml?playlist_id=PLFPXn0FXBEuEiDDbjTh819LThGqUEWaYM
=>
http://localhost:8080/rss?type=playlist&id=PLFPXn0FXBEuEiDDbjTh819LThGqUEWaYM


[ video ]
https://www.youtube.com/watch?v=IPS8jTWya8Y
=>
http://localhost:8080/enclosure?videoUrl=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DIPS8jTWya8Y
```


Fixtures

- https://www.youtube.com/feeds/videos.xml?channel_id=UCfwHdaVGSYsiNZxVURboBmw
- https://www.youtube.com/feeds/videos.xml?playlist_id=PL7sA_SkHX5ye1jL-nXKvYVMeKFBj-PDTR
- https://anchor.fm/s/6f65684/podcast/rss


References

- https://help.apple.com/itc/podcasts_connect/#/itcb54353390
