import Koa from 'koa';

let counts: { [name: string]: number } = {};

export function clearHitCheck() {
    counts = {};
}

export function getCount(name: string) {
    return counts[name] || 0;
}

export function apply(app: Koa) {
    app.use(async (ctx, next) => {
        const { path } = ctx;
        if (!counts[path]) {
            counts[path] = 0;
        }
        counts[path]++;
        await next();
    });
}

