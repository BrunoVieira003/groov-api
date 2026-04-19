export const lyricLineRegex = /\[\d\d:\d\d\.\d\d\][\s\S]*/g
export const lyricHeaderRegex = /\[[A-Za-z][A-Za-z]:[A-Za-z]+\]/g
export const lyricTimestampRegex = /\[\d+:\d*.\d*\][\s\S]*/i

export function extractTimestampToMilliseconds(text: string){
    const rawTimestamp = lyricTimestampRegex.exec(text)?.[0]
    if(!rawTimestamp){
        return undefined
    }

    const timestamp = rawTimestamp.replace('[', '').replace(']', '')
    const minutes = parseFloat(timestamp.split(':')[0]) * 60000
    const seconds = parseFloat(timestamp.split(':')[1])

    return minutes + seconds
}