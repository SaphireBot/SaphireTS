export interface YouTubeSearchResponse {
  error?: { code: number }
  kind: "youtube#searchListResponse"
  etag: string
  nextPageToken: string
  prevPageToken: string
  regionCode: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
  items: YouTubeVideoResponse[]
}
export interface YouTubeVideoResponse {
  kind: "youtube#searchResult"
  etag: string
  id: VideoID | ChannelID | PlaylistID
  snippet: Snippet
}

export type VideoID = {
  kind: "youtube#video"
  videoId: string
};

export type ChannelID = {
  kind: "youtube#channel"
  channelId: string
};

export type PlaylistID = {
  kind: "youtube#playlist"
  playlistId: string
};

type Snippet = {
  publishedAt: string
  channelId: string
  title: string
  description: string
  thumbnails: YoutubeThumbnails
  channelTitle: string
  liveBroadcastContent: string
  publishTime: string
};

type YoutubeThumbnails = {
  default: ThumbanailParam
  medium: ThumbanailParam
  high: ThumbanailParam
};

type ThumbanailParam = {
  url: string
  width: number
  height: number
};