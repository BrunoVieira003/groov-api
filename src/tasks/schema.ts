import { t } from "elysia";

export const getProgressParams = t.Object({
    taskType: t.Union([
        t.Literal("scan-folder"),
        t.Literal("upload"),
        t.Literal("prune-songs"),
    ]),
    taskId: t.String()
})