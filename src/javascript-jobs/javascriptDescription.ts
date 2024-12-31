import puppeteer from "puppeteer-extra";
import StealthPlugins from "puppeteer-extra-plugin-stealth"
import * as cheerio from 'cheerio'
import fs from 'fs';
import data from './javascript_data.json';
import json2md from "json2md";
import RandomUserAgent from 'puppeteer-extra-plugin-anonymize-ua'
import UserAgent from "user-agents";
import { Browser, Page } from "puppeteer";
import { generateUserAgents } from "../twitter/generateUserAgent";
var json2xls = require('json2xls');

puppeteer.use(StealthPlugins());
puppeteer.use(RandomUserAgent({
    customFn: () => new UserAgent().random().toString(),
}));
interface Jobs {
    [key: string]: string
}
async function coreLogic(page: Page, url: string, allCurrentJobs:Array<Jobs>) {
    const generatedUserAgents = generateUserAgents(1000);
    const randomUserAgent =
        generatedUserAgents[Math.floor(Math.random() * generatedUserAgents.length)];
    await page.setUserAgent(randomUserAgent);
    await page.goto(url,{ waitUntil: 'load', timeout: 0 });
    await page.waitForSelector('[class="container"]');
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000)+ 500));
    const content = await page.content();
    const $ = cheerio.load(content);
    const regex = /^Full Time\s*\n\s*\n\s*Remote$/;

    const description = $('.job-description-container').text().trim();
    const company_link = $('.!tw-flex-shrink-0').attr('href');
   const applyNowLink = $('a:contains("Apply Now")').attr('href');
    // const requirement = $('.job-description-container').next('ul').next('ul').text();
    // const qualifications = $('.job-description-container').next('ul').next('ul').next('ul').text();
    function cleanText(inputText: string): string {
        return inputText.replace(/[\s]*[\n+]+[\s]*/g, '');
    }
    allCurrentJobs.push({
        cleanDescription: cleanText(description), applyNowLink, description,company_link
    })

    console.log(allCurrentJobs);
    return allCurrentJobs;
}
function saveLocally(allCurrentJobs: Array<Jobs>) {
    const xls = json2xls(allCurrentJobs);
    // const mdData = json2md([
    //     {
    //         table: {
    //             headers: [
    //                 'Company', 
    //                 'Logo', 
    //                 'Title', 
    //                 'Role', 
    //                 'Type of Role', 
    //                 'Location', 
    //                 'Date', 
    //                 'Apply Here'
    //             ],
    //             rows: allCurrentJobs.map((company, i) => [
    //                 `${i + 1}. ${company.companyName}`,
    //                 `![Logo](${company.companyPhoto})`,
    //                 company.JobTitle || "",
    //                 company.role || "",
    //                 company.typeOfRole || "",
    //                 company.location || "",
    //                 company.dayofPosting || "",
    //                 `[Apply Here](${company.link})`
    //             ])
    //         }
    //     }
    // ]);
    const json_data = JSON.stringify(allCurrentJobs);
    const date = new Date().toLocaleDateString().replaceAll('/', '-');
    fs.writeFileSync(`javascript-jobs-post/company_description_${date}_post.json`, json_data);
    fs.writeFileSync(`javascript-jobs-post/company_description_${date}_post.xlsx`, xls, 'binary');
}
async function scrapeYC(url: string, headless: boolean) {
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
    const generatedUserAgents = generateUserAgents(1000);
    const randomUserAgent =
        generatedUserAgents[Math.floor(Math.random() * generatedUserAgents.length)];
        await page.setUserAgent(randomUserAgent);
    console.log("Random User-Agent:", randomUserAgent);
    // const returnScrapData = await coreLogic(page, url);
    const allCurrentJobs: Array<Jobs> = [];
    // for(let i=1;i<=40;i++){
    //     await coreLogic(page, `${url}${i==1? '':`?page=${i}`}`, allCurrentJobs);
    // }
    for (let i=0;i <data.data.length;i++){
        console.log("Scraping NO : ", i);
        await coreLogic(page,data.data[i].link, allCurrentJobs);
    }
    await coreLogic(page, `${url}`, allCurrentJobs);
    console.log("saving locally");
    saveLocally(allCurrentJobs);
    await browser.close();
    // return returnScrapData;
}
(async () => {
    const dataScrap = await scrapeYC('https://javascript.jobs/job/front-end-react-developer-remote', true);
    console.log({ dataScrap });
})();
