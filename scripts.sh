PROJECT_NAME="Project for Youtube API"
PROJECT_ID="youtube-api-295617"

function Main() {
  local COMMAND="${1}"; shift
  case "${COMMAND}" in
    setup-project)
      echo ":: Creating project..."
      gcloud projects create "${PROJECT_ID}" --name="${PROJECT_NAME}" --no-enable-cloud-apis
      echo ":: Enabling Youtube Data API..."
      gcloud --project="${PROJECT_ID}" services enable youtube.googleapis.com
      echo ":: Visit this link to obtain API key >"
      echo "https://console.developers.google.com/apis/credentials?project=${PROJECT_ID}"
    ;;

    cleanup-project)
      gcloud projects delete "${PROJECT_ID}"
    ;;

    fixtures)
      local KEY=$(jq -r '.youtube_api_key' < secrets.json)

      local SUB_COMMAND="${1}"; shift
      case "${SUB_COMMAND}" in
        videos)
          local ENDPOINT='https://www.googleapis.com/youtube/v3/videos'
          local VIDEO_ID='Q_v2Pc-ew28'
          local PARTS=(
            contentDetails
            # fileDetails
            id
            liveStreamingDetails
            localizations
            player
            # processingDetails
            recordingDetails
            snippet
            statistics
            status
            # suggestions
            topicDetails
          )
          local PARAMS=(
            key=${KEY}
            id=${VIDEO_ID}
            part=$(IFS=','; echo "${PARTS[*]}")
          )
          curl "${ENDPOINT}?$(IFS='&'; echo "${PARAMS[*]}")" | tee fixtures/videos.json
        ;;

        playlists)
          local ENDPOINT='https://www.googleapis.com/youtube/v3/playlists'
          local PLAYLIST_ID='PL7sA_SkHX5ye8sYG5tOdvGfNZef5b7hx7'
          local PARTS=(
            contentDetails
            id
            localizations
            player
            snippet
            status
          )
          local PARAMS=(
            key=${KEY}
            id=${PLAYLIST_ID}
            part=$(IFS=','; echo "${PARTS[*]}")
          )
          curl "${ENDPOINT}?$(IFS='&'; echo "${PARAMS[*]}")" | tee fixtures/playlists.json
        ;;

        playlistItems)
          local ENDPOINT='https://www.googleapis.com/youtube/v3/playlistItems'
          local PLAYLIST_ID='PL7sA_SkHX5ye8sYG5tOdvGfNZef5b7hx7'
          local PARTS=(
            contentDetails
            id
            snippet
            status
          )
          local PARAMS=(
            key=${KEY}
            playlistId=${PLAYLIST_ID}
            part=$(IFS=','; echo "${PARTS[*]}")
            maxResults=50
          )
          curl "${ENDPOINT}?$(IFS='&'; echo "${PARAMS[*]}")" | tee fixtures/playlistItems.json
        ;;

        channels)
          local ENDPOINT='https://www.googleapis.com/youtube/v3/channels'
          local CHANNEL_ID='UCYS8BOA0Y7nGY7kJJw8hvAA'
          local PARTS=(
            # auditDetails
            brandingSettings
            contentDetails
            contentOwnerDetails
            id
            localizations
            snippet
            statistics
            status
            topicDetails
          )
          local PARAMS=(
            key=${KEY}
            id=${CHANNEL_ID}
            part=$(IFS=','; echo "${PARTS[*]}")
          )
          curl "${ENDPOINT}?$(IFS='&'; echo "${PARAMS[*]}")" | tee fixtures/channels.json
        ;;

        search)
          local ENDPOINT='https://www.googleapis.com/youtube/v3/search'
          local CHANNEL_ID='UCYS8BOA0Y7nGY7kJJw8hvAA'
          local PARTS=(
            id
            snippet
          )
          local PARAMS=(
            key=${KEY}
            channelId=${CHANNEL_ID}
            part=$(IFS=','; echo "${PARTS[*]}")
            order=date
            type=video
            maxResults=50
          )
          curl "${ENDPOINT}?$(IFS='&'; echo "${PARAMS[*]}")" | tee fixtures/search.json
        ;;
      esac
    ;;

    --)
      gcloud --project="${PROJECT_ID}" "${@}"
    ;;

    *) echo ":: Command not found > ${@}" ;;
  esac
}

Main "${@}"
