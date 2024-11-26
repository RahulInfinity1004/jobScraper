import puppeteer from "puppeteer-extra";
import StealthPlugins from "puppeteer-extra-plugin-stealth"
import * as cheerio from 'cheerio'
import RandomUserAgent from 'puppeteer-extra-plugin-anonymize-ua'
import UserAgent from "user-agents";
puppeteer.use(StealthPlugins());
puppeteer.use(RandomUserAgent({
    customFn: () => new UserAgent().random().toString(),
}));

async function scrapTwitter(url: string, headless: boolean) {
    const browser = await puppeteer.launch({
        headless: headless,
    });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
    });
    await page.setViewport({
        width: Math.floor(Math.random() * (1920 - 1024)) + 1024,
        height: Math.floor(Math.random() * (1080 - 768)) + 768,
    });
    // creating my own user agents 
    function generateUserAgents(count: number): string[] {
        const userAgents: string[] = [];
        const baseOS = [
            "X11; Linux i686",
            "X11; Linux x86_64",
            "X11; Ubuntu i686",
            "X11; Ubuntu x86_64",
            "X11; Fedora i686",
        ];
        const baseChromeVersion = 111;
        const subVersionMax = 500;
        const webkitVersion = "537.36";
        const safariVersion = "537.36";

        for (let i = 0; i < count; i++) {
            const os = baseOS[Math.floor(Math.random() * baseOS.length)];
            const chromeVersion = `${baseChromeVersion}.${Math.floor(
                Math.random() * subVersionMax
            )}.${Math.floor(Math.random() * 100)}`;
            const userAgent = `Mozilla/5.0 (${os}) AppleWebKit/${webkitVersion} (KHTML, like Gecko) Chrome/${chromeVersion} Safari/${safariVersion}`;
            userAgents.push(userAgent);
        }

        return userAgents;
    }

    const generatedUserAgents = generateUserAgents(100);
    const randomUserAgent =
        generatedUserAgents[Math.floor(Math.random() * generatedUserAgents.length)];
    console.log("Random User-Agent:", randomUserAgent);
    await page.setUserAgent(randomUserAgent);
    await page.goto("https://httpbin.io/user-agent");
    const bodyText1 = await page.evaluate(() => {
        return document.body.innerText;
    });
    console.log(bodyText1);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 3000) + 1000));
    const content = await page.content();
    const $ = cheerio.load(content);
    const tweetText = $('div[data-testid="tweetText"]').text();
    const tweetUser = $('div[data-testid="User-Name"]').text();
    const tweetPhotos: Array<string> = [];
    $('div[data-testid="tweetPhoto"] > img').each((_, element) => {
        const photoUrl = $(element).attr('src');
        if (photoUrl) {
            tweetPhotos.push(photoUrl);
        }
    });
    const username_and_id = tweetUser.split('@');
    await browser.close();
    // console.log({ tweetUrl: url, Username: username_and_id[0], twitterUsername: '@' + username_and_id[1], tweetText, tweetPhotos })
    return { tweetUrl: url, username: username_and_id[0], twitterUsername: '@' + username_and_id[1], tweetText, tweetPhotos }
}
(async () => {
    const dataScrap = await scrapTwitter('https://x.com/juberti/status/1861123495897465273', true);
    console.log({ dataScrap });
})();