import { sequence } from "astro:middleware";

async function validation(_, next) {
    const response = await next();
    return response;
}

async function auth(_, next) {
    const response = await next();
    return response;
}

async function collect(_, next) {
    const w = await fetch('https://the-cf-vue.realcpf.tech/collect')
    const response = await next();
    return response;
}

export const onRequest = sequence(validation, auth, collect);