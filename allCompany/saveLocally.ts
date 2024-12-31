
import fs from 'fs';
// import data from './next_1800.json';

import json2md from "json2md";

var json2xls = require('json2xls');

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

interface JsonData {
  data: CompanyDetails[];
}

import data from './next_1800.json';
const jsonData = data as JsonData;

function saveLocally(allCurrentJobs: Array<CompanyDetails>) {
    // console.log({save: allCurrentJobs});

    const xls = json2xls(allCurrentJobs);
    const mdData = json2md([
      {
        table: {
          headers: ['Company', 'Logo', 'Company Size', 'Location', 'Summary'],
          rows: allCurrentJobs.map((company, i) => [
            `${i + 1}. ${company.companyName}`,
            `[![Logo](${company.logo})](${company.socialLinks[0]})`, // Clickable logo linking to the website
            company.companySize,
            company.location,
            company.summary
          ])
        }
      }
    ]);
    
      // const mdData = json2md(
      //   allCurrentJobs.map((company, i) => ({
      //     h2: `${i + 1}. ${company.companyName}`,
      //   //   img: company.logo,
      //     p: [
      //       `**Company Size**: ${company.companySize}`,
      //       `**Location**: ${company.location}`,
      //       `**Summary**: ${company.summary}`,
      //       `**Social Links**: ${company.socialLinks.join(', ')}`
      //     ],
      //     table: {
      //       headers: ['Frontend Technologies', 'Backend Technologies'],
      //       rows: [
      //         [
      //           company.technologies.frontend.join(', '),
      //           company.technologies.backend.join(', ')
      //         ]
      //       ]
      //     }
      //   }))
      // );
      
      
    const json_data = JSON.stringify(allCurrentJobs);
    // console.log({json_data});
    const date = new Date().toLocaleDateString().replaceAll('/', '-');
    // fs.writeFileSync(`allCompany/company_${date}_post.json`, json_data);
    fs.writeFileSync(`allCompany/demo_company_${date}_post.md`, mdData);

    // fs.writeFileSync(`allCompany/company_${date}_post.xlsx`, xls, 'binary');
}
saveLocally(jsonData.data);
// x();