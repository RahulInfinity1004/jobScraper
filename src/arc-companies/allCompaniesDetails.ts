import puppeteer from "puppeteer-extra";
import StealthPlugins from "puppeteer-extra-plugin-stealth"
import * as cheerio from 'cheerio'
import fs from 'fs';
import data from './company_post.json';
// import data from './companyTest.json';
import json2md from "json2md";
import RandomUserAgent from 'puppeteer-extra-plugin-anonymize-ua'
import UserAgent from "user-agents";
import { Browser, Page, Puppeteer } from "puppeteer";
import { generateUserAgents } from "../twitter/generateUserAgent";
var json2xls = require('json2xls');

puppeteer.use(StealthPlugins());
puppeteer.use(RandomUserAgent({
    customFn: () => new UserAgent().random().toString(),
}));

interface ITech {
    frontend: string[],
    backend: string[]
}
interface Ifunding {
    [key: string]: string
}

interface CompanyDetails {
    companyName: string;
    work_description: string;
    description: string;
    location: string;
    // industry?: string;
    companySize: string;
    summary: string;
    logo: string;
    socialLinks: string[];
    technologies: ITech,
    locationtype: string;
    fundingDetails: Ifunding
}
async function coreLogic(page: Page, url: string, allCurrentJobs:Array<CompanyDetails>) {
    const generatedUserAgents = generateUserAgents(1000);
    const randomUserAgent =
        generatedUserAgents[Math.floor(Math.random() * generatedUserAgents.length)];
    // console.log("Random User-Agent:", randomUserAgent);
    await page.setUserAgent(randomUserAgent);

    await page.goto(url,{ waitUntil: 'load', timeout: 0 });
    await page.waitForSelector('.social-links');
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000)));
    const content = await page.content();
    // console.log({content});
    const $ = cheerio.load(content);
    const companyName = $('.sc-f9a8cff6-0').find('.company-name').text();
    const work_description = $('.sc-6dce503-2.cNhLuN.info.description').text().trim();
    const locationtype = $('.sc-6dce503-0').text().trim();
    // const industry = $('[data-testid="industries"]').text().trim();
    const summary = $('.summary').text().trim();
    const logo = $('.company-logo img').attr('src'); // Selector for the company logo image
    const description = $('.sc-911c1307-0').find('.description').text().trim();
    // const companySize = $('div[data-testid="industries"]').next('div').text().trim();
    const companySize = $('.sc-6dce503-1').next('div').text().trim();
    // const location = $('div[data-testid="industries"]').next('div').next('div').text().trim();
    const location = $('.sc-6dce503-1').next('div').next('div').text().trim();
    // Social links extraction
    const socialLinks: string[] = [];
    $('.social-links a').each((_, element) => {
        const href = $(element).attr('href');
        // console.log(href);
        if (href) socialLinks.push(href);
    });
   
    async function scrapeTechnologies() {
        const technologies:ITech = {
            frontend: [],
            backend: []
        };
        try {
            // Wait for the technologies container if it exists
            await page.waitForSelector('.sc-b4c662ee-2.gwgdVg', { timeout: 5000 });
            console.log('Technologies container found.');
        } catch {
            console.log('Technologies container not found. Skipping technology scraping.');
            return technologies; // Return empty if the container is not found
        }
        // Get front-end technologies
        // await page.waitForSelector('div.sc-b4c662ee-2.gwgdVg'); // Ensure the section is loaded
        const frontendContent = await page.content();
        let $ = cheerio.load(frontendContent);

        const frontendTech: string[] = [];
        $('div[role="listitem"]').each((_, element) => {
            const techName = $(element).attr('aria-label');
            if (techName) {
                frontendTech.push(techName);
            }
        });
        technologies.frontend = frontendTech;
        // console.log(technologies);
        const clicked = await page.$$eval('.sc-b4c662ee-1 *', (elements) => {
            const targetElement = elements.find((el) => el.textContent.trim().includes('Back-end'));
            if (targetElement) {
                (targetElement as HTMLElement).click(); // Perform an untrusted click
                return true; // Click was successful
            }
            return false; // Click was not performed
        });
    
        if (clicked) {
            console.log('Clicked on "Back-end" using untrusted clicks.');

            const content = await page.content();
            const $ = cheerio.load(content);
            await new Promise(resolve => setTimeout(resolve, 2000));
            const backendTech: string[] = [];

            $('div[role="listitem"]').each((_, element) => {
                const techName = $(element).attr('aria-label');
                if (techName) {
                    backendTech.push(techName);
                }
            });
            technologies.backend = backendTech;
            // console.log(technologies)
        } else {
            console.log('"Back-end" element not found or not clicked.');
        }

        const clickedFrontend = await page.$$eval('.sc-b4c662ee-1 *', (elements) => {
            const targetElement = elements.find((el) => el.textContent.trim().includes('Front-end'));
            if (targetElement) {
                (targetElement as HTMLElement).click(); // Perform an untrusted click
                return true; // Click was successful
            }
            return false; // Click was not performed
        });
    
        if (clickedFrontend) {
            console.log('Clicked on "Front-end" using untrusted clicks.');

            const content = await page.content();
            const $ = cheerio.load(content);
            await new Promise(resolve => setTimeout(resolve, 2000));
            const frontendTech: string[] = [];

            $('div[role="listitem"]').each((_, element) => {
                const techName = $(element).attr('aria-label');
                if (techName) {
                    frontendTech.push(techName);
                }
            });
            technologies.frontend = frontendTech;
            // console.log(technologies)
        } else {
            console.log('Front-end" element not found or not clicked.');
        }
        // console.log(technologies);

        return technologies;
    }

    async function scrapeFundingDetails() {
        const content = await page.content();
        const $ = cheerio.load(content);

        const fundingDetails:Ifunding = {};

        $('section.sc-bee39c5-0 .sc-bee39c5-3').each((_, element) => {
            const title = $(element).find('h4').text().trim();
            const value = $(element).find('div').last().text().trim();
            fundingDetails[title] = value;
        });

        return fundingDetails;
    }

    const fundingDetails = await scrapeFundingDetails();
    // console.log(fundingDetails);
    const technologies = await scrapeTechnologies();

    console.log({
        companyName,
        work_description,
        description,
        location,
        // industry,
        summary,
        logo,
        socialLinks,
        technologies,
        fundingDetails,
        companySize,
        locationtype: locationtype.split('\n')[0]
    });
    allCurrentJobs.push({
        companyName,
        work_description,
        description,
        location,
        // industry,
        summary,
        logo,
        socialLinks,
        technologies,
        fundingDetails,
        companySize,
        locationtype: locationtype.split('\n')[0]
    });
}
function saveLocally(allCurrentJobs: Array<CompanyDetails>) {
    // console.log({save: allCurrentJobs});
    const xls = json2xls(allCurrentJobs);
    const mdData = json2md(
        allCurrentJobs.map((company, i) => ({
          table: {
            headers: ['Company', 'Logo', 'Company Size', 'Location', 'Summary'],
            rows: [
              [
                `${i + 1}. ${company.companyName}`,
                `![Logo](${company.logo})`,
                company.companySize,
                company.location,
                company.summary
              ]
            ]
          }
        }))
      );
    
      const mdData1 = json2md(
        allCurrentJobs.map((company, i) => ({
          h2: `${i + 1}. ${company.companyName}`,
        //   img: company.logo,
          p: [
            `**Company Size**: ${company.companySize}`,
            `**Location**: ${company.location}`,
            `**Summary**: ${company.summary}`,
            `**Social Links**: ${company.socialLinks.join(', ')}`
          ],
          table: {
            headers: ['Frontend Technologies', 'Backend Technologies'],
            rows: [
              [
                company.technologies.frontend.join(', '),
                company.technologies.backend.join(', ')
              ]
            ]
          }
        }))
      );
    
      const mdData2 = json2md(
        allCurrentJobs.map((company, i) => ({
          h2: `${i + 1}. ${company.companyName}`,
        //   img: company.logo,
          p: [
            `**Company Size**: ${company.companySize}`,
            `**Location**: ${company.location}`,
            `**Summary**: ${company.summary}`,
            `**Social Links**: ${company.socialLinks.join(', ')}`
          ],
          table: {
            headers: ['Frontend Technologies', 'Backend Technologies'],
            rows: [
              [
                company.technologies.frontend.join(', '),
                company.technologies.backend.join(', ')
              ]
            ]
          }
        }))
      );
    const json_data = JSON.stringify(allCurrentJobs);
    // console.log({json_data});
    const date = new Date().toLocaleDateString().replaceAll('/', '-');
    fs.writeFileSync(`allCompany/company_${date}_post.json`, json_data);
    fs.writeFileSync(`allCompany/company_${date}_post.md`, mdData);
    fs.writeFileSync(`allCompany/company_${date}_post1.md`, mdData1);
    fs.writeFileSync(`allCompany/company_${date}_post2.md`, mdData2);
    fs.writeFileSync(`allCompany/company_${date}_post.xlsx`, xls, 'binary');
}
async function scrapeYC(headless: boolean) {
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
    // console.log("Random User-Agent:", randomUserAgent);
    await page.setUserAgent(randomUserAgent);
    // await page.goto("https://httpbin.io/user-agent");
    // const bodyText1 = await page.evaluate(() => {
    //     return document.body.innerText;
    // });
    const allCurrentJobs: Array<CompanyDetails> = [];
    // console.log(allCurrentJobs);
    // await coreLogic(page, `${url}`, allCurrentJobs);
    // await coreLogic(page,url,allCurrentJobs);

    // not included 95
    for (let i=0;i <5;i++){
        console.log("Scraping NO : ", i);
        await coreLogic(page,data.data[i].companyLink, allCurrentJobs);
    }
    saveLocally(allCurrentJobs);
    await browser.close();
}
(async () => {
    await scrapeYC(true);
})();

