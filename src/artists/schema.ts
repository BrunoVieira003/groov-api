import { t } from "elysia";

export const artistQuerySchema = t.Object({
    sortField: t.UnionEnum(['name'], {default: 'name'}),
    sortOrder: t.UnionEnum(['asc', 'desc'], {default: 'asc'})
})