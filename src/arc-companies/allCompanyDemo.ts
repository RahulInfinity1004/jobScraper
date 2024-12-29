import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio'
import {chromium} from "playwright"
interface ITech {
    frontend: string[],
    backend: string[]
}

interface Ifunding {
    [key: string]: string
}

interface ISocialMedia {
    [key: string]: string
}

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const url = 'https://arc.dev/company/coinbase'; // Replace with the actual URL
    await page.goto(url, { waitUntil: 'load', timeout: 0 });

    // Wait for the main elements to load
    await page.waitForSelector('body');

    // Helper function to extract company details
    async function scrapeCompanyDetails() {
        const content = await page.content();
        const $ = cheerio.load(content);

        const companyDetails = {
            name: $('.company-name').text().trim(),
            description: $('div.sc-6dce503-2.cNhLuN.info.description').text().trim(),
            location: $('div.sc-6dce503-0.cOErjQ').text().trim(),
            industry: $('[data-testid="industries"]').text().trim(),
            size: $('.sc-6dce503-0').text().trim(),
            summary: $('.summary').text().trim(),
        };

        return companyDetails;
    }

    // Helper function to scrape technologies
    async function scrapeTechnologies() {
        const technologies:ITech = {
            frontend: [],
            backend: []
        };


        // Get front-end technologies
        await page.waitForSelector('div.sc-b4c662ee-2.gwgdVg'); // Ensure the section is loaded
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

        // Switch to backend technologies
        // await page.click('div.sc-b4c662ee-1.kPapSH div:contains("Back-end")');
        // // await page.waitForTimeout(2000); // Wait for backend tech to load
        // const backendContent = await page.content();
        // $ = cheerio.load(backendContent);

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
        } else {
            console.log('"Back-end" element not found or not clicked.');
        }

        const backendTech: string[] = [];
        $('div[role="listitem"]').each((_, element) => {
            const techName = $(element).attr('aria-label');
            if (techName) {
                backendTech.push(techName);
            }
        });
        technologies.backend = backendTech;

        return technologies;
    }

    // Helper function to scrape funding details
    async function scrapeFundingDetails() {
        const content = await page.content();
        const $ = cheerio.load(content);

        const fundingDetails: Ifunding = {};

        $('section.sc-bee39c5-0 .sc-bee39c5-3').each((_, element) => {
            const title = $(element).find('h4').text().trim();
            const value = $(element).find('div').last().text().trim();
            fundingDetails[title] = value;
        });

        return fundingDetails;
    }

    // Helper function to scrape social media links
    async function scrapeSocialMedia() {
        const content = await page.content();
        const $ = cheerio.load(content);

        const socialMediaLinks: Array<ISocialMedia> = [];
        $('a[href^="http"]').each((_, element) => {
            const link = $(element).attr('href');
            const iconAlt = $(element).find('img').attr('alt');
            if (link && iconAlt) {
                socialMediaLinks.push({ platform: iconAlt, link });
            }
        });

        return socialMediaLinks;
    }

    // Execute all scraping tasks
    const companyDetails = await scrapeCompanyDetails();
    const technologies = await scrapeTechnologies();
    const fundingDetails = await scrapeFundingDetails();
    const socialMedia = await scrapeSocialMedia();

    // Combine all results
    const result = {
        companyDetails,
        technologies,
        fundingDetails,
        socialMedia,
    };

    console.log(result);

    await browser.close();
})();
